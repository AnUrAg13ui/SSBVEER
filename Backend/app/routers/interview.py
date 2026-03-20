from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services import gemini_service
from app.routers.auth import get_current_user
from app import models

router = APIRouter(prefix="/interview", tags=["interview"])


class ContextualQuestionRequest(BaseModel):
    prev_question: Optional[str] = ""
    prev_answer: Optional[str] = ""
    history: Optional[List[dict]] = []
    elapsed_minutes: Optional[float] = 0.0


class AnalyzeRequest(BaseModel):
    question: str
    answer: str
    history: Optional[List[dict]] = []
    facial_image_b64: Optional[str] = ""


class FinalReportRequest(BaseModel):
    history: List[dict]


class GenerateQuestionsRequest(BaseModel):
    piq: Dict[str, Any] = {}
    sdt: Dict[str, Any] = {}
    count: Optional[int] = 20


class FollowUpRequest(BaseModel):
    question: str
    answer: str
    depth: Optional[int] = 1  # which follow-up (1, 2, or 3)


@router.post("/question")
def get_next_question(
    request: ContextualQuestionRequest,
    current_user: models.User = Depends(get_current_user)
):
    question_data = gemini_service.generate_contextual_question(
        prev_question=request.prev_question,
        prev_answer=request.prev_answer,
        history=request.history or [],
        elapsed_minutes=request.elapsed_minutes or 0.0
    )
    return question_data


@router.post("/analyze")
def analyze_answer(
    request: AnalyzeRequest,
    current_user: models.User = Depends(get_current_user)
):
    analysis = gemini_service.analyze_answer_with_vision(
        question=request.question,
        answer=request.answer,
        history=request.history or [],
        facial_image_b64=request.facial_image_b64 or ""
    )
    return analysis


@router.post("/report")
def generate_final_report(
    request: FinalReportRequest,
    current_user: models.User = Depends(get_current_user)
):
    report = gemini_service.generate_final_report(request.history)
    return report


@router.post("/generate-questions")
def generate_personalized_questions(
    request: GenerateQuestionsRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Generate personalized SSB interview questions based on PIQ + SDT profile."""
    questions = gemini_service.generate_profile_questions(
        piq=request.piq,
        sdt=request.sdt,
        count=request.count or 20
    )
    return {"questions": questions}


@router.post("/follow-up")
def get_follow_up(
    request: FollowUpRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Generate IO-style follow-up / drill-down question for a given answer."""
    result = gemini_service.generate_followup_question(
        question=request.question,
        answer=request.answer,
        depth=request.depth or 1
    )
    return result

