# AI Internship Platform

An AI-powered platform that matches students with internships using semantic embeddings, skill matching, and weighted scoring. Students get ranked, explained recommendations based on their profile and CV.

---

## Backend Status: ✅ Complete and Verified

**Total REST API Endpoints:** 78 (5 duplicate endpoints removed)  
**Verification Status:** All endpoints tested via curl - 100% success rate  
**AI System:** Fully functional with semantic matching and skill scoring  
**Authentication:** Working with JWT tokens and email verification  
**Recommendations:** Ranked results with multi-factor scoring  
**CV Extraction:** Fully implemented with profile merging for recommendations

### Phase 8: Student Lifecycle Completed and Verified

The remaining student lifecycle tasks are implemented and validated end-to-end:

- Save / unsave internships with immediate frontend state synchronization
- Application redirect + tracking without blocking the application flow
- Recommendation and application history review pages for students
- High-score recommendation and saved-internship email notifications sent via Celery after commit

Verified coverage includes the remaining Table 6.1 tasks around save, apply, notify, and review-history behavior, with the Django and Vitest suites both passing in their project environments.

### Phase 9: Admin Dashboard & Monitoring System (Complete)

Phase 9 delivers the complete admin dashboard, analytics, and monitoring system for platform administrators:

**Backend Features (Django REST Framework):**

- **Student Management** (`/api/admin/students/`): List all students with search/filter/ordering, activate/deactivate functionality, view student activity logs with aggregated action counts
- **Analytics** (`/api/admin/analytics/`): System-wide statistics (user counts, internship counts, needs_review count, most-requested skills, recommendation stats)
- **AI Monitoring** (`/api/admin/analytics/ai/`): Per-day recommendation tracking and score distribution analysis (bucketed by match quality)
- **Internship Review Queue** (`/api/internships/admin/review/`): List internships flagged for review (broken_link or near_duplicate), with approve/reject/remove actions
- **Data Source Health** (`/api/internships/admin/data-sources/health/`): Collection monitoring (status, run count, error tracking, record statistics)

**Frontend Features (React + Vite):**

- **Admin Dashboard** (`/admin/dashboard`): KPI cards (total users, internships, review queue size), skill demand widget, recommendation metrics
- **Student Management** (`/admin/students`): Searchable student list, activate/deactivate controls, modal activity log viewer
- **Internship Review Queue** (`/admin/internships/review`): Paginated review list with filter/search, invalid URL display, skill confidence badges, action buttons
- **Data Source Health** (`/admin/data-sources`): Health status per ingestion source, run statistics, error monitoring
- **AI Monitoring** (`/admin/ai-monitoring`): Recommendation volume trend chart, score distribution histogram, average match score display

**Authorization & Security:**

- Role-based access control: all admin endpoints guarded by `IsAdminRole` permission
- Frontend route protection: RoleRoute component enforces admin role before rendering
- JWT token embeds role claim for immediate frontend routing decisions

**Test Coverage:**

- Backend: 33 admin tests (StudentActivityLog, analytics aggregations, auth) ✅
- Backend: 127 internship tests (review queue, health monitoring) ✅
- Frontend: 118 component tests across 21 test files ✅
- **Total: 278 tests passing**

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

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and other values

# Set up database (PostgreSQL must be running)
python manage.py migrate

# Run backend
python manage.py runserver
```

Backend available at `http://localhost:8001`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`

---

## API Documentation

With the backend running:

- Swagger UI: `http://localhost:8001/api/docs/`
- ReDoc: `http://localhost:8001/api/redoc/`
- Health check: `http://localhost:8001/api/health/`

---

## Test Scripts

All test scripts are located in `backend/scripts/`:

- `end_to_end_test.py` - Full business logic flow test
- `verify_ai_system.py` - AI system verification
- `demo_recommendation_flow.py` - Recommendation demonstration
- `verify_cv_extraction.py` - CV extraction verification
- `test_endpoints_comprehensive.sh` - Comprehensive endpoint testing

Run tests:

```bash
cd backend
source .venv/bin/activate
python scripts/end_to_end_test.py
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
│   │   ├── companies/              # Company entities & admin management
│   │   └── data_sources/           # Ingestion sources & configs
│   ├── ai_engine/                  # Standalone AI package
│   ├── scripts/                    # Test scripts
│   └── manage.py
├── frontend/                       # Vite + React + TypeScript
└── README.md
```

---

