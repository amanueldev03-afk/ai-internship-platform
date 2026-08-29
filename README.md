# AI Internship Platform

An AI-powered platform that matches students with internships using semantic embeddings, skill matching, and weighted scoring. Students get ranked, explained recommendations based on their profile and CV.

---

## Phase 1 — Domain Models & Data Architecture (Complete)

Phase 1 establishes the relational domain model for the entire AI Internship Platform, implementing all 13 core entities, cascade delete behaviors, uniqueness constraints, and the AI matching score breakdown.

### What Phase 1 delivers

- **All 13 Section 3.6 Domain Entities** fully implemented and registered in Django ORM:
  1. `User` (`accounts`): Custom user with `AbstractBaseUser` + `PermissionsMixin` and email authentication.
  2. `Student` (`students`): Profile model composed with `User` (`OneToOneField`, cascade on user delete).
  3. `Skill` (`internships`): Shared skill catalogue with categorization.
  4. `StudentSkill` (`students`): Student-to-Skill M2M with proficiency ratings and duplicate prevention constraints.
  5. `CareerInterest` (`students`): Career interest catalogue.
  6. `StudentInterest` (`students`): Student-to-Interest M2M with duplicate prevention constraints.
  7. `Company` (`companies`): Organization entity with industry and website metadata.
  8. `DataSource` (`data_sources`): Ingestion origin entity (`api`, `rss`, `career_site`) with JSON configs.
  9. `Internship` (`internships`): Internship opportunities with company/data_source links, work mode, salary, and SHA-256 deduplication hashes.
  10. `InternshipSkill` (`internships`): Internship-to-Skill requirement links with unique constraints.
  11. `Recommendation` (`recommendations`): Score breakdown (`overall_score`, `skill_score`, `education_score`, `interest_score`, `experience_score`, `location_score`, `work_mode_score`), JSON explanations, and "latest wins" upsert pattern.
  12. `SavedInternship` (`internships`): Student-to-Internship bookmarks.
  13. `ApplicationHistory` (`applications`): External application click tracking with timestamps.
- **Unified `apps.students` architecture**: Consolidates all student profile, CV analysis, skills, and interest logic under `backend/apps/students/`.
- **Entity Relationship Model (Figure 3.1)** validated via `django-extensions` `graph_models`.
- **Clean Migration History**: Full migration sequence runs cleanly from scratch (`0001` to latest) on an empty PostgreSQL database with pgvector.

---

## Phase 2 — Authentication Module (Complete)

Phase 2 delivers the complete student authentication lifecycle — registration, email verification, login with JWT, token refresh, password reset — plus role-based access control (RBAC) so students and admins are kept strictly separated.

### Task coverage

| Task | Endpoint(s) | Behavior |
|------|-------------|----------|
| 2.1 Registration | `POST /api/auth/register/` | `full_name`, `email`, `password`, optional `phone`. Creates an **inactive** user + empty `StudentProfile` shell and emails a verification link. Duplicate email → `400`. |
| 2.2 Email verification | `GET /api/auth/verify-email/<uid>/<token>/` | Decodes the token, checks expiry, flips `is_email_verified=True` **and** `is_active=True`. Single-use (a redeemed token → `400`). |
| 2.3 Login & JWT | `POST /api/auth/login/` | Valid creds → `200` with access + refresh tokens, **`role` embedded in the JWT claims** for front-end routing. Wrong password → `401`; unverified/inactive account → `403` "verify your email". |
| 2.4 Refresh & protected routes | `POST /api/auth/refresh/` | Issues new access (+ rotated refresh) token. Global `IsAuthenticated` default; public endpoints opt out with `AllowAny`. No token → `401`. |
| 2.5 Password reset | `POST /api/auth/password-reset/` → `POST /api/auth/password-reset-confirm/<uid>/<token>/` | Full round trip via emailed link; new password set, old password invalidated. |
| 2.6 RBAC | `apps.internships.permissions.IsStudent` / `IsAdminRole` | Custom permissions checking `request.user.role`. Student JWT → admin endpoint → `403` (Section 6.7.2). |

