from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests as http_requests   # ✅ FIXED NAME
import hashlib, secrets, uuid

from app.database import get_db
from app import models, schemas
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Token Blocklist ─────────────────────────────────────────────
_token_blocklist: dict[str, datetime] = {}

def _blocklist_add(jti: str, expiry: datetime) -> None:
    now = datetime.utcnow()
    _token_blocklist.update({k: v for k, v in _token_blocklist.items() if v > now})
    _token_blocklist[jti] = expiry

def _blocklist_check(jti: str) -> bool:
    return jti in _token_blocklist


# ── Password Helpers ────────────────────────────────────────────
def _hash_password(password: str) -> str:
    return pwd_context.hash(password)

def _verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if len(hashed_password) == 64:
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT ─────────────────────────────────────────────────────────
def _create_token(username: str) -> str:
    jti = str(uuid.uuid4())
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": username, "exp": expire, "jti": jti}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def _get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username = payload.get("sub")
        jti = payload.get("jti", "")
        exp = payload.get("exp")
        expiry = datetime.utcfromtimestamp(exp) if exp else datetime.utcnow()

        user = db.query(models.User).filter(models.User.username == username).first()
        return user, jti, expiry
    except JWTError:
        return None, None, None


# ── Dependencies ────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user, jti, expiry = _get_user_from_token(token, db)

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if jti and _blocklist_check(jti):
        raise HTTPException(status_code=401, detail="Token invalidated")

    return user


# ── AUTH ENDPOINTS ──────────────────────────────────────────────

@router.post("/signup")
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username exists")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=_hash_password(user_in.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = _create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not _verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = _create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


# ── GOOGLE SIGN-IN (Frontend Token Flow) ────────────────────────
@router.post("/google")
def google_signin(token_request: schemas.GoogleTokenRequest, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            token_request.token,
            google_requests.Request(),   # ✅ FIXED
            settings.google_client_id
        )

        email = idinfo["email"]
        google_id = idinfo["sub"]
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        user = db.query(models.User).filter(
            (models.User.google_id == google_id) | (models.User.email == email)
        ).first()

        if not user:
            user = models.User(
                username=email.split("@")[0],
                email=email,
                full_name=name,
                google_id=google_id,
                picture=picture,
                hashed_password=_hash_password(secrets.token_hex(16)),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = _create_token(user.username)
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google auth failed: {str(e)}")


# ── GOOGLE CALLBACK (Auth Code Flow) ────────────────────────────
@router.post("/google/callback")
def google_callback(code_request: schemas.GoogleCodeRequest, db: Session = Depends(get_db)):
    try:
        # Exchange code → token
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

        # Verify token
        idinfo = id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),   # ✅ FIXED
            settings.google_client_id
        )

        email = idinfo["email"]
        google_id = idinfo["sub"]

        user = db.query(models.User).filter(
            (models.User.google_id == google_id) | (models.User.email == email)
        ).first()

        if not user:
            user = models.User(
                username=email.split("@")[0],
                email=email,
                google_id=google_id,
                hashed_password=_hash_password(secrets.token_hex(16)),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = _create_token(user.username)
        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Callback failed: {str(e)}")