## Tech Stack

| Layer             | Technology                                          |
| ----------------- | --------------------------------------------------- |
| Backend framework | Django 6.0 + Django REST Framework                  |
| Auth              | JWT (SimpleJWT)                                     |
| Database          | PostgreSQL 15 + pgvector (vector similarity search) |
| Task queue        | Celery + Redis                                      |
| AI / embeddings   | sentence-transformers (all-MiniLM-L6-v2, 384-dim)   |
| CV parsing        | spaCy (en_core_web_sm)                              |
| Frontend          | Vite + React 18 + TypeScript                        |
| API docs          | drf-spectacular (Swagger + ReDoc)                   |

---

## Key Features

### Authentication System

- Student registration and login
- Admin login with role-based access
- JWT token authentication
- Email verification
- Password reset

### Student Profile Management

- Profile creation and updates
- Skills management (catalogue-validated)
- Career interests
- Internship preferences
- CV upload and processing

### Internship Management

- Internship listing and details
- Admin can create/update/delete internships
- Skills catalog
- Data source management

### Application System

- Students can apply to internships
- Application tracking
- Save/unsave internships

### AI Recommendation System

- Embedding generation (384-dim vectors)
- Semantic similarity matching
- Skill matching (exact + blended)
- Profile + CV skill merging
- Ranked recommendations with scoring

### CV Extraction

- CV parser module (extracts skills, experience, education)
- CV models in database
- Profile + CV data merging for recommendations
- CV-based matching score calculation

### Dashboards

- Student dashboard (applications and saved internships)
- Admin dashboard (statistics and recent activity)

---

## Endpoint Summary

**Total Endpoints:** 78 REST API endpoints

**Categories:**

- System Endpoints (4): Health check, API schema, Swagger UI, ReDoc
- Authentication (10): Registration, login, refresh, password reset, email verification
- Student Profiles (19): Profile CRUD, skills, interests, preferences, CV upload
- Internships (9): Listing, details, latest
- Admin Internships (22): CRUD, verification, dashboard, sources, skills
- Recommendations (3): Get recommendations, history, feedback
- Companies (6): Admin CRUD
- Data Sources (1): Admin sync

---

## Verification Results

All business logic has been verified and is working correctly:

✅ All 78 endpoints tested via curl - 100% success rate  
✅ No duplicate logic or endpoints  
✅ Swagger API fully functional  
✅ Authentication and authorization working  
✅ AI recommendation system operational  
✅ CV extraction and profile merging implemented  
✅ End-to-end business logic test passed

---

## Backend Audit Summary

**Completed Phases:**

- Removed 5 duplicate authentication endpoints
- Fixed 71 code issues across 6 files
- Added operation IDs to 23 critical endpoints
- Added rate limiting to 9 authentication endpoints
- Consolidated Swagger tags
- Fixed bare exception handling
- Optimized queries with select_related

**Files Modified:**

- `config/urls.py` - Removed empty URL includes
- `apps/internships/views.py` - Query optimization + exception handling + operation IDs
- `apps/students/views.py` - Swagger tags + exception handling + operation IDs
- `apps/data_sources/views.py` - Exception handling
- `apps/recommendations/views.py` - Exception handling + operation IDs
- `apps/accounts/views.py` - Operation IDs + deprecation warnings + rate limiting

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review all code changes
- [ ] Run regression tests
- [ ] Test error handling scenarios
- [ ] Verify Swagger documentation loads
- [ ] Test rate limiting on authentication endpoints
- [ ] Create database backup

### Deployment

- [ ] Deploy to staging environment
- [ ] Monitor for errors
- [ ] Test all critical endpoints
- [ ] Verify no breaking changes

### Post-Deployment

- [ ] Monitor application logs
- [ ] Check for error spikes
- [ ] Verify performance metrics
- [ ] Document any issues

---

## Conclusion

The backend project is complete and verified. All core features are functional and tested. The system is ready for frontend development.

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

