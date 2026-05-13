from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db, format_mongo_doc
from app.routers.auth import get_current_institute_admin
from app import schemas
from app.services import gemini_service
from datetime import datetime
from bson.objectid import ObjectId
import json, uuid, random
from pathlib import Path
from typing import Optional

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

router = APIRouter(prefix="/institute-admin", tags=["institute-admin"])


def _get_inst_id(admin: dict):
    inst_id = admin.get("institute_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Admin is not assigned to any institute")
    return inst_id


# ══════════════════════════════════════════════════════════════════════════════
#  DASHBOARD STATS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
def get_stats(db = Depends(get_db), current_admin: dict = Depends(get_current_institute_admin)):
    inst_id = _get_inst_id(current_admin)

    # Institute info
    try:
        inst_obj = ObjectId(inst_id) if len(inst_id) == 24 else inst_id
        institute = db.institutes.find_one({"_id": inst_obj})
    except:
        institute = None

    # Students
    users = list(db.users.find({"institute_id": inst_id, "role": "user"}))
    user_ids = [str(u["_id"]) for u in users]

    # Institute-scoped tests
    institute_tests = db.tests.count_documents({"institute_id": inst_id})

    # Submissions from this institute's students
    submissions = list(db.user_tests.find({"user_id": {"$in": user_ids}}))

    avg_score = 0
    if submissions:
        scored = [s for s in submissions if s.get("score", 0) > 0]
        avg_score = round(sum(s["score"] for s in scored) / len(scored), 1) if scored else 0

    # Pending reviews (subjective tests not yet graded)
    pending_reviews = sum(
        1 for s in submissions 
        if not s.get("graded", False) and s.get("category", "").upper() in ["WAT", "SRT", "PPDT"]
    )

    # Category breakdown
    cat_scores = {}
    for s in submissions:
        cat = s.get("category", "UNKNOWN").upper()
        cat_scores.setdefault(cat, []).append(s.get("score", 0))
    category_avg = {cat: round(sum(v)/len(v), 1) for cat, v in cat_scores.items() if v}

    # Recent activity
    recent_subs = sorted(submissions, key=lambda x: x.get("completed_at", datetime.min), reverse=True)[:10]
    recent_activity = []
    for sub in recent_subs:
        u_name = "Unknown"
        for u in users:
            if str(u["_id"]) == sub.get("user_id"):
                u_name = u.get("full_name") or u.get("username")
                break
        t_title = "Unknown"
        try:
            tid = ObjectId(sub["test_id"]) if len(sub["test_id"]) == 24 else sub["test_id"]
            t = db.tests.find_one({"_id": tid})
            if t:
                t_title = t.get("title")
        except:
            pass
        recent_activity.append({
            "id": str(sub["_id"]),
            "student_name": u_name,
            "test_title": t_title,
            "category": sub.get("category", ""),
            "score": sub.get("score", 0),
            "admin_score": sub.get("admin_score"),
            "graded": sub.get("graded", False),
            "completed_at": sub.get("completed_at").isoformat() if hasattr(sub.get("completed_at", ""), "isoformat") else str(sub.get("completed_at", ""))
        })

    return {
        "institute_name": institute.get("name", "") if institute else "",
        "institute_code": institute.get("code", "") if institute else "",
        "total_students": len(users),
        "total_tests": institute_tests,
        "total_submissions": len(submissions),
        "pending_reviews": pending_reviews,
        "average_score": avg_score,
        "category_scores": category_avg,
        "recent_activity": recent_activity
    }


# ══════════════════════════════════════════════════════════════════════════════
#  STUDENT MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
def get_users(db = Depends(get_db), current_admin: dict = Depends(get_current_institute_admin)):
    inst_id = _get_inst_id(current_admin)
    users_cursor = db.users.find({"institute_id": inst_id, "role": "user"}).sort("created_at", -1)

    results = []
    for u in users_cursor:
        doc = format_mongo_doc(u)
        tests = list(db.user_tests.find({"user_id": doc["id"]}))
        avg_score = round(sum(t.get("score", 0) for t in tests) / len(tests), 1) if tests else 0
        
        # Pending grading count for this student
        pending = sum(1 for t in tests if not t.get("graded", False) and t.get("category", "").upper() in ["WAT", "SRT", "PPDT"])

        results.append({
            "id": doc["id"],
            "username": doc.get("username"),
            "full_name": doc.get("full_name"),
            "email": doc.get("email"),
            "created_at": doc.get("created_at"),
            "tests_taken": len(tests),
            "average_score": avg_score,
            "pending_grading": pending
        })
    return results


