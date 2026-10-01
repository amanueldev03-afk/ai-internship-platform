# ---------------------------------------------------------------------------
# SmartIntern-ET — Backend Dockerfile
# Python 3.12 slim image for ASGI, Celery workers, and ML embeddings.
# ---------------------------------------------------------------------------

FROM python:3.12-slim

# Prevents Python from writing .pyc files and enables unbuffered stdout/stderr logging
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install required system packages:
# gcc, build-essential, libpq-dev: native compilation for psycopg, C extensions
# libmagic1: file type detection for uploaded CVs/documents
# gettext: internationalization (Amharic / English translation compiling)
# python3-opencv: CV/image processing capabilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libpq-dev \
    libmagic1 \
    gettext \
    python3-opencv \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for Docker layer caching
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy project source code
COPY . .

# Ensure entrypoint script is executable if used
RUN if [ -f /app/entrypoint.prod.sh ]; then chmod +x /app/entrypoint.prod.sh; fi

EXPOSE 8000 8001

# Default command: Daphne ASGI server for HTTP & WebSockets
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
