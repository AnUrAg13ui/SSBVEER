import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    App configuration — reads from environment variables / .env file.
    Docker Compose sets DATABASE_URL, REDIS_URL, etc.  For local dev
    the defaults point at localhost with SQLite fallback.
    """

    database_url: str = "sqlite:///./sql_app.db"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-to-a-real-32-char-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    google_client_id: str = ""
    gemini_api_key: str = ""
    debug: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


def get_settings() -> Settings:
    return Settings()
