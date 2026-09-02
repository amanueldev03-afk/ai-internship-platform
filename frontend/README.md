# AI Internship Platform — Frontend

Frontend application for the **AI Internship Platform**, built with React, TypeScript, Redux Toolkit, and Vite. The frontend integrates directly with the live Django REST Framework backend APIs developed in Phases 2–6, providing a seamless student experience from registration to AI-ranked internship recommendations and external applications.

---

## Tech Stack

* **Core Framework**: React 18 + TypeScript 5
* **Build Tool & Dev Server**: Vite 5
* **State Management**: Redux Toolkit (RTK) + React-Redux
* **Routing**: React Router DOM v6 (with Protected, Public, and Role-based Route Guards)
* **HTTP Client**: Axios (with JWT interceptors, automatic single-retry token refresh on 401, and graceful logout on refresh failure)
* **Styling**: Tailwind CSS + PostCSS + Autoprefixer
* **Document Viewer**: `docx-preview` (in-page Word document preview) + native PDF iframe viewer
* **Testing**: Vitest + React Testing Library + jsdom
* **Code Quality**: ESLint 9 + typescript-eslint

---

## Requirements

* **Node.js**: `v18.x` or `v20.x`+
* **Package Manager**: `npm` (v9+ / v10+)
* **Backend**: Django REST Framework backend running on `http://localhost:8000`
* **Services**: PostgreSQL, Redis, and Celery worker running for asynchronous CV parsing

---

## Installation

Clone the repository and install frontend dependencies:

```bash
cd frontend
npm install
```

---

## Environment Variables

Create a `.env` file in the `frontend/` directory (or use `.env.example` as a template):

```env
# Base URL for Backend API endpoints
VITE_API_BASE_URL=http://localhost:8000/api

# Backend origin (for media files and OAuth redirects)
VITE_BACKEND_URL=http://localhost:8000
```

> **Security Note**: Never commit actual API keys, JWT secrets, or production passwords to version control. The repository `.gitignore` ensures `.env` and `.env.local` files remain untracked.

---

## Development

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

By default, the frontend runs at **`http://localhost:5173`**. Requests to `/api` and `/media` are proxied to the backend at `http://127.0.0.1:8000`.

---

## Testing & Quality Assurance

Run the comprehensive frontend test suite (unit and integration tests):

```bash
# Run tests once with Vitest
npm test -- --run

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui
```

### Linting

```bash
npm run lint
```

### Type Checking & Production Build

```bash
npm run build
```

This executes `tsc -b` (TypeScript strict type check) followed by `vite build` (Rollup production bundling) to generate optimized output in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Phase 7 Implemented Features

### 1. Task 7.1 — Authentication & Route Guarding
* **Registration**: Full form with validation and verification prompt.
* **Email Verification**: Token verification endpoint and resend link functionality.
* **Login & Social Sign-In**: Email/password authentication and Google OAuth 2.0 social login flow.
* **Password Recovery**: Forgot password request and token-based reset password forms.
* **Token Persistence & Refresh**: JWT access/refresh token persistence in `localStorage` + Redux state.
* **401 Interceptor Flow**: Axios interceptor automatically detects expired access tokens, requests a new token via `POST /api/auth/token/refresh/`, and retries the original request once without infinite loops. If refresh fails, it clears credentials and redirects to `/login`.
* **Route Guards**: `ProtectedRoute`, `PublicRoute`, and `RoleRoute` guarding authenticated dashboard and profile routes.

### 2. Task 7.2 — Student Profile Management
* **Profile Sections**:
  * Personal Information (phone, date of birth, bio, location)
  * Profile Photo Upload (instant preview, multipart upload, validation)
  * Education (university, field of study, education level, current year)
  * Technical Skills (searchable catalog, skill tags, canonical levels)
  * Career Interests (field tags, target roles)
  * Internship Preferences (work mode, internship type, start/end dates, immediate availability)
