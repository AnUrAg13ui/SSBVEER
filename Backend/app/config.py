import os
from functools import lru_cache
from pydantic_settings import BaseSettings

_WEAK_SECRET = "change-me-to-a-real-32-char-secret"


class Settings(BaseSettings):
    """
    App configuration — reads from environment variables / .env file.
    Docker Compose sets DATABASE_URL, REDIS_URL, etc.  For local dev
    the defaults point at localhost with SQLite fallback.
    """

    database_url: str = "sqlite:///./sql_app.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = _WEAK_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    google_client_id: str = ""
    gemini_api_key: str = ""
    debug: bool = True

    # ── Admin credentials (must be set in .env) ───────────────────────────────
    admin_username: str = "anuragadmin133"
    admin_password: str = ""            # bcrypt hash or plain; set in .env
    admin_token_expire_minutes: int = 60

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated list of allowed origins; "*" = open (dev only)
    allowed_origins: str = "http://localhost:5173,http://localhost:5174"

    @property
    def allowed_origins_list(self) -> list[str]:
        parts = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        return parts if parts else ["*"]

    @property
    def is_weak_secret(self) -> bool:
        return self.secret_key == _WEAK_SECRET

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