> Note: the split endpoints (`/api/accounts/student/login/`, `/api/accounts/admin/login/`, `/api/accounts/forgot-password/`, `/api/accounts/reset-password/`, `/api/accounts/verify-email/`, `/api/accounts/token/refresh/`) remain available for backward compatibility.

### Global security defaults

- `DEFAULT_PERMISSION_CLASSES = IsAuthenticated` (all views locked by default; public auth/verification/docs views declared `AllowAny`).
- `DEFAULT_AUTHENTICATION_CLASSES = JWTAuthentication`.
- API docs (`/api/schema/`, `/api/docs/`, `/api/redoc/`) kept public.
- Tests run against `config.settings.test` (throttling disabled, in-memory email outbox).

---

## Phase 3 — Student Profile Module (Section 5.3)

### Task 3.1 — Profile CRUD endpoints (`/api/students/me/`)

`GET` / `PATCH` `/api/students/me/` returns and updates the authenticated
student's **personal info** (Section 5.3.1) and **education** (Section 5.3.2),
backed by `StudentProfile` (the canonical profile consumed by the AI matching
engine in Section 3.11.1 / `semantic_matching.build_student_text`).

| Method | Action |
|--------|--------|
| `GET` | Return my personal info + education. |
| `PATCH`/`PUT` | Partially update my personal info + education. |

**Business logic — fixed choice lists (Section 3.11.1).** The profile fields
feed directly into the AI matching inputs, so `education_level`, `current_year`
and `field_of_study` are validated against fixed choice lists (`EDUCATION_LEVEL_CHOICES`,
`CURRENT_YEAR_CHOICES`, `FIELD_OF_STUDY_CHOICES` on `StudentProfile`). This
guarantees the AI engine never sees free-text noise it cannot match.

**Check:** PATCH with an invalid `education_level` choice → `400`; a valid PATCH
persists and a subsequent `GET` reflects it immediately.

Access is restricted to `IsStudent` (RBAC from Task 2.6): an admin JWT receives
`403`.

> Note: a `current_year` field (fixed canonical codes) was added to
> `StudentProfile` (migration `0015`) to support Section 5.3.2. The legacy
> catch-all `PUT /api/profile/` serializer remains permissive; the fixed
> choice validation is enforced at the `me/` endpoint boundary.

---

## Entity Relationship Diagram (Figure 3.1)

```mermaid
erDiagram
    Student }|..|{ User : "user"
    StudentSkill }|..|{ Student : "student"
    StudentSkill }|..|{ Skill : "skill"
    StudentInterest }|..|{ Student : "student"
    StudentInterest }|..|{ CareerInterest : "interest"
    Internship }|..|{ Company : "company"
    Internship }|..|{ DataSource : "data_source"
    Internship }|..|{ InternshipSource : "source"
    Internship }|..|{ User : "verified_by"
    InternshipSkill }|..|{ Internship : "internship"
    InternshipSkill }|..|{ Skill : "skill"
    Recommendation }|..|{ User : "student"
    Recommendation }|..|{ Internship : "internship"
    SavedInternship }|..|{ User : "student"
    SavedInternship }|..|{ Internship : "internship"
    ApplicationHistory }|..|{ User : "student"
    ApplicationHistory }|..|{ Internship : "internship"
```

---

## Project Structure

