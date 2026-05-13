from pydantic import BaseModel, field_validator, Field
from typing import List, Optional, Union, Dict
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

class GoogleCodeRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None

# User
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    mobile: Optional[str] = None

class UserCreate(UserBase):
    """Signup schema — google_id/picture intentionally excluded (set only via /auth/google)."""
    password: str
    institute_code: Optional[str] = None

class User(UserBase):
    """Full user read schema."""
    id: str
    is_active: bool
    is_admin: bool = False
    role: str = "user"
    institute_id: Optional[str] = None
    institute_name: Optional[str] = None
    google_id: Optional[str] = None
    picture: Optional[str] = None
    mobile: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Institutes
class InstituteBase(BaseModel):
    name: str

class InstituteCreate(InstituteBase):
    pass

class InstituteResponse(InstituteBase):
    id: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Institute Admin: Create admin credentials ─────────────────────────────────
class CreateInstituteAdmin(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None

# ── Institute Admin: Test creation ────────────────────────────────────────────
class InstituteTestQuestion(BaseModel):
    text: str
    options: Union[List[str], str] = []
    correct_answer: str = ""

class InstituteTestCreate(BaseModel):
    title: str
    category: str  # OIR, PPDT, WAT, SRT
    description: Optional[str] = None
    duration_seconds: int = 900
    questions: List[InstituteTestQuestion]

# ── Grading ───────────────────────────────────────────────────────────────────
class GradeSubmission(BaseModel):
    admin_score: int = Field(..., ge=0, le=100)
    admin_feedback: str = ""

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
    id: str
    test_id: str

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
    id: str
    questions: List[Question] = []

    class Config:
        from_attributes = True

# Results
class SubmitTest(BaseModel):
    test_id: str
    answers: dict[str, str]
    time_taken: int

class TestResult(BaseModel):
    score: int
    total_questions: int
    percentage: float
    feedback: str

# ── Enhanced save-test with answers ───────────────────────────────────────────
class SaveTestResult(BaseModel):
    test_id: str
    score: int
    total_questions: int
    time_taken: int       # seconds
    category: str
    answers: Optional[Dict[str, str]] = None  # {question_id: answer_text}

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
    handwritten_image: Optional[str] = None  # Base64 string for manual uploads

    @field_validator("responses")
    @classmethod
    def limit_response_lengths(cls, v: dict) -> dict:
        return {k: str(val)[:_MAX_RESPONSE_LEN] for k, val in v.items()}
