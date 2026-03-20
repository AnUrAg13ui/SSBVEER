"""
Mobile Session Router
─────────────────────
Implements real-time QR-code image handoff for PPDT / WAT / SRT tests.

Flow:
  1. Frontend generates a session_id (uuid4) when the test starts.
  2. Laptop opens WebSocket at  ws://host:8000/ws/{session_id}
  3. Phone navigates to         http://host:5173/mobile/{session_id}
  4. Phone uploads image via    POST /api/session/upload/{session_id}
  5. Backend stores the file and broadcasts the image URL over WS.
  6. Laptop receives the event and displays the image without refresh.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from pathlib import Path
import uuid
import shutil
import json

router = APIRouter(prefix="/session", tags=["mobile_session"])

# ─── In-memory session store ──────────────────────────────────────────────────
# { session_id: { "image_url": str | None, "sockets": list[WebSocket] } }
_sessions: dict[str, dict] = {}

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


def _get_or_create(session_id: str) -> dict:
    if session_id not in _sessions:
        _sessions[session_id] = {"image_url": None, "sockets": []}
    return _sessions[session_id]


# ─── REST: verify session exists (mobile page polls this on load) ──────────────
@router.get("/verify/{session_id}")
def verify_session(session_id: str):
    """Mobile page calls this to confirm the session is valid before showing upload UI."""
    _get_or_create(session_id)  # auto-create so mobile page always succeeds
    return {"session_id": session_id, "status": "active"}


# ─── REST: upload image from mobile ───────────────────────────────────────────
@router.post("/upload/{session_id}")
async def upload_image(session_id: str, file: UploadFile = File(...)):
    """
    Receives the image, saves it, then pushes the image URL to all
    WebSocket subscribers watching this session.
    """
    session = _get_or_create(session_id)

    # Save the file with a unique name
    ext = Path(file.filename).suffix if file.filename else ".jpg"
    filename = f"{session_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = UPLOADS_DIR / filename

    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    image_url = f"/uploads/{filename}"
    session["image_url"] = image_url

    # Broadcast to all connected laptops
    payload = json.dumps({"type": "image_uploaded", "image_url": image_url})
    dead_sockets = []
    for ws in session["sockets"]:
        try:
            await ws.send_text(payload)
        except Exception:
            dead_sockets.append(ws)

    # Clean up dead sockets
    for ws in dead_sockets:
        session["sockets"].remove(ws)

    return {"status": "ok", "image_url": image_url}


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
            # Keep the connection alive; we don't expect messages from the laptop
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in session["sockets"]:
            session["sockets"].remove(websocket)
