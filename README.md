# Daily Problem Tracker — Backend Service

Spring Boot REST API that powers the **Daily Problem Tracker** ecosystem (Chrome Extension + Web Dashboard).  
Handles authentication (Google OAuth), problem tracking, analytics, Gemini AI integration, and user settings — all backed by a Supabase-hosted PostgreSQL database.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Setting Up a New Test User](#setting-up-a-new-test-user)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Architecture Overview

```
┌──────────────────────┐     ┌──────────────────────┐
│  Chrome Extension    │     │   Web Dashboard       │
│  (Manifest V3)       │     │   (Netlify / local)   │
│                      │     │                       │
│  ● Google OAuth      │     │  ● Google Sign-In     │
│    (chrome.identity) │     │    (GSI library)      │
│  ● Access Token auth │     │  ● ID Token auth      │
└────────┬─────────────┘     └────────┬──────────────┘
         │                            │
         │  POST /api/sync/problem    │  POST /auth/google
         │  (Bearer access_token)     │  (ID token in body)
         ▼                            ▼
┌─────────────────────────────────────────────────────┐
│           DailyProblemTracker-Service                │
│           (Spring Boot 4 · Java 21)                  │
│                                                     │
│  ● SecurityConfig  — JWT validation (Google OIDC)   │
│  ● AuthController  — Google login (ID token flow)   │
│  ● SyncController  — Extension sync (access token)  │
│  ● UserController  — Profile & settings             │
│  ● ProblemController — CRUD problems                │
│  ● AnalyticsController — Stats & streaks            │
│  ● GeminiController — AI analysis & chat            │
│  ● PrepNoteController — Prep notes CRUD             │
│  ● TechnicalConceptController — Concepts CRUD       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Supabase PostgreSQL  │
         │  (ap-south-1)         │
         │                       │
         │  Tables:              │
         │   ● users             │
         │   ● problems          │
         │   ● prep_notes        │
         │   ● technical_concepts│
         └───────────────────────┘
```

### Authentication Flows

There are **two separate auth flows** — one for each client:

| Client           | Token Type           | How It Works                                                                                         |
| ---------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| **Web Dashboard** | Google **ID Token**  | GSI renders sign-in → `POST /auth/google` with `credential` → backend validates via Google JWKS → upserts user |
| **Chrome Extension** | Google **Access Token** | `chrome.identity.getAuthToken()` → `POST /api/sync/problem` with `Bearer <access_token>` → backend calls Google UserInfo API → upserts user |

> Both flows end up calling `UserService.getOrCreateUser(email, name, picture)` — if the email doesn't exist yet, a new user is created with `ROLE_USER`.

---

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Runtime     | Java 21 (Eclipse Temurin)                     |
| Framework   | Spring Boot 4.0.5                             |
| Auth        | Spring Security OAuth2 Resource Server + Google OIDC |
| ORM         | Spring Data JPA + Hibernate                   |
| Database    | PostgreSQL (Supabase hosted)                  |
| AI          | Google Gemini API                              |
| Build       | Maven 3.9+                                    |
| Deploy      | Docker / Render.com                           |

---

## Prerequisites

- **Java 21** — [Download Eclipse Temurin](https://adoptium.net/)
- **Maven 3.9+** — or use the included `./mvnw` wrapper
- **Google Cloud Project** with OAuth 2.0 credentials configured
- **Supabase project** (or a local PostgreSQL via Docker)

---

## Local Development Setup

### 1. Clone and build

```bash
git clone <your-repo-url>
cd DailyProblemTracker-Service

# Build (skip tests for quick start)
./mvnw clean package -DskipTests
```

### 2. Configure environment variables (or use defaults in application.yml)

```bash
# Database (defaults to the Supabase instance in application.yml)
export DATABASE_URL=jdbc:postgresql://localhost:5432/daily_problem_tracker
export DATABASE_USERNAME=tracker_user
export DATABASE_PASSWORD=tracker_password

# Google OAuth Client ID (must match your Google Cloud Console project)
export GOOGLE_CLIENT_ID=683627191123-xxxxx.apps.googleusercontent.com

# Gemini API Key (for AI features)
export GEMINI_API_KEY=your_gemini_api_key

# CORS (defaults allow localhost + chrome-extension + netlify)
export CORS_ALLOWED_ORIGINS=http://localhost:*,chrome-extension://*
```

### 3. (Optional) Start local PostgreSQL via Docker

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 instance on `localhost:5432` with:
- DB: `daily_problem_tracker`
- User: `tracker_user`
- Password: `tracker_password`

### 4. Run the service

```bash
./mvnw spring-boot:run
```

The service starts on **http://localhost:8080**.

---

## Setting Up a New Test User

This section walks through **everything** needed to set up a completely new Google account as a test user for the DPT service.

### Step 1: Add the Test User's Google Account to Google Cloud Console

Since the OAuth app is likely in **"Testing"** mode (not published), only explicitly-listed test users can sign in.

1. Go to **[Google Cloud Console](https://console.cloud.google.com/)**
2. Select the project that owns the OAuth Client ID (`683627191123-...`)
3. Navigate to **APIs & Services → OAuth consent screen**
4. Scroll down to the **Test users** section
5. Click **+ Add Users**
6. Enter the test user's **Gmail address** (e.g., `testuser@gmail.com`)
7. Click **Save**

> [!IMPORTANT]
> Without this step, the test user will see a **"403: access_denied"** error when trying to sign in with Google. This is the most common issue when onboarding a new test user.

> [!NOTE]
> If the app has been moved to **"In Production"** status on the consent screen, this step is not needed — any Google account can sign in. However, if the app uses sensitive/restricted scopes, it must pass Google's verification review first.

### Step 2: Verify OAuth Client Configuration

Make sure the OAuth Client ID is configured to allow the origins/redirects your test user will use:

1. In Google Cloud Console → **APIs & Services → Credentials**
2. Click on the **OAuth 2.0 Client ID** (`683627191123-5551q39di0quqsd7p3oj1nt6oodlajfe`)
3. Under **Authorized JavaScript origins**, ensure these are listed:
   - `http://localhost` (for local web dev)
   - `http://localhost:8080` (for the backend)
   - `https://your-app.netlify.app` (for the deployed web dashboard)
4. Under **Authorized redirect URIs**, ensure:
   - `http://localhost` is listed (if using redirect-based flows)
5. The Chrome Extension's client ID in `manifest.json` must match `app.google.client-id` in `application.yml`

### Step 3: Enable Required Google APIs

Ensure these APIs are enabled in the Google Cloud project:

1. Go to **APIs & Services → Library**
2. Search for and enable (if not already):
   - **Google People API** (or **Google+ API**) — used for UserInfo
   - **Google Docs API** — used by the Chrome Extension
   - **Google Sheets API** — used by the Chrome Extension
   - **Google Drive API** — used for folder browsing

### Step 4: Test via the Web Dashboard (ID Token Flow)

This is the easiest way to verify a new test user:

1. Start the backend: `./mvnw spring-boot:run`
2. Open the web dashboard locally (via a simple HTTP server or Netlify dev):
   ```bash
   # From the Daily-Problem-Tracker-Web directory
   npx serve .
   # Or
   python -m http.server 3000
   ```
3. Navigate to `http://localhost:3000` (or whichever port)
4. Click **"Sign in with Google"**
5. Select the test user's Google account
6. If successful, the user is redirected to the dashboard

**What happens on the backend:**
- `POST /auth/google` receives the Google ID token
- `GoogleTokenValidator` validates it against Google's JWKS
- `AuthController` extracts email/name/picture from claims
- `UserService.getOrCreateUser()` creates a new row in the `users` table
- The user profile is returned to the frontend

### Step 5: Test via the Chrome Extension (Access Token Flow)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** → select the `Daily-Problem-Tracker-Extension` folder
4. Click the extension icon (or open it in the side panel)
5. Sign in with the test user's Google account
6. Submit a problem — it will sync to the backend via `POST /api/sync/problem`

**What happens on the backend:**
- The extension sends a Google **access token** in the `Authorization: Bearer` header
- `SyncController` calls `https://www.googleapis.com/oauth2/v2/userinfo` with that access token
- Google returns the user's email, name, and picture
- `UserService.getOrCreateUser()` creates/finds the user
- The submitted problem is saved to the `problems` table

### Step 6: Verify the Test User Was Created

You can verify in multiple ways:

#### Option A: Check via the API
```bash
# First, get a valid Google ID token for the test user
# (copy it from the browser's sessionStorage after signing in on the web dashboard)

curl -H "Authorization: Bearer <google_id_token>" \
     http://localhost:8080/api/users/me
```

#### Option B: Check directly in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project → **Table Editor** → `users` table
3. Look for a row with the test user's email

#### Option C: Check via SQL
```sql
SELECT id, email, name, role, created_date
FROM users
WHERE email = 'testuser@gmail.com';
```

#### Option D: Check the application logs
When the service is running, look for log lines like:
```
[Auth] Google login attempt for email: testuser@gmail.com
[Auth] User testuser@gmail.com logged in successfully (id=42)
```

---

### Quick Checklist for New Test Users

Use this checklist every time you onboard a new test user:

- [ ] **Google Cloud Console** — Added email to OAuth consent screen → Test users
- [ ] **APIs enabled** — People API, Docs API, Sheets API, Drive API are all enabled
- [ ] **OAuth origins** — JavaScript origins include the domains the user will access from
- [ ] **Backend running** — The service is running on port 8080 (local or deployed)
- [ ] **Web sign-in** — Test user can sign in via the Web Dashboard
- [ ] **Extension sign-in** — Test user can sign in via the Chrome Extension
- [ ] **User created** — Verify the user row exists in the `users` table
- [ ] **Problem sync** — Submit a test problem and verify it appears in the `problems` table

---

### Troubleshooting

| Problem                                    | Likely Cause                                                                                  | Fix                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **403: access_denied** on Google sign-in   | Test user's email not added to OAuth consent screen test users                                | Add email in Google Cloud Console → OAuth consent screen → Test users                                       |
| **401: invalid_token** from backend        | Token audience doesn't match `app.google.client-id`                                           | Ensure `GOOGLE_CLIENT_ID` env var (or `application.yml`) matches the client ID in the extension/web app      |
| **CORS error** in browser console          | Origin not in `app.cors.allowed-origins`                                                      | Add the origin to `CORS_ALLOWED_ORIGINS` env var or `application.yml`                                       |
| **Network error** from extension           | Backend not running on `http://localhost:8080`                                                 | Start the service with `./mvnw spring-boot:run`                                                             |
| **Token expired** after ~1 hour            | Google ID tokens expire after 1 hour                                                          | Sign in again to get a fresh token; the web app stores it in `sessionStorage`                                |
| **Extension sync fails (401)**             | Google access token expired or invalid                                                        | Re-authenticate in the extension; `chrome.identity.getAuthToken()` should refresh it                         |
| **"Error: idpiframe_initialization_failed"** | Running on a non-allowed origin or cookies/3rd-party blocked                                 | Add the origin to OAuth client's authorized JS origins; allow 3rd-party cookies for Google                   |
| **User created but no problems**           | Problem was submitted but the user ID didn't match                                             | Check the `user_id` FK on the `problems` table; ensure the same email resolves to the same user              |

---

## API Endpoints

### Public / Auth (no token required)

| Method | Path                  | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| POST   | `/auth/google`        | Google ID token login (web dashboard)    |
| POST   | `/api/sync/problem`   | Sync problem from Chrome Extension       |

### Protected (requires Google ID Token as Bearer)

| Method | Path                         | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | `/api/users/me`              | Get current user's profile          |
| PUT    | `/api/users/me/settings`     | Update user settings                |
| GET    | `/api/problems`              | List user's problems                |
| POST   | `/api/problems`              | Create a new problem                |
| GET    | `/api/analytics`             | Get user's analytics/stats          |
| POST   | `/api/gemini/analyze`        | Gemini AI code analysis             |
| POST   | `/api/gemini/chat`           | Gemini AI chat                      |
| GET    | `/api/prep-notes`            | List prep notes                     |
| POST   | `/api/prep-notes`            | Create a prep note                  |
| GET    | `/api/technical-concepts`    | List technical concepts             |
| POST   | `/api/technical-concepts`    | Create a technical concept          |

---

## Environment Variables

| Variable               | Default                                           | Description                                |
| ---------------------- | ------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`         | Supabase pooler URL                               | JDBC connection string for PostgreSQL      |
| `DATABASE_USERNAME`    | `postgres.qqxeaqtjykfdujxgocdr`                   | Database username                          |
| `DATABASE_PASSWORD`    | (set in application.yml)                           | Database password                          |
| `GOOGLE_CLIENT_ID`     | `683627191123-...apps.googleusercontent.com`       | Google OAuth 2.0 Client ID                 |
| `GEMINI_API_KEY`       | `YOUR_GEMINI_API_KEY`                              | Google Gemini API key                      |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:*,chrome-extension://*,https://*.netlify.app` | Comma-separated allowed CORS origins |

---

## Deployment

### Docker

```bash
# Build image
docker build -t dpt-service .

# Run with environment variables
docker run -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://your-db-host:5432/postgres \
  -e DATABASE_USERNAME=your_user \
  -e DATABASE_PASSWORD=your_password \
  -e GOOGLE_CLIENT_ID=your_client_id \
  -e GEMINI_API_KEY=your_gemini_key \
  dpt-service
```

### Render.com

The service is deployed on Render at `https://daily-problem-tracker.onrender.com`.  
Environment variables are configured in the Render dashboard.