| Task                           | Endpoint(s)                                                                               | Behavior                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 Registration               | `POST /api/auth/register/`                                                                | `full_name`, `email`, `password`, optional `phone`. Creates an **inactive** user + empty `StudentProfile` shell and emails a verification link. Duplicate email → `400`.                        |
| 2.2 Email verification         | `GET /api/auth/verify-email/<uid>/<token>/`                                               | Decodes the token, checks expiry, flips `is_email_verified=True` **and** `is_active=True`. Single-use (a redeemed token → `400`).                                                               |
| 2.3 Login & JWT                | `POST /api/auth/login/`                                                                   | Valid creds → `200` with access + refresh tokens, **`role` embedded in the JWT claims** for front-end routing. Wrong password → `401`; unverified/inactive account → `403` "verify your email". |
| 2.4 Refresh & protected routes | `POST /api/auth/refresh/`                                                                 | Issues new access (+ rotated refresh) token. Global `IsAuthenticated` default; public endpoints opt out with `AllowAny`. No token → `401`.                                                      |
| 2.5 Password reset             | `POST /api/auth/password-reset/` → `POST /api/auth/password-reset-confirm/<uid>/<token>/` | Full round trip via emailed link; new password set, old password invalidated.                                                                                                                   |
| 2.6 RBAC                       | `apps.internships.permissions.IsStudent` / `IsAdminRole`                                  | Custom permissions checking `request.user.role`. Student JWT → admin endpoint → `403` (Section 6.7.2).                                                                                          |

> Note: the canonical auth flow lives under `/api/auth/*`. A few split endpoints
> remain under `/api/accounts/*` for backward compatibility:
> `/api/accounts/student/login/`, `/api/accounts/admin/login/`,
> `/api/accounts/logout/`, `/api/accounts/me/`,
> `/api/accounts/forgot-password/`, `/api/accounts/reset-password/`,
> `/api/accounts/verify-email/`, `/api/accounts/resend-verification/`,
> `/api/accounts/change-password/`. Duplicate `register/`, `token/refresh/` and
> `verify-email/<uid>/<token>/` routes were removed in favour of the canonical
> `/api/auth/*` equivalents.

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

| Method        | Action                                         |
| ------------- | ---------------------------------------------- |
| `GET`         | Return my personal info + education.           |
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
> `StudentProfile` (migration `0015`) to support Section 5.3.2. The consolidated
> student profile module lives under `/api/students/*` (`/api/students/me/` is
> the canonical personal+education boundary); the more permissive catch-all
> `/api/profile/` prefix was removed and folded into `/api/students/`.

### Task 3.2 — Skills & career interests endpoints

`GET` / `POST` / `DELETE` `/api/students/me/skills/` and the same for
`/api/students/me/interests/` manage the catalogue-validated skills and
career interests on the authenticated student's profile.

| Method   | `/me/skills/`                                                         | `/me/interests/`                                                            |
| -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `GET`    | List skills on my profile (active catalogue skills, ordered by name). | List interests on my profile (active catalogue interests, ordered by name). |
| `POST`   | `{"skill_id": <id>}` → 201. Adds the catalogue skill.                 | `{"interest_id": <id>}` → 201. Adds the catalogue interest.                 |
| `DELETE` | `{"skill_id": <id>}` → 204. Removes it (idempotent).                  | `{"interest_id": <id>}` → 204. Removes it (idempotent).                     |

**Catalogue validation (Task 1.3) — no free-text.** The POST body must carry a
`skill_id` / `interest_id` referencing an existing **active** `Skill` /
`CareerInterest` row from the catalogue. Anything else — an unknown ID or a
skill/interest _name_ string — is rejected with `400`.

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

| Method  | Action                                      |
| ------- | ------------------------------------------- |
| `GET`   | Return my internship preferences.           |
| `PATCH` | Partially update them; all fields optional. |

| Field                | Accepted values                     | Stored on `StudentProfile` | AI engine use                                 |
| -------------------- | ----------------------------------- | -------------------------- | --------------------------------------------- |
| `country`            | free text                           | `country`                  | Location score + semantic profile text        |
| `city`               | free text                           | `city`                     | Location score + semantic profile text        |
| `work_mode`          | `full_time`, `part_time`, `either`  | `work_type`                | Work-mode score (`calculate_work_mode_score`) |
| `internship_type`    | `remote`, `onsite`, `hybrid`, `any` | `internship_type`          | Hard filter (`passes_hard_filters`)           |
| `availability_start` | `YYYY-MM-DD`                        | `availability_start`       | —                                             |
| `availability_end`   | `YYYY-MM-DD`                        | `availability_end`         | —                                             |

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
full-student `/api/students/` serializer too.

Access is restricted to `IsStudent` (RBAC from Task 2.6): an admin JWT
receives `403`. Successful updates re-queue the student embedding and bust
the recommendation cache.

