# PLAN. PR-1 Stable Core Configuration and Hardening

## Goal

Make the backend configurable and safer without adding product features or changing existing appointment behavior.

## Scope

- Centralize environment parsing and derived Express/auth configuration.
- Make CORS, auth cookies, Temporal, legacy seed, reminders, MongoDB, and public uploads configurable.
- Preserve local development defaults and existing API routes.
- Sanitize environment examples and stop tracking the real backend environment file.
- Keep Docker Temporal services available while preventing application connections when disabled.

## Non-Goals

- Vertical configuration, split seeds, multitenancy, `/api/cases`, CaseService, expert inbox, quotes, Ground Control, or Vehicle Health.
- Frontend, visual, model, or functional appointment changes.
- Docker profiles, CSRF protection, or workflow renaming.

## Files Expected To Change

```text
.env.example
.env.prod-example
.env (removed from Git tracking; preserved locally)
.gitignore
audit-log/AUDITORIA_TECNICA_EXHAUSTIVA.md
backend/.env (removed from Git tracking; preserved locally)
backend/.env.example
backend/config/appConfig.js
backend/config/db.js
backend/config/env.js
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
docs/CHECKLIST. PR-1 Manual QA.md
docs/NOTE. PR-1 Stable Core Execution Notes.md
```

## Environment Variables

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
```

Provider credentials remain empty placeholders in examples.

## Implementation Steps

1. Add the centralized environment module and derived CORS/cookie options.
2. Switch startup, database, JWT, auth, Temporal, and upload consumers to centralized configuration.
3. Add application-level feature guards before Temporal work and public-upload file processing.
4. Update Compose defaults without removing Temporal services or dependencies.
5. Sanitize examples, allow the backend example to be tracked, and remove the real backend environment file from Git tracking.
6. Run static, configuration, startup, route, CORS, and authentication checks where local dependencies permit.
7. Record exact results and deviations in the execution note.

## Risk Areas

- Production cross-site cookies require `SameSite=None` and `Secure`; CSRF protection is deferred.
- Incorrect CORS origins can block browser clients.
- Disabling seed can leave a database without login fixtures.
- Temporal containers may still start even when application-level Temporal is disabled.
- Credentials previously committed must be rotated externally; this PR does not rewrite Git history.

## Validation Plan

- Validate environment parsers/defaults and production JWT failure behavior.
- Validate CORS allow/reject behavior for one and multiple configured origins.
- Start with Temporal, seed, reminders, and public uploads disabled.
- Check `/health`, `/api/configuracion`, Temporal 503, and public-upload 403 behavior.
- Validate configured login cookie, `/api/auth/me`, logout clearing, and authenticated appointments when fixtures are available.
- Scan changed consumers for hardcoded secrets and direct reads of centralized variables.

## Rollback Notes

Revert PR-1, restore prior environment behavior if required, and keep the developer's local `backend/.env` present but ignored. Reverting code does not restore or rotate any externally invalidated credentials.
