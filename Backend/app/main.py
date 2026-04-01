from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.routers import tests, interview, auth, dashboard, chatbot, mobile_session, piq, admin, lecturette, forum
from app.database import engine, Base, SessionLocal
from app import models
from app.config import get_settings
from pathlib import Path
import logging

logger = logging.getLogger("ssb_platform")
settings = get_settings()

# ── Startup validation ────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────
    logger.info("Initializing database schema...")
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")

    if settings.is_weak_secret:
        logger.critical(
            "\n"
            "╔══════════════════════════════════════════════════════════╗\n"
            "║  ⚠  SECURITY WARNING: SECRET_KEY is using the weak default.  ║\n"
            "║     Set a strong SECRET_KEY in your .env file.              ║\n"
            "╚══════════════════════════════════════════════════════════╝"
        )

    if not settings.admin_password:
        logger.critical("SECURITY WARNING: ADMIN_PASSWORD is not set in .env.")

    # Seed default tests if DB is empty (Issue 12 — moved out of request handler)
    db = SessionLocal()
    try:
        tests.seed_tests(db)
    finally:
        db.close()

    yield
    # ── Shutdown (nothing to clean up yet) ──────────────────────────────────────

app = FastAPI(
    title="SSB Prep Platform",
    description="API for SSB Preparation functionalities: OIR, PPDT, Psych Tests, Mock Interview.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Base Routes ──────────────────────────────────────────────────

@app.get("/")
@app.get("/api")
async def root():
    return {
        "status": "Active",
        "message": "SSB Practice Platform API is running",
        "version": "1.0.0",
        "documentation": "/api/docs"
    }

# CORS Middleware — robust origins
allowed_origins = [
    "https://ssbveer.vercel.app",
    "https://ssbveer.vercel.app/",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Serve uploaded images as static files
UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to SSB Prep API"}


# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(interview.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(mobile_session.router, prefix="/api")
app.include_router(piq.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(lecturette.router, prefix="/api")
app.include_router(forum.router, prefix="/api")
