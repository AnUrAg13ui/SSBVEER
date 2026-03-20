from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import json

from app.database import get_db
from app import models
from app.routers.auth import get_current_user

router = APIRouter(prefix="/piq", tags=["piq"])


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class EducationRecord(BaseModel):
    exam: str = ""
    board: str = ""
    school: str = ""
    year: str = ""
    percent: str = ""
    subjects: str = ""

class FamilyMember(BaseModel):
    name: str = ""
    relation: str = ""
    service: str = ""
    rank: str = ""

class PIQFormSchema(BaseModel):
    # Section 1: Personal
    full_name: Optional[str] = None
    fathers_name: Optional[str] = None
    mothers_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    nationality: Optional[str] = None
    religion: Optional[str] = None
    category: Optional[str] = None
    marital_status: Optional[str] = None
    aadhar_number: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    visible_identification: Optional[str] = None
    # Section 2: Residence
    permanent_address: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_pin: Optional[str] = None
    current_address: Optional[str] = None
    current_city: Optional[str] = None
    current_state: Optional[str] = None
    current_pin: Optional[str] = None
    years_at_current: Optional[str] = None
    # Section 3: Family
    fathers_occupation: Optional[str] = None
    fathers_service: Optional[str] = None
    mothers_occupation: Optional[str] = None
    num_brothers: Optional[int] = None
    num_sisters: Optional[int] = None
    family_members_in_defence: Optional[list] = None
    family_background_extra: Optional[str] = None
    # Section 4: Education & Physical
    education_records: Optional[list] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    chest_cm: Optional[int] = None
    vision_left: Optional[str] = None
    vision_right: Optional[str] = None
    colour_vision: Optional[str] = None
    hearing: Optional[str] = None
    # Section 5: Activities
    sports_hobbies: Optional[str] = None
    extra_curricular: Optional[str] = None
    achievements: Optional[str] = None
    service_preference_1: Optional[str] = None
    service_preference_2: Optional[str] = None
    service_preference_3: Optional[str] = None
    why_join_army: Optional[str] = None
    self_description: Optional[str] = None


def _form_to_dict(form: models.PIQForm) -> dict:
    """Convert DB model to response dict, parsing JSON fields."""
    d = {c.name: getattr(form, c.name) for c in form.__table__.columns}
    for field in ["education_records", "family_members_in_defence"]:
        val = d.get(field)
        if val and isinstance(val, str):
            try:
                d[field] = json.loads(val)
            except Exception:
                d[field] = []
    return d


# ─── GET current user's PIQ ─────────────────────────────────────────────────
@router.get("/me")
def get_piq(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    form = db.query(models.PIQForm).filter(models.PIQForm.user_id == current_user.id).first()
    if not form:
        return {"exists": False, "data": {}}
    return {"exists": True, "data": _form_to_dict(form)}


# ─── SAVE (upsert) PIQ ──────────────────────────────────────────────────────
@router.post("/save")
def save_piq(
    payload: PIQFormSchema,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    form = db.query(models.PIQForm).filter(models.PIQForm.user_id == current_user.id).first()

    if not form:
        form = models.PIQForm(user_id=current_user.id)
        db.add(form)

    # Map all fields
    simple_fields = [
        "full_name", "fathers_name", "mothers_name", "date_of_birth", "place_of_birth",
        "nationality", "religion", "category", "marital_status", "aadhar_number",
        "mobile", "email", "visible_identification",
        "permanent_address", "permanent_city", "permanent_state", "permanent_pin",
        "current_address", "current_city", "current_state", "current_pin", "years_at_current",
        "fathers_occupation", "fathers_service", "mothers_occupation",
        "num_brothers", "num_sisters", "family_background_extra",
        "height_cm", "weight_kg", "chest_cm",
        "vision_left", "vision_right", "colour_vision", "hearing",
        "sports_hobbies", "extra_curricular", "achievements",
        "service_preference_1", "service_preference_2", "service_preference_3",
        "why_join_army", "self_description",
    ]
    for f in simple_fields:
        val = getattr(payload, f)
        if val is not None:
            setattr(form, f, val)

    # JSON fields
    if payload.education_records is not None:
        form.education_records = json.dumps(payload.education_records)
    if payload.family_members_in_defence is not None:
        form.family_members_in_defence = json.dumps(payload.family_members_in_defence)

    db.commit()
    db.refresh(form)
    return {"success": True, "data": _form_to_dict(form)}
