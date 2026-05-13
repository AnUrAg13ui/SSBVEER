from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as http_requests
import hashlib, secrets, uuid

from app.database import get_db, format_mongo_doc
from bson import ObjectId
from app import schemas
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Token Blocklist ─────────────────────────────────────────────
_token_blocklist: dict[str, datetime] = {}

def _blocklist_add(jti: str, expiry: datetime) -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    _token_blocklist.update({k: v for k, v in _token_blocklist.items() if v > now})
    _token_blocklist[jti] = expiry

def _blocklist_check(jti: str) -> bool:
    return jti in _token_blocklist


# ── Password Helpers ────────────────────────────────────────────
def _hash_password(password: str) -> str:
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def _verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    # Truncate input to match Bcrypt's max limit
    safe_password = plain_password.encode('utf-8')[:72]
    if len(hashed_password) == 64:
        return hashlib.sha256(safe_password).hexdigest() == hashed_password
    try:
        return pwd_context.verify(safe_password, hashed_password)
    except ValueError:
        return False


# ── JWT ─────────────────────────────────────────────────────────
def _create_token(username: str) -> str:
    jti = str(uuid.uuid4())
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": username, "exp": expire, "jti": jti}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _get_user_from_token(token: str, db):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username = payload.get("sub")
        jti = payload.get("jti", "")
        exp = payload.get("exp")
        expiry = datetime.utcfromtimestamp(exp) if exp else datetime.utcnow()

        user = db.users.find_one({"username": username})
        return user, jti, expiry
    except JWTError:
        return None, None, None


# ── Dependencies ────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    user, jti, expiry = _get_user_from_token(token, db)

    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if jti and _blocklist_check(jti):
        raise HTTPException(status_code=401, detail="Token invalidated")

    return format_mongo_doc(user)

def get_current_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

def get_current_institute_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["institute_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Institute admin access required")
    return current_user

# ── AUTH ENDPOINTS ──────────────────────────────────────────────

@router.post("/signup")
def signup(user_in: schemas.UserCreate, db = Depends(get_db)):
    if db.users.find_one({"username": user_in.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if user_in.email and db.users.find_one({"email": user_in.email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    institute_id = None
    if user_in.institute_code:
        inst = db.institutes.find_one({"code": user_in.institute_code})
        if not inst:
            raise HTTPException(status_code=400, detail="Invalid institute code")
        institute_id = str(inst["_id"])

    user_dict = {
        "username": user_in.username,
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": _hash_password(user_in.password),
        "is_active": True,
        "is_admin": False,
        "role": "user",
        "institute_id": institute_id,
        "created_at": datetime.utcnow()
    }

    db.users.insert_one(user_dict)
    token = _create_token(user_dict["username"])
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = db.users.find_one({"username": form_data.username})

    if not user or not _verify_password(form_data.password, user.get("hashed_password")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(user["username"])
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login/json")
def login_json(login_data: schemas.LoginRequest, db = Depends(get_db)):
    """JSON-based login for standard frontend AJAX requests."""
    user = db.users.find_one({"username": login_data.username})

    if not user or not _verify_password(login_data.password, user.get("hashed_password")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(user["username"])
    return {"access_token": token, "token_type": "bearer"}


# ── GOOGLE SIGN-IN (Frontend Token Flow) ────────────────────────
@router.post("/google")
def google_signin(token_request: schemas.GoogleTokenRequest, db = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            token_request.token,
            google_requests.Request(),
            settings.google_client_id,
            clock_skew_in_seconds=10
        )

        email = idinfo["email"]
        google_id = idinfo["sub"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        user = db.users.find_one({"$or": [{"google_id": google_id}, {"email": email}]})

        if not user:
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            while db.users.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1

            temp_password = secrets.token_hex(16)[:72] 
            
            user = {
                "username": username,
                "email": email,
                "full_name": name,
                "google_id": google_id,
                "picture": picture,
                "hashed_password": _hash_password(temp_password),
                "is_active": True,
                "is_admin": False,
                "role": "user",
                "institute_id": None,
                "created_at": datetime.utcnow()
            }
            db.users.insert_one(user)
        else:
            update_data = {}
            if not user.get("google_id"):
                update_data["google_id"] = google_id
            if picture and user.get("picture") != picture:
                update_data["picture"] = picture
            if update_data:
                db.users.update_one({"_id": user["_id"]}, {"$set": update_data})

        token = _create_token(user["username"])
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        print(f"DEBUG: Google Sign-In failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Google auth failed: {str(e)}")

@router.get("/me", response_model=schemas.User)
def get_me(current_user: dict = Depends(get_current_user), db = Depends(get_db)):
    """Fetch the full profile of the currently logged-in user."""
    if current_user.get("institute_id"):
        try:
            inst_id = current_user["institute_id"]
            inst_obj = ObjectId(inst_id) if len(inst_id) == 24 else inst_id
            institute = db.institutes.find_one({"_id": inst_obj})
            if institute:
                current_user["institute_name"] = institute.get("name")
        except:
            pass
    return current_user

# ── GOOGLE CALLBACK (Auth Code Flow) ────────────────────────────
@router.post("/google/callback")
def google_callback(code_request: schemas.GoogleCodeRequest, db = Depends(get_db)):
    try:
        res = http_requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code_request.code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": code_request.redirect_uri or "postmessage",
                "grant_type": "authorization_code",
            },
        )

        tokens = res.json()
        id_token_str = tokens.get("id_token")

        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.google_client_id,
            clock_skew_in_seconds=10
        )

        email = idinfo["email"]
        google_id = idinfo["sub"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        user = db.users.find_one({"$or": [{"google_id": google_id}, {"email": email}]})

        if not user:
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            while db.users.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1

            temp_password = secrets.token_hex(16)[:72]

            user = {
                "username": username,
                "email": email,
                "full_name": name,
                "google_id": google_id,
                "picture": picture,
                "hashed_password": _hash_password(temp_password),
                "is_active": True,
                "is_admin": False,
                "role": "user",
                "institute_id": None,
                "created_at": datetime.utcnow()
            }
            db.users.insert_one(user)
        else:
            update_data = {}
            if not user.get("google_id"):
                update_data["google_id"] = google_id
            if picture and user.get("picture") != picture:
                update_data["picture"] = picture
            if name and not user.get("full_name"):
                update_data["full_name"] = name
            if update_data:
                db.users.update_one({"_id": user["_id"]}, {"$set": update_data})

        token = _create_token(user["username"])
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        print(f"DEBUG: Google Callback failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Callback failed: {str(e)}")


@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    """Add the current token to the blocklist to invalidate the session."""
    user, jti, expiry = _get_user_from_token(token, db)
    if jti:
        _blocklist_add(jti, expiry)
    return {"detail": "Successfully logged out"}