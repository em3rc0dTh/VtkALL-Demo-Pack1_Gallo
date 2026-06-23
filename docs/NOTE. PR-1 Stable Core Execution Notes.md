# NOTE. PR-1 Stable Core Configuration and Hardening

## What Was Implemented

Centralized backend runtime configuration, removed silent production JWT fallback behavior, made CORS and auth cookies configurable, and added application-level switches for Temporal, legacy seed, reminders, and public uploads. Runtime consumers for MongoDB, Gemini/Ollama, OpenWA, and Twilio now obtain values from the central environment module. Existing routes, models, appointment behavior, frontend code, and Temporal workflow names were preserved.

## Files Changed

```text
.env.example
.env.prod-example
.gitignore
audit-log/AUDITORIA_TECNICA_EXHAUSTIVA.md
backend/config/db.js
backend/index.js
backend/middleware/auth.js
backend/routes/auth.js
backend/routes/temporal.js
backend/routes/upload.js
backend/routes/webhook.js
backend/seed.js
backend/services/gemini.js
backend/services/twilio.js
backend/utils/jwt.js
docker-compose.yml
```

## Files Created

```text
backend/.env.example
backend/config/appConfig.js
backend/config/env.js
docs/CHECKLIST. PR-1 Manual QA.md
docs/NOTE. PR-1 Stable Core Execution Notes.md
docs/PLAN. PR-1 Stable Core Configuration and Hardening.md
```

## Files Removed Or Untracked From Git

```text
.env
backend/.env
```

Both local files remain present and ignored. Values previously committed must be rotated externally; Git history was not rewritten.

## Configuration Changes

```env
NODE_ENV=development
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=replace-with-a-long-random-secret
JWT_COOKIE_NAME=token
JWT_COOKIE_MAX_AGE_HOURS=24
JWT_COOKIE_SAMESITE=strict
MONGODB_URI=mongodb://localhost:27017/mecanica-pro
ENABLE_AUTO_SEED=true
SEED_PROFILE=legacy
ENABLE_RECORDATORIOS=true
ENABLE_TEMPORAL=false
TEMPORAL_ADDRESS=localhost:7233
ENABLE_PUBLIC_UPLOAD=true
GEMINI_API_KEY=
GCP_API_KEY=
OLLAMA_URL=http://localhost:11434
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
OPENWA_API_URL=http://localhost:2785
OPENWA_API_KEY=
OPENWA_SESSION_NAME=mecanica-bot
```

`FRONTEND_ORIGIN` accepts a comma-separated allowlist. `JWT_COOKIE_SAMESITE` accepts `strict`, `lax`, or `none`; its default is `strict` in development and `none` in production.

## Backend Startup Behavior

```text
CORS: Uses the configured comma-separated frontend allowlist with credentials enabled.
JWT secret validation: Production throws before startup when JWT_SECRET is missing; development warns and uses an explicitly insecure local-only fallback.
Cookie configuration: Name, lifetime, and SameSite are configurable; cookies are HTTP-only and become Secure in production.
MongoDB URI: Loaded through the central environment module.
Seed execution: Runs the existing legacy seed only when ENABLE_AUTO_SEED=true and SEED_PROFILE is not none.
Recordatorios: Initial processing and the hourly interval only start when ENABLE_RECORDATORIOS=true.
Temporal: Routes return 503 and Gemini skips connections/workflows when ENABLE_TEMPORAL=false.
Public uploads: The public route returns 403 before Multer writes a file when ENABLE_PUBLIC_UPLOAD=false.
```

`ENABLE_TEMPORAL=false` prevents application connections, although Docker Compose may still start Temporal services and retains the existing backend dependency.

## Commands Executed

```powershell
git status --short --branch
git fetch --all --prune
git branch --all --no-color
git rm --cached -- backend/.env
git rm --cached -- .env
npm install --prefix backend
npm install --prefix frontend
node --check <changed-backend-file>
node --input-type=module -e "<configuration assertions>"
node index.js
curl.exe <health/configuration/Temporal/upload/CORS request>
npm run dev:backend
npm run dev
git diff --check
rg <secret-and-configuration scans>
```

Test runs used only temporary, non-production JWT values and ports; those values are not documented or committed.

## Manual Validation

```text
[PASS] Branch base matches main/origin/main after fetch; the base commit is the merge of feat/v2.
[PASS] Changed backend JavaScript files pass node --check.
[PASS] Production configuration fails early without JWT_SECRET.
[PASS] Development cookie defaults and comma-separated CORS origins parse correctly.
[PASS] Backend starts with ENABLE_TEMPORAL=false, ENABLE_AUTO_SEED=false, and ENABLE_RECORDATORIOS=false.
[PASS] SEED_PROFILE=none suppresses seed when ENABLE_AUTO_SEED=true.
[PASS] /health returns HTTP 200 and ok: true.
[PASS] /api/configuracion returns HTTP 200.
[PASS] /api/temporal/start returns controlled HTTP 503 before DB or Temporal work.
[PASS] /api/upload/public returns controlled HTTP 403 before file handling.
[PASS] Allowed CORS origin receives the allow-origin header; blocked origin does not.
[PASS] Backend starts with ENABLE_AUTO_SEED=true and SEED_PROFILE=legacy against the existing local database.
[PASS] Login sets a custom configured cookie name.
[PASS] /api/auth/me and /api/citas return HTTP 200 using that cookie.
[PASS] Logout clears the configured cookie.
[PASS] npm run dev:backend reaches MongoDB connection and listening state.
[PASS] npm run dev reaches both backend listening state and Next.js ready state after installing declared dependencies.
[PASS] Secret scan no longer finds the removed JWT/Twilio credential literals outside ignored local env files.
[NOT RUN] docker compose config: Docker CLI is not installed.
[NOT RUN] Temporal-enabled workflow and external provider delivery require their external services.
```

Installing declared dependencies reported existing audit findings: backend has three moderate and five high; frontend has one low and three moderate. No automatic audit fix was applied because dependency upgrades are outside PR-1. Next.js also reports an existing Turbopack workspace-root warning caused by multiple lockfiles.

## Known Limitations

```text
No vertical config implemented yet.
No seed split by business yet.
No /api/cases or CaseService yet.
No frontend changes.
No CSRF protection yet.
Temporal services may still start in docker-compose when app-level Temporal is disabled.
Standalone diagnostic/test scripts still read their own process environment and are not part of backend runtime startup.
```

## Risks / Follow-Up Items

- Rotate all provider credentials that were previously committed, including credentials removed from `backend/.env` and old examples.
- Add CSRF protection before relying broadly on cross-site production cookies.
- Review and remediate the npm audit findings in a dependency-focused PR.
- Add automated configuration and HTTP integration tests to avoid relying on local MongoDB fixtures.
- Resolve the Next.js/Turbopack workspace-root warning in a frontend tooling PR.
- Consider Docker profiles for optional Temporal infrastructure in a later operational PR.

## Deviations From Original Plan

- Sanitized `.env.prod-example` and the audit document because they repeated the removed hardcoded JWT value.
- Removed the tracked root `.env` in addition to `backend/.env` after the final security review found both contained local configuration; both physical files were preserved and ignored.
- Centralized runtime OpenWA and Twilio configuration as required by the single dotenv/configuration entrypoint.
- Docker validation could not run because Docker is unavailable.

## Rollback Notes

```text
Revert this PR.
Restore previous env behavior if needed.
Ensure local .env and backend/.env still exist but remain untracked.
Do not restore credentials that have been rotated externally.
```