* **Real Backend Errors**: DRF validation errors mapped field-by-field to form controls with inline alerts.
* **Resume Upload & CV Extraction**:
  * Supports PDF and Word DOCX formats with 5MB max file size validation.
  * Real-time polling for Celery background CV analysis task status.
  * Extracted sections view: Extracted Skills, Education, Experience, Multiple Projects, Certifications, and Spoken Languages.
  * Rich in-page document viewer: interactive PDF viewer and rendered DOCX document pages.

### 3. Task 7.3 — Student Dashboard
* Real-time profile completion percentage breakdown.
* Resume processing badge and direct upload/preview quick action.
* Metrics summary (AI recommendation count, saved internships count, applied internships count, active interview count).
* Quick action navigation linking directly to profile sections.

### 4. Task 7.4 — AI-Ranked Recommendations
* Powered by the Phase 6 AI Recommendation Engine (v2 embedding + rule-based scorer).
* Displays match percentage score badges (sorted in descending order).
* Detailed recommendation cards with company information, required skills tags, location, work mode, deadlines, and personalized AI match explanations.
* Save / Unsave toggle with optimistic updates and backend synchronization (`/api/recommendations/saved/`).

### 5. Task 7.5 — Internship Details & External Apply
* Full listing detail page displaying full job descriptions, required skills, organization details, deadlines, and location.
* **External Application Flow**:
  * Clicking **Apply** triggers a safe external redirect opening the employer's official `application_url` in a **new browser tab** (`target="_blank"` with `rel="noopener noreferrer"`).
  * No iframes, no embedded webviews, and no backend proxies are used.
  * Authentication tokens and JWTs are never appended to external URLs.
  * Simultaneously records the application in the student's dashboard application tracker.

### 6. Task 7.6 — Search & Filtering
* **Debounced Keyword Search**: User typing is debounced (300ms) before querying the backend search API.
* **Parametric Filters**: Matches Phase 4 Task 4.3 specification:
  * Location (City / Country / Remote)
  * Internship Type (Remote / On-site / Hybrid)
  * Work Mode (Full-time / Part-time)
  * Skill Tags / Technologies
* Reset and clear filters with real-time result count updates and responsive empty states.

---

## Authentication Flow

```text
User enters credentials
         ↓
POST /api/auth/login/
         ↓
Tokens stored in localStorage & Redux (access + refresh)
         ↓
Axios Interceptor attaches "Authorization: Bearer <access_token>"
         ↓
API responds with 401 Unauthorized (token expired)
         ↓
POST /api/auth/token/refresh/ with refresh token
         ↓
Success: New access token saved & original request retried
Failure: Tokens cleared & user redirected to /login
```

---

## External Application Flow

```text
Student views Internship Details / Recommendation Card
                        ↓
                  Clicks "Apply"
                        ↓
        Validates `application_url` exists
                        ↓
     window.open(application_url, '_blank', 'noopener,noreferrer')
                        ↓
        Employer's external application page opens in a NEW TAB
                        ↓
   POST /api/recommendations/<id>/apply/ records application in database
```

---

## Verified End-to-End Student Journey

The complete student journey has been verified against the live backend:

1. **Register** (`/register`) → Account created with role `student`.
2. **Verify Email** (`/verify-email`) → Token verified successfully.
3. **Login** (`/login`) → JWT tokens received and stored in Redux & localStorage.
4. **Build Profile** (`/profile`) → Personal info, education, skills, interests, and preferences saved.
5. **Upload Resume** (`/profile`) → PDF/DOCX uploaded; Celery extracts skills, education, experience, and all projects.
6. **Student Dashboard** (`/dashboard`) → Profile completion % and metric counts updated.
7. **Ranked Recommendations** (`/recommendations`) → Top AI-matched internships displayed in descending score order.
8. **Search & Filter** (`/search`) → Debounced search and multi-facet filtering.
9. **Internship Details** (`/internships/:id`) → Full listing rendered.
10. **Save Internship** → Toggled and tracked under saved internships.
11. **External Apply** → Opens employer website in a new tab without exposing credentials.