### Task 3.4 — Resume upload (`/api/students/me/resume/`)

`POST` and `GET` `/api/students/me/resume/` handle the student's canonical
resume file (Section 5.3.6 / Figure 5.2).

| Method | Action                                                                 |
| ------ | ---------------------------------------------------------------------- |
| `POST` | Upload a resume via `multipart/form-data` field `file`. PDF/DOCX only. |
| `GET`  | Return resume metadata + latest CV processing status.                  |

**Validation (Section 7.6.5 — no disguised executables).** The upload is
validated three ways, in order:

1. **Size** — max 5 MB (`ValueError` → 400).
2. **Extension** — filename must be `.pdf` / `.docx`.
3. **MIME by content sniffing** — never the extension alone:
   - `.pdf` → the bytes must begin with a genuine `%PDF` header.
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

| Piece      | Detail                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task       | `apps.students.tasks.parse_resume(student_id)` (shared pipeline extracted into `_complete_cv_processing`).                                           |
| Trigger    | `transaction.on_commit(lambda: parse_resume.delay(profile.user_id))` in `_store_resume`.                                                             |
| Flag       | `StudentProfile.resume_parsed` (Boolean) + `resume_parsed_at` (DateTime), migration `0019`.                                                          |
| Eager mode | `CELERY_TASK_ALWAYS_EAGER=True` runs tasks synchronously (no broker) for dev/tests — driven by env (default `False`, set in `config.settings.test`). |

The full broker is wired up in Phase 5; this task exists now and is verified
in eager mode.

**Check (as in tests):** after a valid upload, `StudentProfile.resume_parsed`
is `True` and the created `CV` reached `COMPLETED`.

### Task 3.6 — Profile completion indicator (Sections 3.9.1 / 3.9.2)

Both `GET /api/students/` (full profile) and `GET /api/students/me/` return a
read-only `completion` block that powers the dashboard completion widget:

```json
{
  "percent": 50,
  "sections": {
    "personal": true,
    "education": true,
    "skills": true,
    "interests": false,
    "preferences": false,
    "resume": true
  }
}
```

**Business logic.** The percentage is the share of six equally-weighted
sections that are filled:

| Section       | Filled when                                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `personal`    | any of `phone` / `country` / `city` / `date_of_birth` / `bio` is set                                                                                                                      |
| `education`   | any of `education_level` / `current_year` / `field_of_study` / `university` is set                                                                                                        |
| `skills`      | profile has ≥ 1 catalogue `Skill`                                                                                                                                                         |
| `interests`   | profile has ≥ 1 catalogue `CareerInterest`                                                                                                                                                |
| `preferences` | a real preference is expressed (e.g. `work_type` ≠ default `either`, `internship_type` ≠ default `any`, availability window, preferred locations, relocation) — defaults do **not** count |
| `resume`      | `StudentProfile.resume` points to a stored file                                                                                                                                           |

Each section = 1/6 (≈ 16.7%), so an empty profile is `0%` and percentage
climbs in predictable steps: `0, 17, 33, 50, 67, 83, 100`. `completion` is a
computed serializer field (`apps/students/services/profile_completion.py`) —
no model columns, no migration.

**Check (as in tests):** empty profile → `0%`; filling each section one at a
time yields exactly `17/33/50/67/83/100`; all sections → `100%`; the field is
exposed on both `/api/students/me/` and `/api/students/`.

---

## Phase 6 — AI Recommendation Engine (Complete)

Phase 6 delivers the complete AI-powered recommendation engine that matches students with internships using semantic embeddings, skill matching, weighted scoring, and human-readable explanations. The engine processes student profiles and CVs, scores internships against student preferences, and returns ranked, explained recommendations.

### What Phase 6 Delivers

- **Task 6.1 — Resume Parser**: Pure Python module extracting skills, education, experience from PDF/DOCX using spaCy NER
- **Task 6.2 — Skill Matching**: Exact-match skill intersection scoring (40% weight in final score)
- **Task 6.3 — Semantic Matching**: Sentence-transformers embeddings for synonym detection (blended with exact-match)
- **Task 6.4 — Scoring Functions**: Individual component scores (education, experience, interest, location, work_mode)
- **Task 6.5 — Weighted Ranking**: Configurable weight aggregation per Table 3.1 (Section 3.11.8)
- **Task 6.6 — Explanation Generation**: Threshold-based human-readable explanations (Section 3.11.9)
- **Task 6.7 — Orchestration Entrypoint**: Django-integrated `generate_recommendations()` function with persistence

