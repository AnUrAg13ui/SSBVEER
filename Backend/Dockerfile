# ── Backend Dockerfile (SQLite Optimized) ──────────────────────────────────
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (slim version)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create storage and data directories
# /app/data will contain the SQLite database
# /app/uploads will contain PPDT/SRT images
RUN mkdir -p /app/data /app/uploads/ppdt /app/uploads/gpe

# Set environment variable to the SQLite path if not overridden by .env
ENV DATABASE_URL=sqlite:///./data/sql_app.db

# Expose API port (Render defaults to 10000)
EXPOSE 10000

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
