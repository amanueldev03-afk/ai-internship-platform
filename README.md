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

## Phase 3 — Student Profile Module (Section 5.3) (Complete)

A student can complete a full profile end-to-end via the API — personal info,
education, skills, career interests and preferences (Tasks 3.1–3.3) — upload a
resume (Task 3.4), parse it asynchronously (Task 3.5), and watch the
profile-completion percentage (Task 3.6) update live. Table 6.1's **TC004–TC005**
pass as automated API round-trips (see [Testing and Verification](#testing-and-verification)).

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

### Task 3.2 — Skills & career interests endpoints

`GET` / `POST` / `DELETE` `/api/students/me/skills/` and the same for
`/api/students/me/interests/` manage the catalogue-validated skills and
career interests on the authenticated student's profile.

| Method  | `/me/skills/`            | `/me/interests/`          |
|---------|--------------------------|---------------------------|
| `GET`   | List skills on my profile (active catalogue skills, ordered by name). | List interests on my profile (active catalogue interests, ordered by name). |
| `POST`  | `{"skill_id": <id>}` → 201. Adds the catalogue skill. | `{"interest_id": <id>}` → 201. Adds the catalogue interest. |
| `DELETE`| `{"skill_id": <id>}` → 204. Removes it (idempotent). | `{"interest_id": <id>}` → 204. Removes it (idempotent). |

**Catalogue validation (Task 1.3) — no free-text.** The POST body must carry a
`skill_id` / `interest_id` referencing an existing **active** `Skill` /
`CareerInterest` row from the catalogue. Anything else — an unknown ID or a
skill/interest *name* string — is rejected with `400`.

**Decision (documented for Phase 6):** there is **no "suggest new skill"
flow**. Free-text is always rejected with `400`; expanding the catalogue is an
admin/model-seeding concern, not an API input channel. This guarantees Phase 6
matching operates on canonical `Skill`/`CareerInterest` rows only
(exact-match + embedding intersection) and never degrades to fuzzy string
matching.

**Check:** POST an unknown `skill_id` (e.g. `999999`) → `400`; POST a skill
name string → `400`; POST a valid catalogue `skill_id` → `201` and the skill
appears in a subsequent `GET`.

**Model change (migration `0016`):** `StudentProfile.interests` changed from a
free-form `JSONField` to a `ManyToManyField(CareerInterest)` so interests are
catalogue-constrained end-to-end (`skills` was already an M2M to `Skill`).
Skills/interests are excluded from the permissive `StudentProfileSerializer`
write path and are managed exclusively through the `me/skills/` and
`me/interests/` endpoints.

Access is restricted to `IsStudent` (RBAC from Task 2.6): an admin JWT
receives `403`. Successful mutations also re-queue the student embedding and
bust the recommendation cache so follow-up recommendations reflect the change.

### Task 3.3 — Internship preferences

`GET` / `PATCH` `/api/students/me/preferences/` reads and updates the
authenticated student's internship preferences (Section 5.3.3).

| Method  | Action |
|---------|--------|
| `GET`   | Return my internship preferences. |
| `PATCH` | Partially update them; all fields optional. |

| Field | Accepted values | Stored on `StudentProfile` | AI engine use |
|-------|-----------------|----------------------------|---------------|
| `country` | free text | `country` | Location score + semantic profile text |
| `city` | free text | `city` | Location score + semantic profile text |
| `work_mode` | `full_time`, `part_time`, `either` | `work_type` | Work-mode score (`calculate_work_mode_score`) |
| `internship_type` | `remote`, `onsite`, `hybrid`, `any` | `internship_type` | Hard filter (`passes_hard_filters`) |
| `availability_start` | `YYYY-MM-DD` | `availability_start` | — |
| `availability_end` | `YYYY-MM-DD` | `availability_end` | — |

**Naming note.** The API keyword is `work_mode`, but it maps onto
`StudentProfile.work_type` (the commitment — full/part-time — that the AI
engine's work-mode score reads), so the accepted values are `full_time` /
`part_time` / `either`. The legacy `Student.work_mode` field used those names
inverted; `StudentProfile` is the canonical profile consumed by the engine, so
its semantics win.

**Check (basic invariant):** PATCH with `availability_end <
availability_start` → `400` with an `availability_end` error; equal dates are
valid. The invariant is also enforced at the model layer (`StudentProfile.clean`).

**Model change (migration `0017`):** `StudentProfile.available_from` was
renamed to `availability_start` (data preserved) and an `availability_end`
field was added, completing the availability window. Both are writable on the
permissive `/api/profile/` serializer too.

Access is restricted to `IsStudent` (RBAC from Task 2.6): an admin JWT
receives `403`. Successful updates re-queue the student embedding and bust
the recommendation cache.

### Task 3.4 — Resume upload (`/api/students/me/resume/`)

`POST` and `GET` `/api/students/me/resume/` handle the student's canonical
resume file (Section 5.3.6 / Figure 5.2).

| Method | Action |
|--------|--------|
| `POST` | Upload a resume via `multipart/form-data` field `file`. PDF/DOCX only. |
| `GET`  | Return resume metadata + latest CV processing status. |

**Validation (Section 7.6.5 — no disguised executables).** The upload is
validated three ways, in order:

1. **Size** — max 5 MB (`ValueError` → 400).
2. **Extension** — filename must be `.pdf` / `.docx`.
3. **MIME by content sniffing** — never the extension alone:
   - `.pdf`  → the bytes must begin with a genuine `%PDF` header.
   - `.docx` → the bytes must be a real ZIP whose manifest carries the OOXML
     `[Content_Types].xml` + `word/` tree.
   - **A Windows/Linux executable renamed to `.pdf` (MZ/ELF magic) is
     rejected with 400** — the sniffed type (or unknown binary) never matches
     the declared extension.

**Storage (Section 7.7.2 — django-storages).** On success the file is stored
via Django's `STORAGES["default"]` backend: the local filesystem under
`backend/media/student_resumes/` in development, and an S3-compatible bucket
in production via `STORAGE_BACKEND=s3`. `StudentProfile.resume` points to the
stored object (same storage key as a newly created `CV` record — no second
copy), so the Task 3.5 resume-parsing pipeline consumes it.

**Async (Task 3.5).** A `CV` record is created (`PENDING`) and the
`parse_resume` Celery task is queued via `transaction.on_commit`, so parsing
runs after the upload transaction commits (Task 3.5).

**Check (as in tests):** upload a `.exe` renamed to `.pdf` → 400; upload a
valid PDF → 201, `student.resume` points to the stored object, and the
`parse_resume` Celery task is queued.

### Task 3.5 — Async resume parsing (`parse_resume`)

On a successful resume upload, the endpoint queues
`parse_resume.delay(student_id)` (Celery). The task loads the student's most
recent `CV` record, extracts text (re-validating the file), runs the shared
parsing pipeline (deterministic + AI analysis, skill sync, embedding, cache
bust), and sets `StudentProfile.resume_parsed = True`
(+ `resume_parsed_at`) once done — the DB flag used to confirm the async run.

| Piece | Detail |
|-------|--------|
| Task | `apps.students.tasks.parse_resume(student_id)` (shared pipeline extracted into `_complete_cv_processing`). |
| Trigger | `transaction.on_commit(lambda: parse_resume.delay(profile.user_id))` in `_store_resume`. |
| Flag | `StudentProfile.resume_parsed` (Boolean) + `resume_parsed_at` (DateTime), migration `0019`. |
| Eager mode | `CELERY_TASK_ALWAYS_EAGER=True` runs tasks synchronously (no broker) for dev/tests — driven by env (default `False`, set in `config.settings.test`). |

The full broker is wired up in Phase 5; this task exists now and is verified
in eager mode.

**Check (as in tests):** after a valid upload, `StudentProfile.resume_parsed`
is `True` and the created `CV` reached `COMPLETED`.

### Task 3.6 — Profile completion indicator (Sections 3.9.1 / 3.9.2)

Both `GET /api/profile/` and `GET /api/students/me/` return a read-only
`completion` block that powers the dashboard completion widget:

```json
{
  "percent": 50,
  "sections": {
    "personal":    true,
    "education":   true,
    "skills":      true,
    "interests":   false,
    "preferences": false,
    "resume":      true
  }
}
```

**Business logic.** The percentage is the share of six equally-weighted
sections that are filled:

| Section | Filled when |
|---------|-------------|
| `personal` | any of `phone` / `country` / `city` / `date_of_birth` / `bio` is set |
| `education` | any of `education_level` / `current_year` / `field_of_study` / `university` is set |
| `skills` | profile has ≥ 1 catalogue `Skill` |
| `interests` | profile has ≥ 1 catalogue `CareerInterest` |
| `preferences` | a real preference is expressed (e.g. `work_type` ≠ default `either`, `internship_type` ≠ default `any`, availability window, preferred locations, relocation) — defaults do **not** count |
| `resume` | `StudentProfile.resume` points to a stored file |

Each section = 1/6 (≈ 16.7%), so an empty profile is `0%` and percentage
climbs in predictable steps: `0, 17, 33, 50, 67, 83, 100`. `completion` is a
computed serializer field (`apps/students/services/profile_completion.py`) —
no model columns, no migration.

**Check (as in tests):** empty profile → `0%`; filling each section one at a
time yields exactly `17/33/50/67/83/100`; all sections → `100%`; the field is
exposed on both `/api/students/me/` and `/api/profile/`.

---

## Phase 4 — Company & Internship Management (Sections 5.4–5.5)

Phase 4 delivers the admin-side management layer for the supply pipeline:
companies (Section 5.4) and, in later tasks, internships (Section 5.5). It is
gated end-to-end by the `IsAdminRole` RBAC permission from Task 2.6 — a
student JWT receives `403` on every verb.

### Task 4.1 — Company CRUD (`/api/companies/`) (admin-only)

`GET` / `POST` `/api/companies/` and `GET` / `PUT` / `PATCH` / `DELETE`
`/api/companies/<id>/` manage the `Company` catalogue (Section 3.6 entity #7).
Both views are locked down with `IsAdminRole`.

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/companies/` | Paginated list of all companies, each with a live `internship_count`. |
| `POST` | `/api/companies/` | Create a company (`name` unique, `website` URL, `country`, `industry`). Duplicate name → `400`. |
| `GET` | `/api/companies/<id>/` | Retrieve one company. |
| `PATCH` / `PUT` | `/api/companies/<id>/` | Update one company. |
| `DELETE` | `/api/companies/<id>/` | Delete one company; its internships' `company` links are nulled (`on_delete=SET_NULL`, migration `0018`), listings survive. |

**Check (Table 6.1 TC006, as in tests):** a student JWT receives `403` on
every verb; an anonymous client receives `401`; an admin can round-trip a
company end to end — create → list → retrieve → patch → delete — and the
`internship_count` reflects linked internships.

> Note: the whole `/api/companies/` namespace is admin-only by design —
> students reach companies indirectly through the internship catalogue and
> recommendations, never through a company management surface.

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
│   │   ├── verify_phase2_definition_of_done.py  # Master Phase 2 DoD validator (TC001–TC003)
│   │   ├── verify_phase3_definition_of_done.py  # Master Phase 3 DoD validator (TC004–TC005)
│   │   ├── verify_phase4_definition_of_done.py  # Master Phase 4 DoD validator (TC006)
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
│       ├── base.txt                # Core deps (incl. django-storages[s3] for Phase 3 resumes)
│       ├── development.txt
│       └── production.txt
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
| File storage      | django-storages (local filesystem / S3-compatible) |
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

### 1. Phase 4 Definition of Done Master Validator

Runs Table 6.1's **TC006** as an automated API round-trip: a non-admin
(student JWT) receives `403` on every verb of the company CRUD API
(`/api/companies/`), and an admin round-trips a company through
create → list → retrieve → patch → delete:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase4_definition_of_done.py
```

Expected: `PHASE 4 DEFINITION OF DONE: ALL 1 CHECKS PASSED!`

### 2. Phase 3 Definition of Done Master Validator

Runs Table 6.1's **TC004–TC005** as automated API round-trips: a student
completes a full profile end-to-end (personal, education, skills, interests,
preferences via the Phase 3 endpoints), then uploads a genuine PDF resume and
watches the profile-completion percentage update live (0% → 33% → 50% → 67% →
83% → 100%):

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase3_definition_of_done.py
```

Expected: `PHASE 3 DEFINITION OF DONE: ALL 2 CHECKS PASSED!`

> Runs against `config.settings.test` (Celery tasks eager, in-memory email
> outbox) so no broker/Redis or live database is needed.

### 3. Phase 2 Definition of Done Master Validator

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

### 4. Phase 1 Definition of Done Master Validator

Runs full automated verification of all 13 entities, cascade deletion behaviors, unique constraints, `graph_models` output, and a clean database migration from scratch:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase1_definition_of_done.py
```

### 5. Django Unit Tests

Run unit tests across all applications:

```bash
cd backend
source .venv/bin/activate
python manage.py test --noinput apps.accounts apps.companies apps.data_sources apps.applications apps.recommendations apps.students apps.internships apps.common
```

### 6. Individual Phase 1 Verification Scripts

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

# Phase 3 resumes — run Celery tasks synchronously (no broker) in dev/tests
CELERY_TASK_ALWAYS_EAGER=False

# Phase 3 storage (Section 7.7.2) — filesystem (local dev) or s3
STORAGE_BACKEND=filesystem
# -- only when STORAGE_BACKEND=s3 --
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_STORAGE_BUCKET_NAME=your-bucket-name
# AWS_S3_REGION_NAME=us-east-1
# AWS_S3_ENDPOINT_URL=          # MinIO / DigitalOcean Spaces / Wasabi
# AWS_S3_CUSTOM_DOMAIN=          # public CDN; empty = signed URLs
# AWS_QUERYSTRING_AUTH=True     # private resumes unless custom domain set

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
