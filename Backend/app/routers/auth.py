from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests
import hashlib, secrets, json

from app.database import get_db
from app import models, schemas
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _hash_password(password: str) -> str:
    return pwd_context.hash(password)

def _verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    # Fallback for legacy sha256 hashes
    if len(hashed_password) == 64 and all(c in '0123456789abcdef' for c in hashed_password):
        legacy_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return legacy_hash == hashed_password
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False

def _create_token(username: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"sub": username, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

def _get_user_from_token(token: str, db: Session) -> Optional[models.User]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        return db.query(models.User).filter(models.User.username == username).first()
    except JWTError:
        return None

# ─── Dependency ───────────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    user = _get_user_from_token(token, db)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=schemas.Token)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if user_in.email and db.query(models.User).filter(models.User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=_hash_password(user_in.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = _create_token(db_user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not _verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = _create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login/json", response_model=schemas.Token)
def login_json(creds: schemas.LoginRequest, db: Session = Depends(get_db)):
    """JSON body login (for the React frontend)."""
    user = db.query(models.User).filter(models.User.username == creds.username).first()
    if not user or not _verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    token = _create_token(user.username)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/google", response_model=schemas.Token)
def google_signin(token_request: schemas.GoogleTokenRequest, db: Session = Depends(get_db)):
    try:
        # Verify Google Token
        idinfo = id_token.verify_oauth2_token(token_request.token, requests.Request(), settings.google_client_id)
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')
        google_id = idinfo['sub']

        user = db.query(models.User).filter((models.User.google_id == google_id) | (models.User.email == email)).first()

        if not user:
            username = email.split('@')[0]
            counter = 1
            base_username = username
            while db.query(models.User).filter(models.User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = models.User(
                username=username,
                email=email,
                full_name=name,
                google_id=google_id,
                picture=picture,
                hashed_password=_hash_password(secrets.token_hex(16))
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if not user.google_id:
                user.google_id = google_id
            if picture:
                user.picture = picture
            db.commit()

        token = _create_token(user.username)
        return {"access_token": token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")


@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


# ─── Admin: list all users ────────────────────────────────────────────────────
@router.get("/users", response_model=list[schemas.User])
def list_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.User).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted"}


@router.patch("/users/{user_id}/toggle")
def toggle_user(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}
