from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from app.database import get_db, format_mongo_doc
from app.config import get_settings
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pathlib import Path
from bson.objectid import ObjectId
import json, shutil, uuid
from typing import Optional

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Admin JWT helpers ────────────────────────────────────────────────────────

def _issue_admin_token() -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.admin_token_expire_minutes)
    payload = {"sub": settings.admin_username, "role": "admin", "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _verify_admin_password(plain: str) -> bool:
    stored = settings.admin_password
    if not stored:
        return False
    # Support both plain-text (from env) and bcrypt hashes
    if stored.startswith("$2"):
        try:
            return pwd_context.verify(plain, stored)
        except Exception:
            return False
    return plain == stored   # plain-text comparison (dev convenience)


def get_admin_from_token(authorization: Optional[str] = Header(None)) -> str:
    """Dependency: validates the admin JWT passed as Bearer token in Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin token")
        return payload.get("sub", "")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")


# ─── Admin Login ──────────────────────────────────────────────────────────────
@router.post("/login")
def admin_login(body: dict):
    username = body.get("username", "")
    password = body.get("password", "")
    if username != settings.admin_username or not _verify_admin_password(password):
        raise HTTPException(status_code=403, detail="Invalid admin credentials")
    token = _issue_admin_token()
    return {"access_token": token, "token_type": "bearer"}


# ─── Stats (read-only, unauthenticated — no sensitive data) ──────────────────
@router.get("/stats")
def get_stats(db = Depends(get_db)):
    return {
        "users": db.users.count_documents({}),
        "tests": db.tests.count_documents({}),
        "results": db.user_tests.count_documents({}),
        "interviews": db.mock_interviews.count_documents({}),
    }

# ─── GPE Tasks ───────────────────────────────────────────────────────────────
GPE_IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "gpe"

@router.get("/gpe")
def list_gpe(db = Depends(get_db)):
    tests = list(db.tests.find({"category": "GPE"}))
    result = []
    for t in tests:
        result.append({
            "id": str(t["_id"]), 
            "title": t.get("title"), 
            "description": t.get("description"), 
            "questions": t.get("questions", [])
        })
    return result

@router.post("/gpe")
def create_gpe(body: dict, db = Depends(get_db), _admin: str = Depends(get_admin_from_token)):
    title = body.get("title", "GPE Task")
    description = body.get("description", "")
    situation = body.get("situation", "")
    resources = body.get("resources", [])
    problems = body.get("problems", [])
    model_answer = body.get("model_answer", "")
    map_image_url = body.get("map_image_url", "")   # ← NEW: optional uploaded map photo

    payload = json.dumps({
        "situation": situation,
        "resources": resources,
        "problems": problems,
        "model_answer": model_answer,
        "map_image_url": map_image_url,   # ← stored in payload
    })
    
    new_test = {
        "title": title,
        "category": "GPE",
        "description": description,
        "duration_seconds": 1800,
        "questions": [{
            "id": str(uuid.uuid4()),
            "text": situation[:500],
            "options": payload,
            "correct_answer": ""
        }]
    }
    
    res = db.tests.insert_one(new_test)
    return {"success": True, "id": str(res.inserted_id), "title": title}

@router.delete("/gpe/{test_id}")
def delete_gpe(test_id: str, db = Depends(get_db), _admin: str = Depends(get_admin_from_token)):
    try:
        obj_id = ObjectId(test_id) if len(test_id) == 24 else test_id
        res = db.tests.delete_one({"_id": obj_id, "category": "GPE"})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="GPE Task not found")
    except Exception:
        raise HTTPException(status_code=404, detail="GPE Task not found")
    return {"success": True}

# ─── GPE Map Image upload ─────────────────────────────────────────────────────
@router.post("/gpe/upload-image")
async def upload_gpe_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    get_admin_from_token(authorization)
    GPE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WEBP images allowed")
    filename = f"gpe-{uuid.uuid4().hex[:8]}{ext}"
    dest = GPE_IMAGES_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"success": True, "filename": filename, "url": f"/uploads/gpe/{filename}"}

@router.get("/gpe/images")
def list_gpe_images():
    GPE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    files = [f.name for f in GPE_IMAGES_DIR.iterdir() if f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]]
    return [{"filename": f, "url": f"/uploads/gpe/{f}"} for f in sorted(files)]

@router.delete("/gpe/images/{filename}")
def delete_gpe_image(filename: str, _admin: str = Depends(get_admin_from_token)):
    path = GPE_IMAGES_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"success": True}

# ─── PPDT Image upload ────────────────────────────────────────────────────────
UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "ppdt"

@router.post("/ppdt/upload")
async def upload_ppdt_image(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    get_admin_from_token(authorization)   # validate token
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WEBP images allowed")
    filename = f"ppdt-{uuid.uuid4().hex[:8]}{ext}"
    dest = UPLOADS_DIR / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"success": True, "filename": filename, "url": f"/uploads/ppdt/{filename}"}

@router.get("/ppdt/images")
def list_ppdt_images():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    files = [f.name for f in UPLOADS_DIR.iterdir() if f.suffix.lower() in [".jpg",".jpeg",".png",".webp"]]
    return [{"filename": f, "url": f"/uploads/ppdt/{f}"} for f in sorted(files)]

@router.delete("/ppdt/{filename}")
def delete_ppdt_image(filename: str, _admin: str = Depends(get_admin_from_token)):
    path = UPLOADS_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    path.unlink()
    return {"success": True}

# ─── WAT / SRT Bundles ────────────────────────────────────────────────────────
@router.get("/bundles/{category}")
def list_bundles(category: str, db = Depends(get_db)):
    cat = category.upper()
    tests = list(db.tests.find({"category": cat}))
    result = []
    for t in tests:
        words = [q.get("text") for q in t.get("questions", [])]
        result.append({"id": str(t["_id"]), "title": t.get("title"), "description": t.get("description"), "items": words, "count": len(words)})
    return result

@router.post("/bundles")
def create_bundle(body: dict, db = Depends(get_db), _admin: str = Depends(get_admin_from_token)):
    category = body.get("category","WAT").upper()
    title = body.get("title", f"{category} Bundle")
    description = body.get("description","")
    items = body.get("items", [])

    duration_map = {"WAT": 150, "SRT": 900, "OIR": 900}
    
    questions = []
    for item in items:
        questions.append({
            "id": str(uuid.uuid4()),
            "text": item.strip(),
            "options": "[]",
            "correct_answer": ""
        })

    new_test = {
        "title": title, 
        "category": category,
        "description": description,
        "duration_seconds": duration_map.get(category, 900),
        "questions": questions
    }
    
    res = db.tests.insert_one(new_test)
    return {"success": True, "id": str(res.inserted_id), "title": title, "count": len(items)}

@router.delete("/bundles/{test_id}")
def delete_bundle(test_id: str, db = Depends(get_db), _admin: str = Depends(get_admin_from_token)):
    try:
        obj_id = ObjectId(test_id) if len(test_id) == 24 else test_id
        res = db.tests.delete_one({"_id": obj_id})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Bundle not found")
    except Exception:
        raise HTTPException(status_code=404, detail="Bundle not found")
    return {"success": True}

# ─── Command Task Models ──────────────────────────────────────────────────────
COMMAND_MODELS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "command_models.json"

def load_command_models():
    if COMMAND_MODELS_FILE.exists():
        with open(COMMAND_MODELS_FILE, "r") as f:
            return json.load(f)
    return []

def save_command_models(data):
    COMMAND_MODELS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(COMMAND_MODELS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/command-models")
def list_command_models():
    return load_command_models()

@router.post("/command-models")
def create_command_model(body: dict, _admin: str = Depends(get_admin_from_token)):
    models_data = load_command_models()
    new_id = max([m.get("id",0) for m in models_data], default=0) + 1
    new_model = {
        "id": new_id,
        "name": body.get("name","New Model"),
        "difficulty": body.get("difficulty","Medium"),
        "diffColor": body.get("diffColor","#f5a623"),
        "description": body.get("description",""),
        "rules": body.get("rules",[]),
        "resources": body.get("resources",[]),
        "optimalPlan": body.get("optimalPlan",""),
        "sketchfabId": body.get("sketchfabId",""),
        "is3D": bool(body.get("sketchfabId","")),
    }
    models_data.append(new_model)
    save_command_models(models_data)
    return {"success": True, "id": new_id}

@router.delete("/command-models/{model_id}")
def delete_command_model(model_id: int, _admin: str = Depends(get_admin_from_token)):
    models_data = load_command_models()
    models_data = [m for m in models_data if m.get("id") != model_id]
    save_command_models(models_data)
    return {"success": True}
