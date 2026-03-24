from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


def _utcnow():
    """Timezone-aware UTC now — replaces deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


# ─── User ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for Google Signin users
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    picture = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    test_results = relationship("UserTest", back_populates="user")
    interviews = relationship("MockInterview", back_populates="user")
    piq_form = relationship("PIQForm", back_populates="user", uselist=False)
    forum_posts = relationship("ForumPost", back_populates="author")
    forum_likes = relationship("ForumLike", back_populates="user")


# ─── Test ────────────────────────────────────────────────────────────────────
class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), index=True, nullable=False)  # OIR, PPDT, WAT, SRT
    description = Column(Text, nullable=True)
    duration_seconds = Column(Integer, default=600)

    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")


# ─── Question ────────────────────────────────────────────────────────────────
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    text = Column(Text, nullable=False)
    options = Column(Text, default="[]")       # JSON-encoded list
    correct_answer = Column(String(255), default="")

    test = relationship("Test", back_populates="questions")


# ─── User Test Result ────────────────────────────────────────────────────────
class UserTest(Base):
    __tablename__ = "user_tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=False)
    score = Column(Integer, default=0)
    time_taken = Column(Integer, default=0)           # seconds
    completed_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="test_results")
    test = relationship("Test")


# ─── Mock Interview ──────────────────────────────────────────────────────────
class MockInterview(Base):
    __tablename__ = "mock_interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transcript = Column(Text, default="")
    feedback = Column(Text, default="")
    confidence_score = Column(Integer, default=0)
    clarity_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="interviews")


# ─── PIQ Form ────────────────────────────────────────────────────────────────
class PIQForm(Base):
    __tablename__ = "piq_forms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Section 1: Personal Information
    full_name = Column(String(255), nullable=True)
    fathers_name = Column(String(255), nullable=True)
    mothers_name = Column(String(255), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    place_of_birth = Column(String(255), nullable=True)
    nationality = Column(String(100), nullable=True)
    religion = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)  # GEN/OBC/SC/ST
    marital_status = Column(String(50), nullable=True)
    aadhar_number = Column(String(20), nullable=True)
    mobile = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    visible_identification = Column(Text, nullable=True)

    # Section 2: Residence Information
    permanent_address = Column(Text, nullable=True)
    permanent_city = Column(String(100), nullable=True)
    permanent_state = Column(String(100), nullable=True)
    permanent_pin = Column(String(10), nullable=True)
    current_address = Column(Text, nullable=True)
    current_city = Column(String(100), nullable=True)
    current_state = Column(String(100), nullable=True)
    current_pin = Column(String(10), nullable=True)
    years_at_current = Column(String(10), nullable=True)

    # Section 3: Family Background
    fathers_occupation = Column(String(255), nullable=True)
    fathers_service = Column(String(100), nullable=True)
    mothers_occupation = Column(String(255), nullable=True)
    num_brothers = Column(Integer, nullable=True)
    num_sisters = Column(Integer, nullable=True)
    family_members_in_defence = Column(Text, nullable=True)  # JSON string
    family_background_extra = Column(Text, nullable=True)

    # Section 4: Education & Physical Details
    education_records = Column(Text, nullable=True)  # JSON: [{board, year, percent, school}]
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    chest_cm = Column(Integer, nullable=True)
    vision_left = Column(String(20), nullable=True)
    vision_right = Column(String(20), nullable=True)
    colour_vision = Column(String(50), nullable=True)
    hearing = Column(String(50), nullable=True)

    # Section 5: Activities & Preferences
    sports_hobbies = Column(Text, nullable=True)
    extra_curricular = Column(Text, nullable=True)
    achievements = Column(Text, nullable=True)
    service_preference_1 = Column(String(100), nullable=True)
    service_preference_2 = Column(String(100), nullable=True)
    service_preference_3 = Column(String(100), nullable=True)
    why_join_army = Column(Text, nullable=True)
    self_description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User", back_populates="piq_form")


# ─── Forum ───────────────────────────────────────────────────────────────────
class ForumPost(Base):
    __tablename__ = "forum_posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    category = Column(String(100), default="General", nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    author = relationship("User", back_populates="forum_posts")
    likes = relationship("ForumLike", back_populates="post", cascade="all, delete-orphan")


class ForumLike(Base):
    __tablename__ = "forum_likes"
    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("forum_posts.id"), nullable=False)

    user = relationship("User", back_populates="forum_likes")
    post = relationship("ForumPost", back_populates="likes")
