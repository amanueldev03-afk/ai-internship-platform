# Phase 0–1 Roadmap vs. Existing Project — Gap Analysis

This document compares the Phase-by-Phase Roadmap (Phases 0 and 1) against the
existing project, and records what was **kept**, **updated**, and **added** when
the verified state was restored.

---

## 1. Verification Results (all green)

| Check | Where it runs | Result |
|---|---|---|
| Django system check | `manage.py check` | ✅ no issues |
| Migration drift | `manage.py makemigrations --check --dry-run` | ✅ no changes detected |
| Phase 1 Definition of Done (master) | `scripts/verify_phase1_definition_of_done.py` | ✅ **60/60** |
| Task 1.2 User & Student | `scripts/verify_user_student.py` | ✅ 37/37 |
| Task 1.3 Skills & Interests | `scripts/verify_skills_interests.py` | ✅ 30/30 |
| Task 1.4 Company & DataSource (+admin) | `scripts/verify_company_datasource.py` | ✅ 27/27 |
| Task 1.5 Internship & InternshipSkill | `scripts/verify_internship_skills.py` | ✅ 22/22 |
| Task 1.6 Recommendation / Saved / ApplicationHistory | `scripts/verify_recommendations_applications.py` | ✅ 30/30 |
| ERD self-review vs Figure 3.1 | `scripts/verify_task1_erd.py` | ✅ matches exactly |
| AI engine skeleton (Phase 0.5) | `scripts/verify_ai_engine.py` | ✅ 15/15 |
| Django unit tests | `manage.py test` | ✅ 145/145 OK |

---

## 2. Compare & Contrast — by Roadmap Phase

### Phase 0 — Environment & Project Skeleton

| Roadmap task | Existing project | Decision |
|---|---|---|
| 0.1 Repo & branches (`main`, `backend-dev`, `frontend-dev`, `ai-dev`) | All four branches exist | **KEEP** |
| 0.2 Backend skeleton — 10 apps + DRF + env vars + CORS | 10 apps present; DRF, djangorestframework-simplejwt, drf-spectacular, django-filter, corsheaders, django-celery-beat, allauth, django-extensions | **KEEP** |
| 0.2 Env vars via django-environ | Uses `python-decouple` + `dj-database-url` (env-var driven; `django-environ` also pinned in `requirements/base.txt`) | **KEEP** (functional equivalent; note deviation) |
| 0.3 DB & Redis via dev docker-compose | `docker-compose.yml` with `pgvector/pgvector:pg15` + `redis:7-alpine` + backend, dev-only | **KEEP** |
| 0.4 Frontend skeleton (Vite+TS+Tailwind+RTK+Router+Axios) + `/api/health/` wire | `frontend/` has all deps; `HomePage` calls `/api/health/` through Vite proxy → Django | **KEEP** |
| 0.5 AI engine skeleton + stub `{"score": 0}` | `backend/ai_engine/` with all 7 subpackages; `stub_score()` verified | **KEEP** |
| Phase 0 DoD | All checks pass (native Postgres+Redis used locally instead of Docker, which isn't running here) | **KEEP** |

### Phase 1 — Database Design & Core Models

| Roadmap task | Existing project | Decision |
|---|---|---|
| 1.1 `TimeStampedModel` base + unit test | `apps/common/models.py` + `TimeStampedModelTest` | **KEEP** |
| 1.2 Custom `User` (email login, role, `is_active`) + `Student` (OneToOne, CASCADE) | Table 3.2/3.3 fields implemented; composition cascade verified | **KEEP** |
| 1.3 `Skill`, `StudentSkill` (unique), `CareerInterest`, `StudentInterest` (unique) | Duplicate-integrity behavior verified (prevents score inflation) | **KEEP** |
| 1.4 `Company` + `DataSource` (api/rss/career_site, JSON config, `last_synced_at`) | Verified incl. admin CRUD | **KEEP** |
| 1.5 `Internship` (deadline, `content_hash`, `external_id`, `application_url`, `source_url`, status) + `InternshipSkill` (unique) | All fields present; dedup/valid-link fields included | **KEEP** |
| 1.6 `Recommendation` (6-factor score breakdown + explanation + "latest wins" upsert), `SavedInternship`, `ApplicationHistory` | `unique_together` + `UniqueConstraint`, upsert pattern verified | **KEEP** |
| Phase 1 DoD (13 entities, Figure 3.1 ERD, clean scratch migration) | Master suite passes 60/60 | **KEEP** |

---

## 3. What was UPDATED / ADDED while restoring

1. **Redis URLs are env-driven (UPDATE, aligned with Phase 0 Task 0.2/0.3).**
   - `backend/config/settings/base.py` now reads `CELERY_BROKER_URL`,
     `CELERY_RESULT_BACKEND`, and `REDIS_URL` from environment/`.env` with the
     previous `127.0.0.1:6379` behavior as defaults.
   - `backend/.env` Redis vars corrected from `6380` → `6379` (the running
     native Redis; compose still uses host port 6380 and now works unchanged).

2. **Repo hygiene (ADD).** Removed the root `.venv/`, `backend/.venv/`,
   `backend/media/*`, `backend/.env`, and `__pycache__/*.pyc` files from
   version control; the project `.gitignore` now keeps them out. The restored
   source is committed on `backend-dev`.

3. **Documentation (ADD).** `documentation/` folder added for phase-level gap
   notes like this one.

---

## 4. Intentional deviations (kept on purpose)

- **`ai_engine/` lives under `backend/`**, not at the repo root (commit
  `d4d9301`). The engine is tightly coupled to Django models/imports, so this
  keeps packaging simple; `verify_ai_engine.py` imports it from `backend/`.
- **`scripts/` lives under `backend/scripts/`** rather than a top-level
  `scripts/`. The verify suite needs the Django venv + `manage.py`, so
  co-locating them is more convenient.
- **`python-decouple` instead of `django-environ`** for env parsing (both are
  pinned; nothing else consumes `django-environ`).
- **Extra entities beyond the 13:** `InternshipSource`, `SavedInternship`,
  `InternshipApplication`, `StudentProfile`, `StudentCV`, `CV`, and
  `InternshipCollectionLog` enrich later phases (supply pipeline, applications)
  and do not conflict with Figure 3.1.