### Definition of Done (Phase 6)

Given a real (or realistically seeded) student profile and the Phase-5-collected internship pool, the engine returns a ranked, explained list matching the doc's worked examples in shape and behavior.

### Verification

Run the Phase 6 verification scripts:

```bash
cd backend
source .venv/bin/activate

# Task 6.1 — Resume Parser
python scripts/verify_task61_resume_parser.py

# Task 6.2 — Skill Matching
python scripts/verify_task62_skill_matching.py

# Task 6.3 — Semantic Matching
python scripts/verify_task63_semantic_matching.py

# Task 6.4 — Scoring Functions
python scripts/verify_task64_scoring.py

# Task 6.5 — Weighted Ranking
python scripts/verify_task65_ranking.py

# Task 6.6 — Explanation Generation
python scripts/verify_task66_explanation.py

# Task 6.7 — Orchestration Entrypoint
python scripts/verify_task67_orchestration.py
```

Expected: All scripts show `ALL CHECKS PASSED!`

### Phase 6 Architecture

```
ai_engine/
├── resume_parser/          # CV text extraction + spaCy NER
├── skill_matching/         # Exact-match skill intersection
├── semantic_matching/      # Embedding-based similarity
├── scoring/                # Component score functions
├── ranking/
│   └── scorer.py          # Weighted aggregation (Table 3.1)
├── explanation.py          # Threshold-based explanations
└── recommendation.py       # Django-integrated orchestrator
```

### Key Features

**Resume Parser (Task 6.1)**

- PDF/DOCX text extraction
- spaCy NER for entity extraction
- Section-based heuristics (Skills, Experience, Education)
- Skill catalogue matching
- Experience years calculation
- Source tracking (manual vs resume)

**Skill Matching (Task 6.2)**

- Exact name-based intersection
- Overlap ratio: `|student_skills ∩ internship_skills| / |internship_skills|`
- Neutral score (0.5) when no requirements
- Case-insensitive, whitespace-trimmed

**Semantic Matching (Task 6.3)**

- sentence-transformers (all-MiniLM-L6-v2, 384-dim)
- Cosine similarity scaled to 0–100
- Blended skill score: 60% exact-match + 40% semantic
- Catches synonyms exact-match misses

**Scoring Functions (Task 6.4)**

- `education_score`: Field + level alignment (0.0–1.0)
- `experience_score`: Bucket comparison + years boost
- `interest_score`: Career interest match (exact + semantic)
- `location_score`: City/country/remote/relocation
- `work_mode_score`: Remote/hybrid/onsite match

**Weighted Ranking (Task 6.5)**

- Table 3.1 weights: Skills 40%, Education 20%, Interest 15%, Experience 10%, Location 10%, Work Mode 5%
- Configurable weights (module-level constants)
- Score clamping (0.0–100.0)
- Weight validation (sum to 1.0)

**Explanation Generation (Task 6.6)**

- Threshold-based logic (high ≥0.70, medium ≥0.50)
- Avoids false positives (no free-text generation)
- Auditability: clear score → explanation mapping
- Configurable thresholds via `ExplanationConfig`

**Orchestration Entrypoint (Task 6.7)**

- `generate_recommendations(student, limit=50, save_to_db=True)`
- Loads student profile + skills + interests
- Queries active internships
- Applies hard filters (status, type, compensation)
- Scores each using Tasks 6.4-6.6
- Sorts descending by overall_score
- Persists to Recommendation model (update_or_create)
- Returns top N results

### Integration with Django

The orchestration function integrates with Django models:

```python
from ai_engine.recommendation import generate_recommendations
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username="student")

results = generate_recommendations(user, limit=50, save_to_db=True)

for result in results:
    print(f"Score: {result.score:.2f}")
    print(f"Internship: {result.internship.title}")
    print(f"Explanation: {result.explanation}")
    print(f"Breakdown: {result.score_breakdown}")
```

### Database Changes

**StudentSkill Model** (Task 6.1)

- Added `source` field (manual/resume tracking)

**CV Model** (Task 6.1)

- Added `extracted_experience_years` field

**Recommendation Model** (Task 6.7)

- Uses `update_or_create` keyed on (student, internship)
- Stores all component scores + overall_score

### Performance Considerations

