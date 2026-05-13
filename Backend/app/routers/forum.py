from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from pydantic import BaseModel, field_validator
from app.database import get_db, format_mongo_doc
from app.routers.auth import get_current_user
from datetime import datetime, timezone
from bson.objectid import ObjectId

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
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Return paginated forum posts, optionally filtered by category."""
    query = {}
    if category and category != "All":
        query["category"] = category
        
    posts_cursor = db.forum_posts.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = list(posts_cursor)
    
    uid = current_user["id"]
    result = []
    
    for p in posts:
        author_id = p.get("user_id")
        try:
            obj_id = ObjectId(author_id) if len(author_id) == 24 else author_id
            author = db.users.find_one({"_id": obj_id})
        except:
            author = None
            
        if not author:
            author = db.users.find_one({"username": author_id})
            
        likes_array = p.get("likes", [])
        
        result.append({
            "id": str(p["_id"]),
            "text": p.get("text", ""),
            "category": p.get("category", "General"),
            "created_at": p["created_at"].isoformat() if p.get("created_at") else None,
            "author": author.get("username") if author else "Unknown",
            "author_full_name": author.get("full_name") or author.get("username") if author else "Unknown",
            "likes": len(likes_array),
            "liked_by_me": uid in likes_array,
            "verified": author.get("is_admin", False) if author else False,
        })
        
    return result


@router.post("/posts", status_code=201)
def create_post(
    body: CreatePostRequest,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Create a new forum post."""
    post = {
        "user_id": current_user["id"],
        "text": body.text,
        "category": body.category,
        "created_at": datetime.utcnow(),
        "likes": []
    }
    
    res = db.forum_posts.insert_one(post)
    
    return {
        "id": str(res.inserted_id),
        "text": post["text"],
        "category": post["category"],
        "created_at": post["created_at"].isoformat(),
        "author": current_user["username"],
        "author_full_name": current_user.get("full_name") or current_user["username"],
        "likes": 0,
        "liked_by_me": False,
        "verified": current_user.get("is_admin", False),
    }


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: str,
    db = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Toggle like/unlike on a post. Returns new like count and liked state."""
    try:
        obj_id = ObjectId(post_id) if len(post_id) == 24 else post_id
        post = db.forum_posts.find_one({"_id": obj_id})
    except Exception:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    uid = current_user["id"]
    likes_array = post.get("likes", [])
    
    if uid in likes_array:
        db.forum_posts.update_one({"_id": obj_id}, {"$pull": {"likes": uid}})
        liked = False
        count = len(likes_array) - 1
    else:
        db.forum_posts.update_one({"_id": obj_id}, {"$addToSet": {"likes": uid}})
        liked = True
        count = len(likes_array) + 1

    return {"liked": liked, "likes": count}
