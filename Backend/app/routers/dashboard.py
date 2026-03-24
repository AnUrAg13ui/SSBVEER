from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.routers.auth import get_current_user
from app import models
from pydantic import BaseModel
from fastapi import HTTPException

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class SaveTestResult(BaseModel):
    test_id: int
    score: int
    total_questions: int
    time_taken: int       # seconds
    category: str         # saved directly on UserTest (Issue 20)

class SaveInterviewResult(BaseModel):
    confidence_score: int
    clarity_score:    int
    transcript:       Optional[str] = ""
    feedback:         Optional[str] = ""


# ─── Save endpoints ────────────────────────────────────────────────────────────

@router.post("/save-test")
def save_test_result(
    data: SaveTestResult,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = models.UserTest(
        user_id=current_user.id,
        test_id=data.test_id,
        score=data.score,
        time_taken=data.time_taken,
    )
    db.add(record)
    db.commit()
    return {"message": "Test result saved"}


@router.post("/save-interview")
def save_interview_result(
    data: SaveInterviewResult,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = models.MockInterview(
        user_id=current_user.id,
        transcript=data.transcript,
        feedback=data.feedback,
        confidence_score=data.confidence_score,
        clarity_score=data.clarity_score,
    )
    db.add(record)
    db.commit()
    return {"message": "Interview result saved"}


# ─── History — paginated (Issue 18) ───────────────────────────────────────────

@router.get("/history")
def get_user_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    uid = current_user.id

    tests = (
        db.query(models.UserTest, models.Test)
        .join(models.Test, models.UserTest.test_id == models.Test.id)
        .filter(models.UserTest.user_id == uid)
        .order_by(models.UserTest.completed_at.desc())
        .offset(skip).limit(limit)
        .all()
    )

    interviews = (
        db.query(models.MockInterview)
        .filter(models.MockInterview.user_id == uid)
        .order_by(models.MockInterview.created_at.desc())
        .offset(skip).limit(limit)
        .all()
    )

    return {
        "tests": [
            {
                "id": ut.id,
                "title": t.title,
                "category": t.category,
                "score": ut.score,
                "time_taken": ut.time_taken,
                "completed_at": ut.completed_at.isoformat() if ut.completed_at else None,
            }
            for ut, t in tests
        ],
        "interviews": [
            {
                "id": i.id,
                "confidence_score": i.confidence_score,
                "clarity_score": i.clarity_score,
                "feedback": i.feedback,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in interviews
        ]
    }


@router.get("/test-result/{result_id}")
def get_test_result_detail(
    result_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    result = (
        db.query(models.UserTest)
        .filter(models.UserTest.id == result_id, models.UserTest.user_id == current_user.id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    test = db.query(models.Test).filter(models.Test.id == result.test_id).first()

    return {
        "id": result.id,
        "score": result.score,
        "time_taken": result.time_taken,
        "completed_at": result.completed_at.isoformat() if result.completed_at else None,
        "test": {
            "title": test.title if test else "Unknown",
            "category": test.category if test else "Unknown",
            "description": test.description if test else "",
            "duration_seconds": test.duration_seconds if test else 0,
        }
    }


@router.get("/interview-result/{interview_id}")
def get_interview_detail(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    interview = (
        db.query(models.MockInterview)
        .filter(models.MockInterview.id == interview_id, models.MockInterview.user_id == current_user.id)
        .first()
    )
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    return {
        "id": interview.id,
        "transcript": interview.transcript,
        "feedback": interview.feedback,
        "confidence_score": interview.confidence_score,
        "clarity_score": interview.clarity_score,
        "created_at": interview.created_at.isoformat() if interview.created_at else None
    }


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    uid = current_user.id

    # ── Test stats ────────────────────────────────────────────────────────────
    all_tests = (
        db.query(models.UserTest, models.Test)
        .join(models.Test, models.UserTest.test_id == models.Test.id)
        .filter(models.UserTest.user_id == uid)
        .order_by(models.UserTest.completed_at.desc())
        .all()
    )

    tests_attempted = len(all_tests)

    category_scores: dict[str, list[int]] = {}
    for ut, t in all_tests:
        cat = t.category.upper()
        category_scores.setdefault(cat, []).append(ut.score or 0)

    category_avg: dict[str, float] = {
        cat: round(sum(scores) / len(scores), 1)
        for cat, scores in category_scores.items()
    }

    recent_tests = [
        {
            "id": ut.id,
            "title": t.title,
            "category": t.category,
            "score": ut.score,
            "time_taken": ut.time_taken,
            "completed_at": ut.completed_at.isoformat() if ut.completed_at else None,
        }
        for ut, t in all_tests[:10]
    ]

    # ── Interview stats ───────────────────────────────────────────────────────
    interviews = (
        db.query(models.MockInterview)
        .filter(models.MockInterview.user_id == uid)
        .order_by(models.MockInterview.created_at.desc())
        .all()
    )

    interviews_count = len(interviews)
    avg_confidence = round(
        sum(i.confidence_score or 0 for i in interviews) / interviews_count, 1
    ) if interviews_count else 0
    avg_clarity = round(
        sum(i.clarity_score or 0 for i in interviews) / interviews_count, 1
    ) if interviews_count else 0

    recent_interviews = [
        {
            "id": i.id,
            "confidence_score": i.confidence_score,
            "clarity_score": i.clarity_score,
            "feedback": i.feedback,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in interviews[:5]
    ]

    # ── Consecutive-day streak (Issue 19 fix) ─────────────────────────────────
    # Collect all activity dates, sorted descending
    now_utc = datetime.now(timezone.utc).date()
    activity_dates: set = set()
    for ut, _ in all_tests:
        if ut.completed_at:
            d = ut.completed_at.date() if hasattr(ut.completed_at, 'date') else ut.completed_at
            activity_dates.add(d)
    for i in interviews:
        if i.created_at:
            d = i.created_at.date() if hasattr(i.created_at, 'date') else i.created_at
            activity_dates.add(d)

    # Count consecutive days ending today (or yesterday if no activity today)
    streak = 0
    check_date = now_utc
    while check_date in activity_dates:
        streak += 1
        check_date -= timedelta(days=1)
    # If not active today, check from yesterday
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

    return {
        "user": {
            "username": current_user.username,
            "full_name": current_user.full_name,
            "member_since": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "summary": {
            "tests_attempted": tests_attempted,
            "interviews_completed": interviews_count,
            "streak": streak,                      # consecutive days (Issue 19)
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
    db: Session = Depends(get_db),
):
    """
    Leaderboard using a single aggregation query (Issue 8 — N+1 fix).
    Returns users sorted by average test score descending.
    """
    # Single join + group: avg score and test count per user
    rows = (
        db.query(
            models.User.id,
            models.User.username,
            models.User.full_name,
            func.avg(models.UserTest.score).label("avg_score"),
            func.count(models.UserTest.id).label("test_count"),
        )
        .join(models.UserTest, models.User.id == models.UserTest.user_id)
        .group_by(models.User.id)
        .order_by(func.avg(models.UserTest.score).desc())
        .limit(limit)
        .all()
    )

    results = []
    for rank, row in enumerate(rows, start=1):
        avg = round(float(row.avg_score or 0), 1)
        results.append({
            "rank": rank,
            "id": row.id,
            "name": row.full_name or row.username,
            "username": row.username,
            "score": avg,
            "tests": row.test_count,
            "badge": "Gold" if avg > 85 else ("Silver" if avg > 70 else "Bronze"),
        })

    return results
