"""
Mobile Session Router
─────────────────────
Implements real-time QR-code image handoff for PPDT / WAT / SRT tests.

Flow:
  1. Frontend generates a session_id (uuid4) when the test starts.
  2. Laptop calls POST /session/register/{session_id} (requires user JWT) to get an upload_token.
  3. Laptop opens WebSocket at  ws://host:8000/ws/{session_id}
  4. Laptop encodes  http://host:5173/mobile/{session_id}?token=<upload_token>  into QR code.
  5. Phone navigates to the QR URL and uploads via POST /session/upload/{session_id}?upload_token=<token>
  6. Backend validates the token, saves the file, and broadcasts the image URL over WS.
  7. Laptop receives the event and displays the image without refresh.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, Depends, Query
from fastapi.security import OAuth2PasswordBearer
from pathlib import Path
from app.routers.auth import get_current_user

from app.services import gemini_service
import uuid
import shutil
import json

router = APIRouter(prefix="/session", tags=["mobile_session"])

# ─── In-memory session store ──────────────────────────────────────────────────
# { session_id: { "image_url": str | None, "sockets": list[WebSocket], "upload_token": str | None } }
_sessions: dict[str, dict] = {}

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


def _get_or_create(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {"image_url": None, "sockets": [], "upload_token": None}
    return _sessions[session_id]


# ─── REST: register session — laptop calls this, gets upload token ─────────────
@router.post("/register/{session_id}")
def register_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Called by the laptop frontend after generating a session_id.
    Returns a short-lived upload_token that the mobile page must present on upload.
    Requires a valid user JWT (ensures only authenticated users can create sessions).
    """
    session = _get_or_create(session_id)
    upload_token = str(uuid.uuid4())
    session["upload_token"] = upload_token
    return {"session_id": session_id, "upload_token": upload_token}


# ─── REST: verify session exists (mobile page polls this on load) ──────────────
@router.get("/verify/{session_id}")
def verify_session(session_id: str):
    """Mobile page calls this to confirm the session is valid before showing upload UI."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return {"session_id": session_id, "status": "active"}


# ─── REST: upload image from mobile ───────────────────────────────────────────
@router.post("/upload/{session_id}")
async def upload_image(
    session_id: str,
    upload_token: str = Query(..., description="Upload token from QR code URL"),
    file: UploadFile = File(...),
):
    """
    Receives the image from the mobile device.
    Requires upload_token query param matching the one issued at /register.
    """
    if session_id not in _sessions:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    session = _sessions[session_id]
    if not session.get("upload_token") or session["upload_token"] != upload_token:
        raise HTTPException(status_code=401, detail="Invalid upload token")

    # Save the file with a unique name
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{session_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = UPLOADS_DIR / filename

    # Read bytes once for both OCR and Saving
    file_bytes = await file.read()

    with dest.open("wb") as f:
        f.write(file_bytes)

    # Perform OCR
    extracted_text = ""
    try:
        extracted_text = gemini_service.extract_text_from_image(file_bytes)
    except Exception as e:
        print(f"Failed to perform OCR: {e}")

    image_url = f"/uploads/{filename}"
    session["image_url"] = image_url
    session["extracted_text"] = extracted_text

    # Broadcast to all connected laptops
    payload = json.dumps({
        "type": "image_uploaded", 
        "image_url": image_url,
        "extracted_text": extracted_text
    })
    
    dead_sockets = []
    for ws in session["sockets"]:
        try:
            await ws.send_text(payload)
        except Exception:
            dead_sockets.append(ws)

    for ws in dead_sockets:
        session["sockets"].remove(ws)

    return {"status": "ok", "image_url": image_url, "extracted_text": extracted_text}


# ─── WebSocket: laptop subscribes here ────────────────────────────────────────
@router.websocket("/ws/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str):
    await websocket.accept()
    session = _get_or_create(session_id)
    session["sockets"].append(websocket)

    # If image was already uploaded before WS connected, send it immediately
    if session["image_url"]:
        payload = json.dumps({"type": "image_uploaded", "image_url": session["image_url"]})
        await websocket.send_text(payload)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in session["sockets"]:
            session["sockets"].remove(websocket)
