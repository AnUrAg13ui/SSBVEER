from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db, format_mongo_doc
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


# ─── GET current user's PIQ ─────────────────────────────────────────────────
@router.get("/me")
def get_piq(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db),
):
    form = db.piq_forms.find_one({"user_id": current_user["id"]})
    if not form:
        return {"exists": False, "data": {}}
    form["id"] = str(form.pop("_id"))
    return {"exists": True, "data": form}


# ─── SAVE (upsert) PIQ ──────────────────────────────────────────────────────
@router.post("/save")
def save_piq(
    payload: PIQFormSchema,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db),
):
    update_dict = payload.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()

    res = db.piq_forms.update_one(
        {"user_id": current_user["id"]},
        {"$set": update_dict, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )

    form = db.piq_forms.find_one({"user_id": current_user["id"]})
    if form:
        form["id"] = str(form.pop("_id"))
    else:
        form = {}
        
    return {"success": True, "data": form}
