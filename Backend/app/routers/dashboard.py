from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.routers.auth import get_current_user
from app import models
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class SaveTestResult(BaseModel):
    test_id: int
    score: int
    total_questions: int
    time_taken: int          # seconds
    category: str

class SaveInterviewResult(BaseModel):
    confidence_score: int
    clarity_score:    int
    transcript:       Optional[str] = ""
    feedback:         Optional[str] = ""


# ─── Save endpoints (called by frontend on completion) ───────────────────────

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


# ─── History and Detailed Results ───────────────────────────────────────────

@router.get("/history")
def get_user_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    uid = current_user.id
    
    # Fetch all tests
    tests = (
        db.query(models.UserTest, models.Test)
        .join(models.Test, models.UserTest.test_id == models.Test.id)
        .filter(models.UserTest.user_id == uid)
        .order_by(models.UserTest.completed_at.desc())
        .all()
    )
    
    # Fetch all interviews
    interviews = (
        db.query(models.MockInterview)
        .filter(models.MockInterview.user_id == uid)
        .order_by(models.MockInterview.created_at.desc())
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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Result not found")
    
    test = db.query(models.Test).filter(models.Test.id == result.test_id).first()
    
    return {
        "id": result.id,
        "score": result.score,
        "time_taken": result.time_taken,
        "completed_at": result.completed_at.isoformat() if result.completed_at else None,
        "test": {
            "title": test.title,
            "category": test.category,
            "description": test.description,
            "duration_seconds": test.duration_seconds
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
        from fastapi import HTTPException
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

    # Category breakdown: best score per category
    category_scores: dict[str, list[int]] = {}
    for ut, t in all_tests:
        cat = t.category.upper()
        category_scores.setdefault(cat, []).append(ut.score or 0)

    category_avg: dict[str, float] = {
        cat: round(sum(scores) / len(scores), 1)
        for cat, scores in category_scores.items()
    }

    # Recent test activity (last 10)
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

    # ── Activity streak (days with any completion in last 30 days) ────────────
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_days = set()
    for ut, _ in all_tests:
        if ut.completed_at and ut.completed_at >= thirty_days_ago:
            active_days.add(ut.completed_at.date())
    for i in interviews:
        if i.created_at and i.created_at >= thirty_days_ago:
            active_days.add(i.created_at.date())

    streak = len(active_days)

    # ── Overall score (weighted average) ─────────────────────────────────────
    overall = 0
    weights = {"OIR": 0.3, "PPDT": 0.2, "WAT": 0.15, "SRT": 0.15}
    wsum = 0.0
    for cat, avg in category_avg.items():
        w = weights.get(cat, 0.1)
        overall += avg * w
        wsum += w
    if avg_confidence:
        # avg_confidence is 1-10, scale to 1-100
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
            "active_days_last_30": streak,
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
    db: Session = Depends(get_db)
):
    # This is a simplified leaderboard. In a real app, we'd precompute these.
    # We'll fetch all users and their max scores.
    users = db.query(models.User).all()
    results = []
    
    for u in users:
        # Get overall score for each user (similar logic to get_dashboard_stats)
        # But for brevity in this mock-like real integration, we'll just sum their tests
        tests = db.query(models.UserTest).filter(models.UserTest.user_id == u.id).all()
        if not tests:
            continue
            
        avg_score = sum(t.score or 0 for t in tests) / len(tests)
        results.append({
            "id": u.id,
            "name": u.full_name or u.username,
            "username": u.username,
            "score": round(avg_score, 1),
            "tests": len(tests),
            "badge": "Gold" if avg_score > 85 else ("Silver" if avg_score > 70 else "Bronze")
        })
    
    # Sort by score desc
    results.sort(key=lambda x: x["score"], reverse=True)
    
    # Add ranks
    for i, res in enumerate(results):
        res["rank"] = i + 1
        
    return results
