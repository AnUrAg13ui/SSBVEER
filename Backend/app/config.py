import os
from functools import lru_cache
from pydantic_settings import BaseSettings

_WEAK_SECRET = "change-me-to-a-real-32-char-secret"


class Settings(BaseSettings):
    """
    App configuration — reads from environment variables / .env file.
    """

    # ── Database & Redis ─────────────────────────────────────────────
    database_url: str = "sqlite:////app/data/sql_app.db"
    redis_url: str = "redis://localhost:6379/0"

    # ── Security ─────────────────────────────────────────────────────
    secret_key: str = _WEAK_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # ── External APIs ────────────────────────────────────────────────
    google_client_id: str = ""
    google_client_secret: str = ""
    gemini_api_key: str = ""

    # ── App Settings ─────────────────────────────────────────────────
    debug: bool = True

    # ── Admin Credentials ────────────────────────────────────────────
    admin_username: str = "anuragadmin133"
    admin_password: str = ""   # MUST set in .env
    admin_token_expire_minutes: int = 60

    # ── CORS ─────────────────────────────────────────────────────────
    # Comma-separated list in .env
    allowed_origins: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        parts = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        return parts if parts else ["*"]

    # ── Security Check ───────────────────────────────────────────────
    @property
    def is_weak_secret(self) -> bool:
        return self.secret_key == _WEAK_SECRET

    class Config:
        env_file = ".env"
        extra = "ignore"


# ── Singleton Settings (cached) ──────────────────────────────────────
@lru_cache()
def get_settings() -> Settings:
    settings = Settings()

    print("✅ SETTINGS LOADED")
    print("DB:", settings.database_url)
    print("CORS:", settings.allowed_origins_list)
    print("Google Client ID:", settings.google_client_id)

    if settings.is_weak_secret:
        print("⚠️ WARNING: Using weak SECRET_KEY")

    return settings