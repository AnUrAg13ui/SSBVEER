# 🎖️ SSB Preparation Platform

A full-stack AI-powered platform for Indian SSB aspirants — featuring OIR tests, PPDT practice, WAT/SRT sessions, and an AI-driven mock interview with real-time OLQ analysis.

---

## 📁 Project Structure

```
SSB_tekdi/
├── Backend/                  # FastAPI (Python)
│   ├── app/
│   │   ├── main.py           # App entry point, CORS config
│   │   ├── database.py       # SQLAlchemy + SQLite setup
│   │   ├── models.py         # ORM models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routers/          # auth, tests, interview, dashboard
│   │   └── services/
│   │       └── gemini_service.py  # Google Gemini AI integration
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env                  # ← Add your secrets here (see below)
├── Frontend/                 # React + Vite + Tailwind CSS
│   ├── src/
│   ├── nginx.conf            # Nginx reverse-proxy config
│   ├── Dockerfile
│   └── vite.config.js
├── docker-compose.yml        # Orchestrates both services
└── README.md
```

---

## 🚀 Running with Docker (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Configure environment variables

Create / edit `Backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Get a free API key** → [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Build and start all services

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| **Frontend** (React) | http://localhost |
| **Backend API** | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8000/docs |

### 3. Stopping the services

```bash
docker compose down
```

To also delete the persistent database volume:

```bash
docker compose down -v
```

### Notes
- The SQLite database is stored in a Docker named volume (`sqlite_data`) and persists across restarts.
- The Nginx frontend proxies all `/api/*` requests to the backend container — no CORS issues in production.
- The frontend container waits for the backend health-check to pass before starting.

---

## 🛠️ Local Development (without Docker)

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend

```bash
cd Backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API → `http://localhost:8000` | Docs → `http://localhost:8000/docs`

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

App → `http://localhost:5173`

> The `vite.config.js` dev proxy forwards all `/api/*` calls to `localhost:8000` so you don't need to change any URLs.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **OIR Tests** | Timed logical reasoning with AI-generated questions & instant feedback |
| **PPDT** | 30-second image viewing + 4-minute story writing simulation |
| **WAT** | AI-generated Word Association Test |
| **SRT** | AI-generated Situation Reaction Test |
| **AI Interview** | Voice-enabled mock interview with real-time OLQ scoring via Gemini Vision |
| **Dashboard** | Progress tracking, performance stats, session history |
| **Auth** | JWT-based login & signup |

---

## 🧰 Tech Stack

### Backend
| Library | Purpose |
|---------|---------|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| SQLAlchemy | ORM |
| SQLite | Database (file-based, zero-config) |
| Pydantic | Request/Response validation |
| python-jose | JWT authentication |
| passlib[bcrypt] | Password hashing |
| google-generativeai | Gemini AI (OIR, PPDT, WAT, SRT, Interview) |

### Frontend
| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first CSS |
| Framer Motion | Animations |
| Axios | HTTP client |
| Lucide React | Icons |

### Infrastructure
| Tool | Purpose |
|------|---------|
| Docker | Containerisation |
| Docker Compose | Multi-service orchestration |
| Nginx | Static file serving + API reverse proxy |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI content generation |
| `DATABASE_URL` | ❌ No | Overrides SQLite path (set automatically by Docker Compose) |

---

## 📜 Useful Commands

```bash
# Rebuild only the backend image
docker compose build backend

# View live logs
docker compose logs -f

# View only backend logs
docker compose logs -f backend

# Open a shell in the running backend container
docker compose exec backend bash

# Run with detached (background) mode
docker compose up -d --build
```
