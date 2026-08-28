# AI Internship Platform

An AI-powered platform that matches students with internships using semantic embeddings, skill matching, and weighted scoring. Students get ranked, explained recommendations based on their profile and CV.

---

## Phase 0 — Infrastructure Skeleton (Current)

Phase 0 is pure plumbing. No business logic yet. The goal: every developer can run the full stack locally with one command before any feature is built.

### What Phase 0 delivers

- Django backend boots with all 10 apps registered
- React frontend boots and talks to the backend (`GET /api/health/` returns `{"status": "OK"}`)
- PostgreSQL (with pgvector) and Redis are containerised and ready
- AI engine package imports cleanly with no errors
- All three integration branches exist on GitHub (`backend-dev`, `frontend-dev`, `ai-dev`)

---

## Project Structure

```
ai-internship-platform/
├── backend/                        # Django REST Framework + AI engine
│   ├── apps/
│   │   ├── accounts/               # User auth, JWT, email verification
│   │   ├── student_profiles/       # Student profile, CV upload, embeddings
│   │   ├── internships/            # Internship listings, skills, sources
│   │   ├── recommendations/        # Recommendation scoring and history
│   │   ├── applications/           # Application tracking (skeleton)
│   │   ├── companies/              # Company profiles (skeleton)
│   │   ├── notifications/          # Notifications (skeleton)
│   │   ├── analytics/              # Analytics (skeleton)
│   │   ├── data_sources/           # Internship collection pipeline (skeleton)
│   │   └── common/                 # Shared utilities (skeleton)
│   ├── ai_engine/                  # Standalone AI package (not a Django app)
│   │   ├── models/                 # Dataclasses: StudentInput, InternshipInput, etc.
│   │   ├── embeddings/             # Text → 384-dim vector (sentence-transformers)
│   │   ├── resume_parser/          # CV extraction + spaCy NER + OpenAI parsing
│   │   ├── skill_matching/         # Exact skill intersection scoring
│   │   ├── semantic_matching/      # Cosine similarity over embeddings
│   │   ├── ranking/                # Weighted score aggregation
│   │   ├── recommendation.py       # Top-level orchestrator
│   │   └── explanation.py          # Human-readable match explanation
│   ├── config/                     # Django settings (base / development / production)
│   ├── docker/postgres/init.sql    # pgvector extension setup for Docker
│   ├── scripts/verify_ai_engine.py # Phase 0 AI verification script (15 checks)
│   ├── Dockerfile                  # Django container
│   ├── manage.py
│   └── requirements/
│       └── base.txt
├── frontend/                       # Vite + React + TypeScript
│   └── src/
│       ├── components/             # Reusable UI components (skeleton)
│       ├── pages/                  # Route-level pages
│       │   └── HomePage.tsx        # Health check page (fetches /api/health/)
│       ├── features/               # Redux slices per domain
│       │   └── auth/authSlice.ts
│       ├── services/api.ts         # Axios instance with JWT interceptors
│       ├── store/                  # Redux store
│       ├── routes/                 # React Router configuration
│       ├── hooks/                  # Typed useAppDispatch / useAppSelector
│       └── types/                  # TypeScript interfaces matching Django models
├── docker-compose.yml              # postgres:15 + redis:7 + backend
├── .gitignore
└── README.md
```

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (native install or Docker)
- Redis (native install or Docker)

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (one-time)
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and other values

# Set up database (PostgreSQL must be running)
sudo -u postgres psql -d ai_internship -c "CREATE EXTENSION IF NOT EXISTS vector;"
python manage.py migrate

# Run backend
python manage.py runserver
```

Backend available at `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

Open `http://localhost:5173` — the page shows **Backend /api/health/: OK** in green when the frontend and backend are connected.

### 3. Infrastructure via Docker (alternative to native)

```bash
# Start PostgreSQL and Redis in Docker
docker-compose up -d db redis

# Then run backend natively as above
cd backend && python manage.py runserver
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | Django 6.0 + Django REST Framework |
| Auth | JWT (SimpleJWT) + django-allauth (Google OAuth) |
| Database | PostgreSQL 15 + pgvector (vector similarity search) |
| Task queue | Celery + Redis |
| AI / embeddings | sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| CV parsing | spaCy (en_core_web_sm) + OpenAI GPT-4o-mini |
| Frontend | Vite + React 18 + TypeScript |
| State management | Redux Toolkit |
| Styling | Tailwind CSS |
| API docs | drf-spectacular (Swagger + ReDoc) |

---

## API Documentation

With the backend running:

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Health check: `http://localhost:8000/api/health/`

---

## Verify AI Engine

```bash
cd backend
source .venv/bin/activate
python scripts/verify_ai_engine.py
```

Expected: `All 15 checks passed.`

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, phase-complete snapshots |
| `backend-dev` | Backend feature work |
| `frontend-dev` | Frontend feature work |
| `ai-dev` | AI engine work |

Feature branches merge into their integration branch via PR. Integration branches merge into `main` at phase completion.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# Local Docker Compose (default)
DATABASE_URL=postgresql://ai_user:ai_password@localhost:5432/ai_internship

# Redis
REDIS_URL=redis://localhost:6379/1
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# OpenAI (for CV analysis — optional at Phase 0)
OPENAI_API_KEY=your-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Contact

amanueldev03@gmail.com
