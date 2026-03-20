from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import tests, interview, auth, dashboard, chatbot, mobile_session, piq, admin, lecturette
from app.database import engine, Base
from app import models
from pathlib import Path

# Create database tables (auto-creates on first boot)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SSB Prep Platform",
    description="API for SSB Preparation functionalities: OIR, PPDT, Psych Tests, Mock Interview.",
    version="1.0.0",
)

# CORS Middleware — allow all origins so mobile phones on the same LAN can access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # must be False when allow_origins=["*"]
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