@router.get("/users/{user_id}/history")
def get_user_history(user_id: str, db = Depends(get_db), current_admin: dict = Depends(get_current_institute_admin)):
    inst_id = _get_inst_id(current_admin)

    try:
        u_obj = ObjectId(user_id) if len(user_id) == 24 else user_id
        user = db.users.find_one({"_id": u_obj, "institute_id": inst_id})
    except:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your institute")

    user_tests = list(db.user_tests.find({"user_id": user_id}).sort("completed_at", -1))
    tests_result = []
    for ut in user_tests:
        try:
            tid = ObjectId(ut["test_id"]) if len(ut["test_id"]) == 24 else ut["test_id"]
            t = db.tests.find_one({"_id": tid})
        except:
            t = None

        tests_result.append({
            "id": str(ut["_id"]),
            "test_id": ut.get("test_id"),
            "title": t["title"] if t else "Unknown",
            "category": ut.get("category", t["category"] if t else "Unknown"),
            "score": ut.get("score", 0),
            "admin_score": ut.get("admin_score"),
            "admin_feedback": ut.get("admin_feedback"),
            "graded": ut.get("graded", False),
            "time_taken": ut.get("time_taken", 0),
            "completed_at": ut["completed_at"].isoformat() if ut.get("completed_at") else None,
        })

    return {
        "user": format_mongo_doc(user),
        "history": tests_result
    }


