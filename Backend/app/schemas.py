from pydantic import BaseModel, field_validator, Field
from typing import List, Optional, Union
from datetime import datetime
import json

# Token/Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleTokenRequest(BaseModel):
    token: str

# User
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """Signup schema — google_id/picture intentionally excluded (set only via /auth/google)."""
    password: str

class User(UserBase):
    """Full user read schema."""
    id: int
    is_active: bool
    is_admin: bool = False
    google_id: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Test
class QuestionBase(BaseModel):
    text: str
    options: Union[List[str], str] = []
    correct_answer: str

    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return []
        return v if isinstance(v, list) else []

class Question(QuestionBase):
    id: int
    test_id: int

    class Config:
        from_attributes = True

class TestBase(BaseModel):
    title: str
    category: str  # OIR, PPDT, WAT, SRT
    description: Optional[str] = None
    duration_seconds: int

class TestCreate(TestBase):
    questions: List[QuestionBase]

class Test(TestBase):
    id: int
    questions: List[Question] = []

    class Config:
        from_attributes = True

# Results
class SubmitTest(BaseModel):
    test_id: int
    answers: dict[int, str]
    time_taken: int

class TestResult(BaseModel):
    score: int
    total_questions: int
    percentage: float
    feedback: str

# Mock Interview
class InterviewInput(BaseModel):
    audio_data: Optional[str] = None
    text_input: Optional[str] = None

class InterviewResponse(BaseModel):
    bot_reply: str
    confidence_analysis: Optional[str] = None
    clarity_analysis: Optional[str] = None
    next_question: Optional[str] = None


class GenerateTestRequest(BaseModel):
    category: str
    difficulty: Optional[str] = "medium"

# Input length limits — prevent huge payloads reaching Gemini (Issue 29)
_MAX_RESPONSE_LEN = 5000

class EvaluateRequest(BaseModel):
    category: str
    question: str = Field(..., max_length=2000)
    response: str = Field(..., max_length=_MAX_RESPONSE_LEN)

class FullEvaluateRequest(BaseModel):
    category: str
    responses: dict  # {q_id: answer_text}

    @field_validator("responses")
    @classmethod
    def limit_response_lengths(cls, v: dict) -> dict:
        return {k: str(val)[:_MAX_RESPONSE_LEN] for k, val in v.items()}