```
ai-internship-platform/
├── backend/                        # Django REST Framework + AI engine
│   ├── apps/
│   │   ├── accounts/               # User auth, JWT, email verification
│   │   ├── students/               # Student profile, CV upload, skills, interests, embeddings
│   │   ├── internships/            # Internship listings, skills, sources
│   │   ├── recommendations/        # Recommendation scoring and history
│   │   ├── applications/           # Application tracking & click history
│   │   ├── companies/              # Company entities & admin management
│   │   ├── data_sources/           # Ingestion sources & configs
│   │   ├── notifications/          # Notifications
│   │   ├── analytics/              # Analytics
│   │   └── common/                 # Shared TimeStampedModel & utilities
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
│   ├── scripts/                    # Phase verification test scripts
│   │   ├── verify_phase1_definition_of_done.py  # Master Phase 1 DoD validator
│   │   ├── verify_clean_db_migration.py         # Scratch DB migration validator
│   │   ├── verify_task1_erd.py                  # ERD graph checker
│   │   ├── verify_user_student.py               # Task 1.2 test suite
│   │   ├── verify_skills_interests.py           # Task 1.3 test suite
│   │   ├── verify_company_datasource.py         # Task 1.4 test suite
│   │   ├── verify_internship_skills.py          # Task 1.5 test suite
│   │   ├── verify_recommendations_applications.py # Task 1.6 test suite
│   │   └── verify_ai_engine.py                  # AI engine validator
│   ├── Dockerfile                  # Django container
│   ├── manage.py
│   └── requirements/
│       └── base.txt
├── frontend/                       # Vite + React + TypeScript
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Route-level pages
│       │   └── HomePage.tsx        # Health check page
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

| Layer             | Technology                                          |
| ----------------- | --------------------------------------------------- |
| Backend framework | Django 6.0 + Django REST Framework                  |
| Auth              | JWT (SimpleJWT) + django-allauth (Google OAuth)     |
| Database          | PostgreSQL 15 + pgvector (vector similarity search) |
| Task queue        | Celery + Redis                                      |
| AI / embeddings   | sentence-transformers (all-MiniLM-L6-v2, 384-dim)   |
| CV parsing        | spaCy (en_core_web_sm) + OpenAI GPT-4o-mini         |
| Frontend          | Vite + React 18 + TypeScript                        |
| State management  | Redux Toolkit                                       |
| Styling           | Tailwind CSS                                        |
| API docs          | drf-spectacular (Swagger + ReDoc)                   |

---

## API Documentation

With the backend running:

- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- Health check: `http://localhost:8000/api/health/`

---

---

## Testing and Verification

### 1. Phase 2 Definition of Done Master Validator

Runs Table 6.1's **TC001–TC003** as automated API round-trips covering registration, email verification, login, token refresh, password reset, and RBAC cross-role blocking:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase2_definition_of_done.py
```

Expected: `PHASE 2 DEFINITION OF DONE: ALL 3 CHECKS PASSED!`

> Tests run against `config.settings.test` (throttling disabled, in-memory email outbox) so they do not touch a live database or send real emails:
> ```bash
> python manage.py test apps.accounts --settings=config.settings.test
> ```

### 2. Phase 1 Definition of Done Master Validator

Runs full automated verification of all 13 entities, cascade deletion behaviors, unique constraints, `graph_models` output, and a clean database migration from scratch:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase1_definition_of_done.py
```

### 3. Django Unit Tests

Run unit tests across all applications:

```bash
cd backend
source .venv/bin/activate
python manage.py test --noinput apps.accounts apps.companies apps.data_sources apps.applications apps.recommendations apps.students apps.internships apps.common
```

### 4. Individual Phase 1 Verification Scripts

```bash
python scripts/verify_user_student.py               # Task 1.2
python scripts/verify_skills_interests.py           # Task 1.3
python scripts/verify_company_datasource.py         # Task 1.4
python scripts/verify_internship_skills.py          # Task 1.5
python scripts/verify_recommendations_applications.py # Task 1.6
python scripts/verify_task1_erd.py                  # ERD graph check
python scripts/verify_clean_db_migration.py         # Clean DB migration check
```

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

| Branch         | Purpose                          |
| -------------- | -------------------------------- |
| `main`         | Stable, phase-complete snapshots |
| `backend-dev`  | Backend feature work             |
| `frontend-dev` | Frontend feature work            |
| `ai-dev`       | AI engine work                   |

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