- Embedding model cached with `@lru_cache(maxsize=1)`
- Django ORM optimization with prefetch/select_related
- Limit parameter bounds compute (default 50)
- Consider pagination for large internship pools

---

## Phase 5 — Data Source Collection Pipeline (Complete)

Phase 5 delivers the complete data ingestion pipeline with fault isolation,
scheduling, and automated collection from external sources (API, RSS, career
sites). The pipeline normalizes, deduplicates, and validates internship listings
with zero manual intervention.

### What Phase 5 delivers

- **Task 5.2 — Adapter Interface**: Base adapter contract with `FakeAdapter` for testing
- **Task 5.3 — API Collector**: HTTP/JSON adapter with retry logic and rate limiting
- **Task 5.4 — RSS Collector**: feedparser-based RSS feed adapter
- **Task 5.5 — Career Site Collector**: HTML scraping adapter with CSS selectors
- **Task 5.6 — Normalization**: Maps external data to internal Task 1.5 schema with content hashing
- **Task 5.7 — Deduplication**: Exact duplicate (SHA-256) and near-duplicate (fuzzy matching) detection
- **Task 5.8 — Expiration**: Automated expiry of internships past their deadline
- **Task 5.9 — URL Validation**: Async URL validation via Celery
- **Task 5.10 — Scheduling**: Celery Beat schedule for periodic collection + manual sync endpoint
- **Task 5.11 — Fault Isolation**: Try/except blocks ensure one source failing never blocks others

### Definition of Done (Phase 5)

Running the full scheduled pipeline against fixture/mock sources produces
normalized, deduplicated, URL-validated, non-expired Internship rows in
Postgres with zero manual intervention. **TC011 passes**.

### Verification

Run the Phase 5 Definition of Done master validator:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase5_definition_of_done.py
```

Expected: `PHASE 5 DEFINITION OF DONE: ALL 1 CHECKS PASSED!`

### Testing Guides

All Phase 6 testing guides are consolidated in this main README above.

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

| Method          | Path                   | Action                                                                                                                      |
| --------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `GET`           | `/api/companies/`      | Paginated list of all companies, each with a live `internship_count`.                                                       |
| `POST`          | `/api/companies/`      | Create a company (`name` unique, `website` URL, `country`, `industry`). Duplicate name → `400`.                             |
| `GET`           | `/api/companies/<id>/` | Retrieve one company.                                                                                                       |
| `PATCH` / `PUT` | `/api/companies/<id>/` | Update one company.                                                                                                         |
| `DELETE`        | `/api/companies/<id>/` | Delete one company; its internships' `company` links are nulled (`on_delete=SET_NULL`, migration `0018`), listings survive. |

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
| File storage      | django-storages (local filesystem / S3-compatible)  |
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

### 1. Phase 5 Definition of Done Master Validator

Runs Table 6.1's **TC011** as an automated API round-trip: the full scheduled
pipeline runs end-to-end with mock sources, producing normalized, deduplicated,
URL-validated, non-expired Internship rows with zero manual intervention:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase5_definition_of_done.py
```

Expected: `PHASE 5 DEFINITION OF DONE: ALL 1 CHECKS PASSED!`

### 2. Phase 4 Definition of Done Master Validator

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

### 3. Phase 3 Definition of Done Master Validator

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

### 4. Phase 2 Definition of Done Master Validator

Runs Table 6.1's **TC001–TC003** as automated API round-trips covering registration, email verification, login, token refresh, password reset, and RBAC cross-role blocking:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase2_definition_of_done.py
```

Expected: `PHASE 2 DEFINITION OF DONE: ALL 3 CHECKS PASSED!`

> Tests run against `config.settings.test` (throttling disabled, in-memory email outbox) so they do not touch a live database or send real emails:
>
> ```bash
> python manage.py test apps.accounts --settings=config.settings.test
> ```

### 5. Phase 1 Definition of Done Master Validator

Runs full automated verification of all 13 entities, cascade deletion behaviors, unique constraints, `graph_models` output, and a clean database migration from scratch:

```bash
cd backend
source .venv/bin/activate
python scripts/verify_phase1_definition_of_done.py
```

### 6. Django Unit Tests

Run unit tests across all applications:

```bash
cd backend
source .venv/bin/activate
python manage.py test --noinput apps.accounts apps.companies apps.data_sources apps.applications apps.recommendations apps.students apps.internships apps.common
```

### 7. Individual Phase 1 Verification Scripts

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
