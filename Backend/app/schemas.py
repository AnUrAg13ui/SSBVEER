from pydantic import BaseModel, field_validator
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
    google_id: Optional[str] = None
    picture: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
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
    category: str # OIR, PPDT, WAT, SRT
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
    answers: dict[int, str] # question_id: answer ("A", "B", etc.)
    time_taken: int

class TestResult(BaseModel):
    score: int
    total_questions: int
    percentage: float
    feedback: str

# Mock Interview
class InterviewInput(BaseModel):
    audio_data: Optional[str] = None # Base64 encoded or just text
    text_input: Optional[str] = None

class InterviewResponse(BaseModel):
    bot_reply: str
    confidence_analysis: Optional[str] = None
    clarity_analysis: Optional[str] = None
    next_question: Optional[str] = None


class GenerateTestRequest(BaseModel):
    category: str
    difficulty: Optional[str] = "medium"

class EvaluateRequest(BaseModel):
    category: str
    question: str
    response: str

class FullEvaluateRequest(BaseModel):
    category: str
    responses: dict # {q_id: answer_text}