# ── Full Submission Detail (Questions + Answers + Grading) ────────────────────
@router.get("/users/{user_id}/submission/{result_id}")
def get_submission_detail(
    user_id: str, result_id: str,
    db = Depends(get_db), current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)

    # Verify user belongs to institute
    try:
        u_obj = ObjectId(user_id) if len(user_id) == 24 else user_id
        user = db.users.find_one({"_id": u_obj, "institute_id": inst_id})
    except:
        raise HTTPException(status_code=404, detail="User not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found in your institute")

    # Get submission
    try:
        r_obj = ObjectId(result_id) if len(result_id) == 24 else result_id
        submission = db.user_tests.find_one({"_id": r_obj, "user_id": user_id})
    except:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Get test with questions
    test = None
    try:
        tid = ObjectId(submission["test_id"]) if len(submission["test_id"]) == 24 else submission["test_id"]
        test = db.tests.find_one({"_id": tid})
    except:
        pass

    questions = []
    student_answers = submission.get("answers", {})
    if test:
        for q in test.get("questions", []):
            q_id = q.get("id", "")
            questions.append({
                "id": q_id,
                "text": q.get("text", ""),
                "options": q.get("options", "[]"),
                "correct_answer": q.get("correct_answer", ""),
                "student_answer": student_answers.get(q_id, "")
            })

    return {
        "id": str(submission["_id"]),
        "user": {
            "id": str(user["_id"]),
            "username": user.get("username"),
            "full_name": user.get("full_name")
        },
        "test": {
            "id": str(test["_id"]) if test else "",
            "title": test.get("title", "Unknown") if test else "Unknown",
            "category": submission.get("category", test.get("category", "") if test else ""),
            "description": test.get("description", "") if test else "",
        },
        "questions": questions,
        "score": submission.get("score", 0),
        "admin_score": submission.get("admin_score"),
        "admin_feedback": submission.get("admin_feedback"),
        "graded": submission.get("graded", False),
        "graded_at": submission.get("graded_at").isoformat() if submission.get("graded_at") else None,
        "time_taken": submission.get("time_taken", 0),
        "completed_at": submission["completed_at"].isoformat() if submission.get("completed_at") else None,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  TEST MANAGEMENT (INSTITUTE-SCOPED)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/tests")
def list_tests(db = Depends(get_db), current_admin: dict = Depends(get_current_institute_admin)):
    inst_id = _get_inst_id(current_admin)
    cursor = db.tests.find({"institute_id": inst_id}).sort("_id", -1)
    results = []
    for t in cursor:
        doc = format_mongo_doc(t)
        # Count submissions for this test
        submission_count = db.user_tests.count_documents({"test_id": doc["id"]})
        doc["submission_count"] = submission_count
        doc["question_count"] = len(t.get("questions", []))
        results.append(doc)
    return results


@router.post("/tests")
def create_test(
    test_in: schemas.InstituteTestCreate,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)

    questions = []
    for q in test_in.questions:
        opts = q.options
        if isinstance(opts, list):
            opts = json.dumps(opts)
        questions.append({
            "id": str(uuid.uuid4()),
            "text": q.text,
            "options": opts,
            "correct_answer": q.correct_answer or ""
        })

    new_test = {
        "title": test_in.title,
        "category": test_in.category.upper(),
        "description": test_in.description or "",
        "duration_seconds": test_in.duration_seconds,
        "questions": questions,
        "institute_id": inst_id,
        "created_by": current_admin["id"],
        "created_at": datetime.utcnow()
    }

    res = db.tests.insert_one(new_test)
    return {"success": True, "id": str(res.inserted_id), "title": test_in.title, "question_count": len(questions)}


@router.put("/tests/{test_id}")
def update_test(
    test_id: str,
    payload: dict,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)
    try:
        obj_id = ObjectId(test_id) if len(test_id) == 24 else test_id
        test = db.tests.find_one({"_id": obj_id, "institute_id": inst_id})
    except:
        raise HTTPException(status_code=404, detail="Test not found")
    if not test:
        raise HTTPException(status_code=404, detail="Test not found in your institute")

    update = {}
    for field in ["title", "description", "duration_seconds"]:
        if field in payload:
            update[field] = payload[field]
    
    # Update questions if provided
    if "questions" in payload:
        questions = []
        for q in payload["questions"]:
            opts = q.get("options", "[]")
            if isinstance(opts, list):
                opts = json.dumps(opts)
            questions.append({
                "id": q.get("id", str(uuid.uuid4())),
                "text": q.get("text", ""),
                "options": opts,
                "correct_answer": q.get("correct_answer", "")
            })
        update["questions"] = questions

    if update:
        db.tests.update_one({"_id": test["_id"]}, {"$set": update})
    return {"success": True, "message": "Test updated"}


@router.delete("/tests/{test_id}")
def delete_test(
    test_id: str,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)
    try:
        obj_id = ObjectId(test_id) if len(test_id) == 24 else test_id
        res = db.tests.delete_one({"_id": obj_id, "institute_id": inst_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Test not found in your institute")
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=404, detail="Test not found")
    return {"success": True}


# ── AI Test Generation (institute-scoped) ─────────────────────────────────────
@router.post("/tests/generate")
def generate_test(
    request: schemas.GenerateTestRequest,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)
    category = request.category.upper()
    existing_count = db.tests.count_documents({"category": category, "institute_id": inst_id})
    new_title = f"{category} Practice Test {existing_count + 1}"

    questions_data = []
    description = ""
    duration = 600

    try:
        if category == "OIR":
            description = "Officer Intelligence Rating test generated by AI."
            duration = 900
            raw = gemini_service.generate_oir_questions(count=25)
            for q in raw:
                questions_data.append({
                    "id": str(uuid.uuid4()),
                    "text": q.get("text"),
                    "options": json.dumps(q.get("options", [])),
                    "correct_answer": q.get("correct_answer")
                })
        elif category == "WAT":
            description = "Word Association Test generated by AI."
            duration = 150
            words = gemini_service.generate_wat_words(count=15)
            for word in words:
                questions_data.append({"id": str(uuid.uuid4()), "text": word, "options": "[]", "correct_answer": ""})
        elif category == "SRT":
            description = "Situation Reaction Test generated by AI."
            duration = 900
            situations = gemini_service.generate_srt_situations(count=30)
            for sit in situations:
                questions_data.append({"id": str(uuid.uuid4()), "text": sit, "options": "[]", "correct_answer": ""})
        elif category == "PPDT":
            description = "Picture Perception Test generated by AI."
            duration = 270
            scenario = gemini_service.generate_ppdt_scenario()
            ppdt_images = list(UPLOADS_DIR.glob("ppdt-*.webp")) + list(UPLOADS_DIR.glob("ppdt-*.jpg"))
            img_path = f"/uploads/{random.choice(ppdt_images).name}" if ppdt_images else "/ppdt/ppdt-1.webp"
            questions_data.append({
                "id": str(uuid.uuid4()),
                "text": f"Evaluate the scenario: {scenario.get('description', 'Describe the picture shown.')}",
                "options": json.dumps([img_path]),
                "correct_answer": ""
            })
        else:
            raise HTTPException(status_code=400, detail="Supported categories: OIR, WAT, SRT, PPDT")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    if not questions_data:
        raise HTTPException(status_code=500, detail="Failed to generate questions")

    new_test = {
        "title": new_title,
        "category": category,
        "description": description,
        "duration_seconds": duration,
        "questions": questions_data,
        "institute_id": inst_id,
        "created_by": current_admin["id"],
        "created_at": datetime.utcnow()
    }
    res = db.tests.insert_one(new_test)
    return {"success": True, "id": str(res.inserted_id), "title": new_title, "question_count": len(questions_data)}


# ══════════════════════════════════════════════════════════════════════════════
#  GRADING & REVIEW
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/pending-reviews")
def get_pending_reviews(
    category: Optional[str] = None,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)
    users = list(db.users.find({"institute_id": inst_id, "role": "user"}))
    user_ids = [str(u["_id"]) for u in users]
    user_map = {str(u["_id"]): u for u in users}

    query = {"user_id": {"$in": user_ids}, "graded": {"$ne": True}}
    # Only show subjective tests for grading
    if category:
        query["category"] = category.upper()
    else:
        query["category"] = {"$in": ["WAT", "SRT", "PPDT"]}

    submissions = list(db.user_tests.find(query).sort("completed_at", -1))

    results = []
    for sub in submissions:
        user = user_map.get(sub.get("user_id"))
        t_title = "Unknown"
        try:
            tid = ObjectId(sub["test_id"]) if len(sub["test_id"]) == 24 else sub["test_id"]
            t = db.tests.find_one({"_id": tid})
            if t:
                t_title = t.get("title")
        except:
            pass

        results.append({
            "id": str(sub["_id"]),
            "user_id": sub.get("user_id"),
            "student_name": (user.get("full_name") or user.get("username")) if user else "Unknown",
            "test_id": sub.get("test_id"),
            "test_title": t_title,
            "category": sub.get("category", ""),
            "score": sub.get("score", 0),
            "time_taken": sub.get("time_taken", 0),
            "completed_at": sub["completed_at"].isoformat() if sub.get("completed_at") else None,
            "has_answers": bool(sub.get("answers"))
        })
    return results


@router.post("/grade/{result_id}")
def grade_submission(
    result_id: str,
    grade: schemas.GradeSubmission,
    db = Depends(get_db),
    current_admin: dict = Depends(get_current_institute_admin)
):
    inst_id = _get_inst_id(current_admin)

    try:
        r_obj = ObjectId(result_id) if len(result_id) == 24 else result_id
        submission = db.user_tests.find_one({"_id": r_obj})
    except:
        raise HTTPException(status_code=404, detail="Submission not found")
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Verify user belongs to this institute
    user = db.users.find_one({"_id": ObjectId(submission["user_id"]) if len(submission["user_id"]) == 24 else submission["user_id"]})
    if not user or user.get("institute_id") != inst_id:
        raise HTTPException(status_code=403, detail="This submission does not belong to your institute")

    db.user_tests.update_one(
        {"_id": submission["_id"]},
        {"$set": {
            "admin_score": grade.admin_score,
            "admin_feedback": grade.admin_feedback,
            "graded": True,
            "graded_at": datetime.utcnow(),
            "graded_by": current_admin["id"]
        }}
    )

    return {"success": True, "message": f"Submission graded with score {grade.admin_score}"}
