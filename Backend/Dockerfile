# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create a directory for the SQLite database so it can be persisted via a volume
RUN mkdir -p /app/data

# Expose the FastAPI port
EXPOSE 8000

# Run Uvicorn – reload is disabled in production
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
