from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from pydantic import BaseModel, field_validator
from app.database import get_db
from app.routers.auth import get_current_user
from app import models

router = APIRouter(prefix="/forum", tags=["forum"])

VALID_CATEGORIES = {"General", "OIR Tips", "PPDT Common Story", "WAT Sets", "SRT Reactions", "Interview Exp"}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CreatePostRequest(BaseModel):
    text: str
    category: str = "General"

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Post text cannot be empty")
        if len(v) > 2000:
            raise ValueError("Post text too long (max 2000 chars)")
        return v

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        if v not in VALID_CATEGORIES:
            return "General"
        return v


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/posts")
def list_posts(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return paginated forum posts, optionally filtered by category."""
    query = db.query(models.ForumPost)
    if category and category != "All":
        query = query.filter(models.ForumPost.category == category)
    posts = query.order_by(models.ForumPost.created_at.desc()).offset(skip).limit(limit).all()

    # Gather like counts and whether current user liked each post
    liked_ids = {
        like.post_id
        for like in db.query(models.ForumLike).filter(models.ForumLike.user_id == current_user.id).all()
    }

    return [
        {
            "id": p.id,
            "text": p.text,
            "category": p.category,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "author": p.author.username if p.author else "Unknown",
            "author_full_name": p.author.full_name or p.author.username if p.author else "Unknown",
            "likes": len(p.likes),
            "liked_by_me": p.id in liked_ids,
            # Mark verified if author is_admin
            "verified": p.author.is_admin if p.author else False,
        }
        for p in posts
    ]


@router.post("/posts", status_code=201)
def create_post(
    body: CreatePostRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new forum post."""
    post = models.ForumPost(
        user_id=current_user.id,
        text=body.text,
        category=body.category,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {
        "id": post.id,
        "text": post.text,
        "category": post.category,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "author": current_user.username,
        "author_full_name": current_user.full_name or current_user.username,
        "likes": 0,
        "liked_by_me": False,
        "verified": current_user.is_admin,
    }


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Toggle like/unlike on a post. Returns new like count and liked state."""
    post = db.query(models.ForumPost).filter(models.ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = db.query(models.ForumLike).filter(
        models.ForumLike.user_id == current_user.id,
        models.ForumLike.post_id == post_id,
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        new_like = models.ForumLike(user_id=current_user.id, post_id=post_id)
        db.add(new_like)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        liked = True

    # Refresh count
    count = db.query(models.ForumLike).filter(models.ForumLike.post_id == post_id).count()
    return {"liked": liked, "likes": count}
