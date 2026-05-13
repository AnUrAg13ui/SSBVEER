from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.database import get_db, format_mongo_doc
from app.routers.auth import get_current_user
from pydantic import BaseModel
from bson.objectid import ObjectId

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SaveTestResult(BaseModel):
    test_id: str
    score: int
    total_questions: int
    time_taken: int       # seconds
    category: str
    answers: Optional[dict] = None  # {question_id: answer_text}

class SaveInterviewResult(BaseModel):
    confidence_score: int
    clarity_score:    int
    transcript:       Optional[str] = ""
    feedback:         Optional[str] = ""


# ─── Save endpoints ────────────────────────────────────────────────────────────

@router.post("/save-test")
def save_test_result(
    data: SaveTestResult,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Determine if this is a subjective test needing admin grading
    subjective = data.category.upper() in ["WAT", "SRT", "PPDT"]
    
    record = {
        "user_id": current_user["id"],
        "test_id": data.test_id,
        "score": data.score,
        "total_questions": data.total_questions,
        "time_taken": data.time_taken,
        "category": data.category,
        "completed_at": datetime.utcnow(),
        "answers": data.answers or {},
        "graded": not subjective,  # OIR is auto-graded, subjective needs admin review
        "admin_score": None,
        "admin_feedback": None,
    }
    db.user_tests.insert_one(record)
    return {"message": "Test result saved"}


@router.post("/save-interview")
def save_interview_result(
    data: SaveInterviewResult,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    record = {
        "user_id": current_user["id"],
        "transcript": data.transcript,
        "feedback": data.feedback,
        "confidence_score": data.confidence_score,
        "clarity_score": data.clarity_score,
        "created_at": datetime.utcnow()
    }
    db.mock_interviews.insert_one(record)
    return {"message": "Interview result saved"}


# ─── History — paginated (Issue 18) ───────────────────────────────────────────

@router.get("/history")
def get_user_history(
    skip: int = 0,
    limit: int = 20,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]

    user_tests_cursor = db.user_tests.find({"user_id": uid}).sort("completed_at", -1).skip(skip).limit(limit)
    user_tests = list(user_tests_cursor)

    tests_result = []
    for ut in user_tests:
        try:
            tid = ObjectId(ut["test_id"]) if len(ut["test_id"]) == 24 else ut["test_id"]
            t = db.tests.find_one({"_id": tid})
        except:
            t = None
            
        tests_result.append({
            "id": str(ut["_id"]),
            "title": t["title"] if t else "Unknown",
            "category": ut.get("category", t["category"] if t else "Unknown"),
            "score": ut["score"],
            "total_questions": ut.get("total_questions", 0),
            "time_taken": ut["time_taken"],
            "completed_at": ut["completed_at"].isoformat() if ut.get("completed_at") else None,
        })

    interviews_cursor = db.mock_interviews.find({"user_id": uid}).sort("created_at", -1).skip(skip).limit(limit)
    interviews = list(interviews_cursor)
    
    interviews_result = []
    for i in interviews:
        interviews_result.append({
            "id": str(i["_id"]),
            "confidence_score": i.get("confidence_score", 0),
            "clarity_score": i.get("clarity_score", 0),
            "feedback": i.get("feedback", ""),
            "created_at": i["created_at"].isoformat() if i.get("created_at") else None,
        })

    return {
        "tests": tests_result,
        "interviews": interviews_result
    }


@router.get("/test-result/{result_id}")
def get_test_result_detail(
    result_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        obj_id = ObjectId(result_id) if len(result_id) == 24 else result_id
        result = db.user_tests.find_one({"_id": obj_id, "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Result not found")

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    try:
        tid = ObjectId(result["test_id"]) if len(result["test_id"]) == 24 else result["test_id"]
        test = db.tests.find_one({"_id": tid})
    except:
        test = None

    return {
        "id": str(result["_id"]),
        "score": result.get("score", 0),
        "time_taken": result.get("time_taken", 0),
        "completed_at": result["completed_at"].isoformat() if result.get("completed_at") else None,
        "test": {
            "title": test["title"] if test else "Unknown",
            "category": test["category"] if test else "Unknown",
            "description": test.get("description", "") if test else "",
            "duration_seconds": test.get("duration_seconds", 0) if test else 0,
        }
    }


@router.get("/interview-result/{interview_id}")
def get_interview_detail(
    interview_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        obj_id = ObjectId(interview_id) if len(interview_id) == 24 else interview_id
        interview = db.mock_interviews.find_one({"_id": obj_id, "user_id": current_user["id"]})
    except Exception:
        raise HTTPException(status_code=404, detail="Interview not found")

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    return {
        "id": str(interview["_id"]),
        "transcript": interview.get("transcript", ""),
        "feedback": interview.get("feedback", ""),
        "confidence_score": interview.get("confidence_score", 0),
        "clarity_score": interview.get("clarity_score", 0),
        "created_at": interview["created_at"].isoformat() if interview.get("created_at") else None
    }


@router.get("/stats")
def get_dashboard_stats(
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = current_user["id"]

    # ── Test stats ────────────────────────────────────────────────────────────
    all_tests = list(db.user_tests.find({"user_id": uid}).sort("completed_at", -1))

    tests_attempted = len(all_tests)

    category_scores: dict[str, list[int]] = {}
    for ut in all_tests:
        cat = ut.get("category", "UNKNOWN").upper()
        category_scores.setdefault(cat, []).append(ut.get("score") or 0)

    category_avg: dict[str, float] = {
        cat: round(sum(scores) / len(scores), 1)
        for cat, scores in category_scores.items() if scores
    }

    recent_tests = []
    for ut in all_tests[:10]:
        try:
            tid = ObjectId(ut["test_id"]) if len(ut["test_id"]) == 24 else ut["test_id"]
            t = db.tests.find_one({"_id": tid})
        except:
            t = None
        recent_tests.append({
            "id": str(ut["_id"]),
            "title": t["title"] if t else "Unknown",
            "category": ut.get("category", t["category"] if t else "Unknown"),
            "score": ut.get("score", 0),
            "total_questions": ut.get("total_questions") or (len(t.get("questions", [])) if t else 0),
            "time_taken": ut.get("time_taken", 0),
            "completed_at": ut["completed_at"].isoformat() if ut.get("completed_at") else None,
        })

    # ── Interview stats ───────────────────────────────────────────────────────
    interviews = list(db.mock_interviews.find({"user_id": uid}).sort("created_at", -1))

    interviews_count = len(interviews)
    avg_confidence = round(
        sum(i.get("confidence_score") or 0 for i in interviews) / interviews_count, 1
    ) if interviews_count else 0
    avg_clarity = round(
        sum(i.get("clarity_score") or 0 for i in interviews) / interviews_count, 1
    ) if interviews_count else 0

    recent_interviews = [
        {
            "id": str(i["_id"]),
            "confidence_score": i.get("confidence_score", 0),
            "clarity_score": i.get("clarity_score", 0),
            "feedback": i.get("feedback", ""),
            "created_at": i["created_at"].isoformat() if i.get("created_at") else None,
        }
        for i in interviews[:5]
    ]

    # ── Consecutive-day streak (Issue 19 fix) ─────────────────────────────────
    now_utc = datetime.now(timezone.utc).date()
    activity_dates: set = set()
    for ut in all_tests:
        if ut.get("completed_at"):
            activity_dates.add(ut["completed_at"].date() if hasattr(ut["completed_at"], 'date') else ut["completed_at"])
    for i in interviews:
        if i.get("created_at"):
            activity_dates.add(i["created_at"].date() if hasattr(i["created_at"], 'date') else i["created_at"])

    streak = 0
    check_date = now_utc
    while check_date in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)
    if streak == 0:
        check_date = now_utc - timedelta(days=1)
        while check_date in activity_dates:
            streak += 1
            check_date -= timedelta(days=1)

    active_days_last_30 = sum(
        1 for d in activity_dates if d >= (now_utc - timedelta(days=30))
    )

    # ── Overall score (weighted average) ──────────────────────────────────────
    overall = 0.0
    weights = {"OIR": 0.3, "PPDT": 0.2, "WAT": 0.15, "SRT": 0.15}
    wsum = 0.0
    for cat, avg in category_avg.items():
        w = weights.get(cat, 0.1)
        overall += avg * w
        wsum += w
    if avg_confidence:
        overall += (avg_confidence * 10) * 0.2
        wsum += 0.2
    overall_score = round(overall / wsum, 1) if wsum else 0

    # Fetch institute name for user
    institute_name = None
    if current_user.get("institute_id"):
        try:
            inst_id = current_user["institute_id"]
            inst_obj = ObjectId(inst_id) if len(inst_id) == 24 else inst_id
            institute = db.institutes.find_one({"_id": inst_obj})
            if institute:
                institute_name = institute.get("name")
        except:
            pass

    return {
        "user": {
            "username": current_user.get("username"),
            "full_name": current_user.get("full_name"),
            "member_since": current_user["created_at"].isoformat() if current_user.get("created_at") else None,
            "institute_name": institute_name,
        },
        "summary": {
            "tests_attempted": tests_attempted,
            "interviews_completed": interviews_count,
            "streak": streak,
            "active_days_last_30": active_days_last_30,
            "overall_score": overall_score,
        },
        "category_scores": category_avg,
        "interview_stats": {
            "avg_confidence": avg_confidence,
            "avg_clarity": avg_clarity,
        },
        "recent_tests": recent_tests,
        "recent_interviews": recent_interviews,
    }


@router.get("/leaderboard")
def get_leaderboard(
    category: Optional[str] = "all",
    limit: int = 50,
    db = Depends(get_db),
):
    """
    Leaderboard using a single aggregation query (Issue 8 — N+1 fix).
    Returns users sorted by average test score descending.
    """
    rows = list(db.user_tests.aggregate([
        {
            "$group": {
                "_id": "$user_id",
                "avg_score": {"$avg": "$score"},
                "test_count": {"$sum": 1}
            }
        },
        {"$sort": {"avg_score": -1}},
        {"$limit": limit}
    ]))

    results = []
    rank = 1
    for row in rows:
        uid = row["_id"]
        try:
            obj_id = ObjectId(uid) if len(uid) == 24 else uid
            user = db.users.find_one({"_id": obj_id})
        except:
            user = None

        if not user:
            # Maybe the user was deleted
            user = db.users.find_one({"username": uid})
            if not user: continue

        avg = round(float(row["avg_score"] or 0), 1)
        results.append({
            "rank": rank,
            "id": str(user["_id"]),
            "name": user.get("full_name") or user.get("username"),
            "username": user.get("username"),
            "score": avg,
            "tests": row["test_count"],
            "badge": "Gold" if avg > 85 else ("Silver" if avg > 70 else "Bronze"),
        })
        rank += 1

    return results
