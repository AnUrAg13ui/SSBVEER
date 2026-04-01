# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Optimized for Render/Vercel/Production
FROM python:3.11-slim

# Set environment variables for better performance
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory
WORKDIR /app

# Install system dependencies (needed for some AI/Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Ensure storage directories exist (optional, but good practice)
RUN mkdir -p /app/uploads/ppdt /app/uploads/gpe

# Expose the API port (Render defaults to 10000)
# We can overwrite this in the Render Dashboard if needed
EXPOSE 10000

# Run Uvicorn - We use 0.0.0.0 because it's required for containerized exposure
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
