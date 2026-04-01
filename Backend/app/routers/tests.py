from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import logging
from app.database import get_db
from app.models import Test, Question
from app.schemas import TestBase, QuestionBase, Test as TestSchema, GenerateTestRequest, EvaluateRequest, FullEvaluateRequest
from app.services import gemini_service
from app.routers.auth import get_current_user
from app import models
import json
import random

logger = logging.getLogger("ssb_platform")

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

router = APIRouter(
    prefix="/tests",
    tags=["tests"]
)


# ── Seeding helper (called from main.py lifespan, not inside a request) ────────
def seed_tests(db: Session) -> None:
    """Idempotently insert default test seeds — call once on startup.
    If an existing OIR test has fewer than 25 questions, it is replaced."""

    def upsert_test(category, title, desc, duration, questions_data, min_questions=1):
        """Create a test if missing, or replace it if it has fewer than min_questions questions."""
        existing = db.query(Test).filter(Test.category == category).first()
        if existing:
            q_count = db.query(Question).filter(Question.test_id == existing.id).count()
            if q_count >= min_questions:
                return  # Already has enough questions — skip
            # Replace: delete old questions and the test
            db.query(Question).filter(Question.test_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        new_test = Test(title=title, category=category, description=desc, duration_seconds=duration)
        db.add(new_test)
        db.commit()
        db.refresh(new_test)
        for q_data in questions_data:
            db.add(Question(test_id=new_test.id, **q_data))
        db.commit()

    # Pick a real uploaded PPDT image if available (Issue 27)
    ppdt_images = list(UPLOADS_DIR.glob("ppdt-*.webp")) + list(UPLOADS_DIR.glob("ppdt-*.jpg"))
    ppdt_img = f"/uploads/{ppdt_images[0].name}" if ppdt_images else "/ppdt/ppdt-1.webp"

    # ── OIR: 25 questions, 15 minutes (900s) ──────────────────────────────────
    OIR_QUESTIONS = [
        # Verbal Reasoning
        {"text": "Find the odd one out: Apple, Mango, Potato, Grape",
         "options": '["Apple", "Mango", "Potato", "Grape"]', "correct_answer": "Potato"},
        {"text": "If Delhi is coded as 73541, how is HIDE coded?",
         "options": '["4153", "1547", "5413", "1453"]', "correct_answer": "4153"},
        {"text": "A is the brother of B. B is the sister of C. How is A related to C?",
         "options": '["Brother", "Sister", "Uncle", "Cannot be determined"]', "correct_answer": "Brother"},
        {"text": "Complete the series: B, D, G, K, ?",
         "options": '["N", "O", "P", "Q"]', "correct_answer": "P"},
        {"text": "Pointing to a man, a woman says 'His mother is the only daughter of my mother.' How is the woman related to the man?",
         "options": '["Mother", "Grandmother", "Sister", "Daughter"]', "correct_answer": "Mother"},
        {"text": "Choose the word most opposite in meaning to PHILANTHROPY:",
         "options": '["Misanthropy", "Generosity", "Charity", "Benevolence"]', "correct_answer": "Misanthropy"},
        {"text": "BANK : RIVER :: COAST : ?",
         "options": '["Sea", "Sand", "Wave", "Tide"]', "correct_answer": "Sea"},
        {"text": "If in a certain code MOBILE is written as OMDJIB, how is TIGER written?",
         "options": '["VKIHU", "UJHFS", "VKHFU", "UJMFS"]', "correct_answer": "UJHFS"},
        {"text": "Arrange in meaningful order: 1.Seed 2.Plant 3.Fruit 4.Flower 5.Tree",
         "options": '["1,2,3,4,5", "1,2,5,4,3", "1,5,2,4,3", "1,3,2,4,5"]', "correct_answer": "1,2,5,4,3"},
        # Non-Verbal / Spatial Reasoning
        {"text": "Find the odd one out: Square, Rectangle, Triangle, Sphere",
         "options": '["Square", "Rectangle", "Triangle", "Sphere"]', "correct_answer": "Sphere"},
        {"text": "A figure has 4 equal sides and 4 right angles. What is it?",
         "options": '["Rectangle", "Square", "Rhombus", "Parallelogram"]', "correct_answer": "Square"},
        {"text": "How many triangles are in a Star of David (Star hexagram)?",
         "options": '["6", "8", "12", "10"]', "correct_answer": "8"},
        {"text": "If a clock shows 3:15, what is the angle between the minute and hour hands?",
         "options": '["0°", "7.5°", "15°", "22.5°"]', "correct_answer": "7.5°"},
        {"text": "Mirror image: Which letter remains unchanged when seen in a vertical mirror? H, R, P, F",
         "options": '["H", "R", "P", "F"]', "correct_answer": "H"},
        {"text": "A cube is painted red on all faces. If cut into 27 equal smaller cubes, how many have exactly 2 red faces?",
         "options": '["8", "12", "6", "0"]', "correct_answer": "12"},
        # Numerical Aptitude
        {"text": "Complete the series: 1, 4, 9, 16, 25, ?",
         "options": '["30", "35", "36", "40"]', "correct_answer": "36"},
        {"text": "If 6 men can complete a work in 10 days, how many days will 4 men take?",
         "options": '["12", "14", "15", "16"]', "correct_answer": "15"},
        {"text": "A train 200m long passes a pole in 10 seconds. Its speed in km/h is:",
         "options": '["60", "70", "72", "80"]', "correct_answer": "72"},
        {"text": "What is 15% of 240?",
         "options": '["30", "36", "40", "42"]', "correct_answer": "36"},
        {"text": "A shopkeeper buys an item for ₹800 and sells it for ₹1000. Profit %?",
         "options": '["20%", "25%", "30%", "15%"]', "correct_answer": "25%"},
        {"text": "Complete: 2, 6, 12, 20, 30, ?",
         "options": '["40", "42", "44", "46"]', "correct_answer": "42"},
        {"text": "What is the square root of 1296?",
         "options": '["34", "36", "38", "40"]', "correct_answer": "36"},
        {"text": "If cost price is ₹500 and loss is 10%, the selling price is:",
         "options": '["₹450", "₹460", "₹440", "₹480"]', "correct_answer": "₹450"},
        {"text": "Average of 5, 10, 15, 20, 25 is:",
         "options": '["12", "13", "15", "17"]', "correct_answer": "15"},
        {"text": "A pipe fills a tank in 6 hours, another empties it in 8 hours. Both open together — hours to fill?",
         "options": '["24", "20", "18", "16"]', "correct_answer": "24"},
    ]
    upsert_test("OIR", "OIR Practice Test 1",
        "Officer Intelligence Rating practice test — 25 questions, 15 minutes.",
        900,  # 15 minutes
        OIR_QUESTIONS,
        min_questions=25
    )

    upsert_test("PPDT", "PPDT Visualization 1",
        "Picture Perception and Discussion Test. View image for 30s.", 270,
        [{"text": "Describe the picture shown.", "options": json.dumps([ppdt_img]), "correct_answer": ""}]
    )
    upsert_test("WAT", "WAT Set 1",
        "Word Association Test. Write the first thought that comes to your mind.", 150,
        [
            {"text": "COURAGE", "options": "[]", "correct_answer": ""},
            {"text": "FAILURE", "options": "[]", "correct_answer": ""},
            {"text": "LEADER",  "options": "[]", "correct_answer": ""},
            {"text": "SOCIETY", "options": "[]", "correct_answer": ""},
            {"text": "DEATH", "options": "[]", "correct_answer": ""},
            {"text": "SNAKE", "options": "[]", "correct_answer": ""},
            {"text": "DARK", "options": "[]", "correct_answer": ""},
            {"text": "GUN", "options": "[]", "correct_answer": ""},
            {"text": "SISTER", "options": "[]", "correct_answer": ""},
            {"text": "TEAM", "options": "[]", "correct_answer": ""},
            {"text": "AFRAID", "options": "[]", "correct_answer": ""},
            {"text": "GHOST", "options": "[]", "correct_answer": ""},
            {"text": "NIGHT", "options": "[]", "correct_answer": ""},
            {"text": "POOR", "options": "[]", "correct_answer": ""},
            {"text": "BOMB", "options": "[]", "correct_answer": ""},
        ]
    )
    upsert_test("SRT", "SRT Set 1",
        "Situation Reaction Test. Write your response to the situation.", 900,
        [
            {"text": "He was on his way to the exam hall and saw an accident using his bike.", "options": "[]", "correct_answer": ""},
            {"text": "He was appointed as the captain of a losing team.", "options": "[]", "correct_answer": ""},
        ]
    )
    upsert_test("GTO", "GTO Indoor Tasks 1",
        "GD and GPE practice sessions for group evaluation.", 1800,
        [
            {"text": "[GD] Impact of Social Media: Discuss the pros and cons.",
             "options": '{"type": "GD", "title": "Impact of Social Media"}', "correct_answer": ""},
            {"text": "[GPE] The Flood Rescue: Plan a rescue operation for a flooded village.",
             "options": '{"type": "GPE", "title": "The Flood Rescue"}', "correct_answer": ""},
        ]
    )


@router.post("/generate", response_model=TestSchema)
def generate_new_test(
    request: GenerateTestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Generate a new test using Google Gemini API based on the category.
    """
    category = request.category.upper()
    existing_count = db.query(Test).filter(Test.category == category).count()
    new_title = f"{category} Practice Test {existing_count + 1}"

    questions_data = []
    description = ""
    duration = 600

    if category == "OIR":
        description = "Officer Intelligence Rating logic test generated by AI."
        duration = 900
        raw_questions = gemini_service.generate_oir_questions(count=25)
        for q in raw_questions:
            questions_data.append({
                "text": q.get("text"),
                "options": json.dumps(q.get("options", [])),
                "correct_answer": q.get("correct_answer")
            })

    elif category == "PPDT":
        description = "AI Generated Picture Perception Scenario."
        duration = 270
        scenario = gemini_service.generate_ppdt_scenario()
        # Use a real uploaded image if available (Issue 27)
        ppdt_images = list(UPLOADS_DIR.glob("ppdt-*.webp")) + list(UPLOADS_DIR.glob("ppdt-*.jpg"))
        if ppdt_images:
            chosen = random.choice(ppdt_images)
            img_path = f"/uploads/{chosen.name}"
        else:
            img_path = f"/ppdt/ppdt-{random.randint(1, 10)}.webp"
        questions_data.append({
            "text": f"Evaluate the scenario: {scenario.get('description')}",
            "options": json.dumps([img_path]),
            "correct_answer": ""
        })

    elif category == "WAT":
        description = "Word Association Test generated by AI."
        duration = 150
        words = gemini_service.generate_wat_words(count=15)
        for word in words:
            questions_data.append({
                "text": word,
                "options": "[]",
                "correct_answer": ""
            })

    elif category == "SRT":
        description = "Situation Reaction Test generated by AI."
        duration = 900
        situations = gemini_service.generate_srt_situations(count=30)
        for sit in situations:
            questions_data.append({
                "text": sit,
                "options": "[]",
                "correct_answer": ""
            })

    elif category == "GTO":
        description = "Group Testing Officer tasks: GD topics and GPE cases."
        duration = 1800
        tasks = gemini_service.generate_gto_tasks(count=2)
        for t in tasks:
            questions_data.append({
                "text": f"[{t.get('type')}] {t.get('title')}: {t.get('description')}",
                "options": json.dumps({"type": t.get("type"), "title": t.get("title")}),
                "correct_answer": ""
            })
    
    else:
        raise HTTPException(status_code=400, detail="Invalid category. Supported: OIR, PPDT, WAT, SRT")

    if not questions_data:
        raise HTTPException(status_code=500, detail="Failed to generate questions from AI service.")

    # Check if fallback data was used (all gemini service fns return sentinel key on fallback)
    ai_used_fallback = any(q.get("_fallback") for q in questions_data) if isinstance(questions_data[0], dict) else False

    # Save to DB
    new_test = Test(
        title=new_title,
        category=category,
        description=description,
        duration_seconds=duration
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)

    for q_data in questions_data:
        q = Question(test_id=new_test.id, **q_data)
        db.add(q)
    
    db.commit()

    if ai_used_fallback:
        # Issue 10: Surface AI fallback to caller via header
        logger.warning("AI generation failed for category %s — using fallback data", category)
        return JSONResponse(
            content={"id": new_test.id, "title": new_test.title, "category": new_test.category,
                     "description": new_test.description, "duration_seconds": new_test.duration_seconds,
                     "questions": [], "_ai_warning": "AI service unavailable; fallback questions used."},
            status_code=200,
            headers={"X-AI-Fallback": "true"}
        )
    return new_test

@router.get("/", response_model=List[TestSchema])
def read_tests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns all tests. Seeding happens at startup, not here (Issue 12)."""
    return db.query(Test).all()

@router.get("/{test_id}", response_model=TestSchema)
def read_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    test = db.query(Test).filter(Test.id == test_id).first()
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@router.delete("/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a test. Only admins can delete shared Test templates."""
    test = db.query(Test).filter(Test.id == test_id).first()
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    # Only admins can delete shared Test templates (Issue 11)
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required to delete tests")
    db.delete(test)
    db.commit()
    return {"detail": "Test deleted"}

@router.post("/evaluate")
def evaluate_response(
    request: EvaluateRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Evaluate a candidate's response to an SSB test using AI.
    """
    evaluation = gemini_service.evaluate_test_response(
        category=request.category,
        question=request.question,
        response=request.response
    )
    return evaluation

@router.post("/{test_id}/evaluate-all")
def evaluate_full(
    test_id: int, 
    request: FullEvaluateRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Evaluate all responses in a full test session using AI for holistic insights.
    """
    test = db.query(Test).filter(Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    questions_responses = []
    for q_id, resp in request.responses.items():
        q = db.query(Question).filter(Question.id == int(q_id)).first()
        if q:
            questions_responses.append({"question": q.text, "response": resp})
            
    if not questions_responses:
         raise HTTPException(status_code=400, detail="No valid responses submitted for evaluation.")

    evaluation = gemini_service.evaluate_full_test(request.category, questions_responses)
    return evaluation


@router.post("/sdt/analyze")
def analyze_sdt(
    request: dict,
    current_user: models.User = Depends(get_current_user)
):
    """
    Analyze a candidate's Self Description Test (SDT) using AI.
    Inputs are capped at 2000 chars each to prevent oversized Gemini prompts (Issue 29).
    """
    _MAX = 2000
    result = gemini_service.analyze_sdt(
        parents=str(request.get("parents", ""))[:_MAX],
        teachers=str(request.get("teachers", ""))[:_MAX],
        friends=str(request.get("friends", ""))[:_MAX],
        self_view=str(request.get("self_view", ""))[:_MAX],
        qualities_to_develop=str(request.get("qualities_to_develop", ""))[:_MAX],
    )
    return result
