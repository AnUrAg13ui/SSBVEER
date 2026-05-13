from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services import gemini_service
from app.routers.auth import get_current_user


router = APIRouter(prefix="/lecturette", tags=["lecturette"])

class EvaluateRequest(BaseModel):
    topic: str
    speech_text: str
    duration: int

@router.get("/topics")
def get_topics(current_user: dict = Depends(get_current_user)):
    """
    Generate a set of 4 random lecturette topics covering multiple levels.
    """
    topics = gemini_service.generate_lecturette_topics()
    return {"topics": topics}

@router.post("/evaluate")
def analyze_lecturette(
    request: EvaluateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Evaluate the candidate speaker and produce grade sheet & report.
    """
    report = gemini_service.evaluate_lecturette(
        request.topic, 
        request.speech_text, 
        request.duration
    )
    return report
