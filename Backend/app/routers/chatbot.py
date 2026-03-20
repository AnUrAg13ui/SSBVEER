from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services import gemini_service
from app.routers.auth import get_current_user
from app import models

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatRequest(BaseModel):
    message: str
    history: list = []

@router.post("/ask")
async def ask_chatbot(
    request: ChatRequest,
    current_user: models.User = Depends(get_current_user)
):
    """
    Ask the AI Assistant about SSB preparation.
    """
    prompt = f"""
    You are an expert SSB (Services Selection Board) Preparation Assistant. 
    You help candidates with information about OIR, PPDT, WAT, SRT, GTO, and Interviews.
    
    User History: {request.history[-5:]}
    User Question: {request.message}
    
    Provide a helpful, professional, and motivating response. 
    If you don't know the answer, suggest they focus on Officer Like Qualities (OLQs).
    Keep the response concise and military-oriented (professional but supportive).
    """
    
    response = gemini_service.generate_gemini(prompt)
    return {"reply": response}
