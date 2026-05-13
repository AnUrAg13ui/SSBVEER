from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db, format_mongo_doc
from app.routers.auth import get_current_super_admin, _hash_password
from app import schemas
from datetime import datetime
import secrets
from bson.objectid import ObjectId

router = APIRouter(prefix="/institutes", tags=["institutes"])

# ── Create Institute ──────────────────────────────────────────────────────────
@router.post("", response_model=schemas.InstituteResponse)
def create_institute(
    inst_in: schemas.InstituteCreate, 
    db = Depends(get_db), 
    _admin: dict = Depends(get_current_super_admin)
):
    # Generate unique 6-character code
    code = secrets.token_hex(3).upper()
    while db.institutes.find_one({"code": code}):
        code = secrets.token_hex(3).upper()
        
    doc = {
        "name": inst_in.name,
        "code": code,
        "admin_ids": [],
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    res = db.institutes.insert_one(doc)
    doc["_id"] = res.inserted_id
    return format_mongo_doc(doc)

# ── List Institutes (with stats) ──────────────────────────────────────────────
@router.get("")
def list_institutes(db = Depends(get_db), _admin: dict = Depends(get_current_super_admin)):
    cursor = db.institutes.find().sort("created_at", -1)
    results = []
    for inst in cursor:
        inst_id = str(inst["_id"])
        # Count students
        student_count = db.users.count_documents({"institute_id": inst_id, "role": "user"})
        # Count tests
        test_count = db.tests.count_documents({"institute_id": inst_id})
        # Get admin names
        admin_ids = inst.get("admin_ids", [])
        admin_names = []
        for aid in admin_ids:
            try:
                a_obj = ObjectId(aid) if len(aid) == 24 else aid
                admin_user = db.users.find_one({"_id": a_obj})
                if admin_user:
                    admin_names.append(admin_user.get("full_name") or admin_user.get("username"))
            except:
                pass
        
        doc = format_mongo_doc(inst)
        doc["student_count"] = student_count
        doc["test_count"] = test_count
        doc["admin_names"] = admin_names
        results.append(doc)
    return results

# ── Create Admin Credentials for Institute ────────────────────────────────────
@router.post("/{institute_id}/create-admin")
def create_institute_admin(
    institute_id: str,
    payload: schemas.CreateInstituteAdmin,
    db = Depends(get_db),
    _admin: dict = Depends(get_current_super_admin)
):
    # Validate institute exists
    try:
        inst_obj_id = ObjectId(institute_id) if len(institute_id) == 24 else institute_id
        inst = db.institutes.find_one({"_id": inst_obj_id})
    except:
        raise HTTPException(status_code=404, detail="Institute not found")
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    # Check username uniqueness
    if db.users.find_one({"username": payload.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    if payload.email and db.users.find_one({"email": payload.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user with institute_admin role
    user_doc = {
        "username": payload.username,
        "email": payload.email,
        "full_name": payload.full_name or payload.username,
        "hashed_password": _hash_password(payload.password),
        "is_active": True,
        "is_admin": False,
        "role": "institute_admin",
        "institute_id": str(inst["_id"]),
        "created_at": datetime.utcnow()
    }
    res = db.users.insert_one(user_doc)
    
    # Add to institute's admin_ids
    db.institutes.update_one(
        {"_id": inst["_id"]},
        {"$addToSet": {"admin_ids": str(res.inserted_id)}}
    )
    
    return {
        "message": f"Admin '{payload.username}' created for {inst.get('name')}",
        "username": payload.username,
        "institute_name": inst.get("name"),
        "institute_code": inst.get("code")
    }

# ── Legacy: Assign existing user as admin ─────────────────────────────────────
@router.post("/{institute_id}/admins")
def assign_institute_admin(
    institute_id: str,
    payload: dict,  # expects {"username": str}
    db = Depends(get_db),
    _admin: dict = Depends(get_current_super_admin)
):
    try:
        inst_obj_id = ObjectId(institute_id) if len(institute_id) == 24 else institute_id
        inst = db.institutes.find_one({"_id": inst_obj_id})
    except:
        raise HTTPException(status_code=404, detail="Institute not found")
        
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
        
    username = payload.get("username")
    if not username:
        raise HTTPException(status_code=400, detail="username required")
        
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "role": "institute_admin",
            "institute_id": str(inst["_id"])
        }}
    )
    
    # Also add to admin_ids
    db.institutes.update_one(
        {"_id": inst["_id"]},
        {"$addToSet": {"admin_ids": str(user["_id"])}}
    )
    
    return {"message": f"User {username} is now an admin for {inst.get('name')}"}

# ── Update Institute ──────────────────────────────────────────────────────────
@router.put("/{institute_id}")
def update_institute(
    institute_id: str,
    payload: dict,
    db = Depends(get_db),
    _admin: dict = Depends(get_current_super_admin)
):
    try:
        inst_obj_id = ObjectId(institute_id) if len(institute_id) == 24 else institute_id
        inst = db.institutes.find_one({"_id": inst_obj_id})
    except:
        raise HTTPException(status_code=404, detail="Institute not found")
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    update = {}
    if "name" in payload:
        update["name"] = payload["name"]
    if "is_active" in payload:
        update["is_active"] = payload["is_active"]
    
    if update:
        db.institutes.update_one({"_id": inst["_id"]}, {"$set": update})
    
    return {"message": "Institute updated"}

# ── Get Institute Stats ───────────────────────────────────────────────────────
@router.get("/{institute_id}/stats")
def get_institute_stats(
    institute_id: str,
    db = Depends(get_db),
    _admin: dict = Depends(get_current_super_admin)
):
    try:
        inst_obj_id = ObjectId(institute_id) if len(institute_id) == 24 else institute_id
        inst = db.institutes.find_one({"_id": inst_obj_id})
    except:
        raise HTTPException(status_code=404, detail="Institute not found")
    if not inst:
        raise HTTPException(status_code=404, detail="Institute not found")
    
    inst_id = str(inst["_id"])
    students = list(db.users.find({"institute_id": inst_id, "role": "user"}))
    student_ids = [str(u["_id"]) for u in students]
    
    test_count = db.tests.count_documents({"institute_id": inst_id})
    submissions = list(db.user_tests.find({"user_id": {"$in": student_ids}}))
    
    avg_score = 0
    if submissions:
        avg_score = round(sum(s.get("score", 0) for s in submissions) / len(submissions), 1)
    
    pending_reviews = sum(1 for s in submissions if not s.get("graded", False) and s.get("category", "").upper() in ["WAT", "SRT", "PPDT"])
    
    return {
        "institute_name": inst.get("name"),
        "total_students": len(students),
        "total_tests": test_count,
        "total_submissions": len(submissions),
        "average_score": avg_score,
        "pending_reviews": pending_reviews
    }
