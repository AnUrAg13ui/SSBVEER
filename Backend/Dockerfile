# ── Backend Dockerfile (SQLite Optimized) ──────────────────────────────────
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN useradd -m ssbuser
RUN mkdir -p /app/data /app/uploads/ppdt /app/uploads/gpe
RUN chown -R ssbuser:ssbuser /app

# Copy source
COPY . .
RUN chown -R ssbuser:ssbuser /app

USER ssbuser

# 4 slashes for absolute path in SQLite connection string
ENV DATABASE_URL=sqlite:////app/data/sql_app.db

EXPOSE 10000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
