# CHECKLIST. PR-1 Manual QA

## Configuration

- [x] JavaScript syntax checks pass for changed backend modules.
- [x] Production startup configuration rejects a missing `JWT_SECRET`.
- [x] Development defaults use strict, non-secure cookies.
- [x] Comma-separated frontend origins are parsed correctly.
- [x] No known committed credential literal remains in environment examples.

## Backend Startup

- [x] Backend starts with Temporal disabled.
- [x] Backend starts with automatic seed disabled.
- [x] `SEED_PROFILE=none` suppresses seed even when automatic seed is enabled.
- [x] Backend starts with reminders disabled.
- [x] Backend starts with legacy seed enabled against the local database.
- [x] `npm run dev:backend` reaches the listening state.

## API Behavior

- [x] `/health` returns HTTP 200 with `ok: true`.
- [x] `/api/configuracion` remains available.
- [x] `/api/temporal/start` returns controlled HTTP 503 when disabled.
- [x] `/api/upload/public` returns controlled HTTP 403 before Multer when disabled.
- [x] Allowed CORS origin receives `Access-Control-Allow-Origin`.
- [x] Rejected CORS origin does not receive `Access-Control-Allow-Origin`.
- [x] Login sets the configured cookie name.
- [x] `/api/auth/me` accepts the configured cookie.
- [x] `/api/citas` remains accessible with authentication.
- [x] Logout clears the configured cookie.

## Environment-Dependent Checks

- [ ] Docker Compose rendering — Docker CLI is not installed in the execution environment.
- [ ] Temporal-enabled workflow — no Temporal server validation was required for the disabled-path PR.
- [x] Frontend and backend reach ready/listening state together with `npm run dev`.
- [ ] Provider message delivery — external Twilio/OpenWA/Gemini calls were not made.

The frontend reports an existing Turbopack workspace-root warning caused by multiple lockfiles.
