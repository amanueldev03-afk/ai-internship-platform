# ---------------------------------------------------------------------------
# AI Internship Platform — Backend
# Python 3.12 slim image, matches the project's .venv Python version.
# ---------------------------------------------------------------------------

FROM python:3.12-slim

# Prevents Python from writing .pyc files and enables stdout/stderr logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system-level build deps needed by psycopg, Pillow, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer-cached separately from source code)
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy project source
COPY . .

EXPOSE 8000
