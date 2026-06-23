# NOTE. PR-7 Case Operations UI v0

## What Was Implemented

Added a minimal admin dashboard Case Operations UI v0 for the backend Case flow.

The new tab lets an authenticated admin:

```text
List Cases.
Filter by status/search.
Select and inspect Case detail.
Create a Case.
Apply Expert Review.
Prepare quote-compatible price state.
Approve or reject customer decision.
See derived quote state or a "Sin cotizacion preparada" state.
```

The UI intentionally avoids wording that implies quote sending. It states that no PDF, WhatsApp, SMS or email is sent in this version.

## Files Changed

```text
frontend/app/admin/dashboard/page.js
frontend/lib/api.js
```

## Files Created

```text
frontend/components/dashboard/TabCaseOperations.js
docs/PLAN. PR-7 Case Operations UI v0.md
docs/NOTE. PR-7 Case Operations UI v0 Execution Notes.md
docs/CHECKLIST. PR-7 Manual QA.md
```

## UI Added

Added a new dashboard sidebar tab:

```text
Operaciones Case
```

The tab has:

```text
Top filter bar and create button.
Left Case list.
Right selected Case detail.
Create Case form.
Expert Review form.
Quote / Decision form and actions.
```

## API Client Helpers Added

Added to `frontend/lib/api.js`:

```text
obtenerCases(filters)
obtenerCasePorId(id)
crearCase(payload)
actualizarCaseStatus(id, status)
aplicarExpertReview(id, payload)
prepararCaseQuote(id, payload)
obtenerCaseQuote(id)
aprobarCase(id, payload)
rechazarCase(id, payload)
```

Existing request behavior and `credentials: include` were preserved.

## Case Operations Supported

```text
GET /api/cases
GET /api/cases/:id
POST /api/cases
PATCH /api/cases/:id/status helper only, not exposed as a primary UI action
POST /api/cases/:id/expert-review
POST /api/cases/:id/quote
GET /api/cases/:id/quote
POST /api/cases/:id/approve
POST /api/cases/:id/reject
```

## Known Limitations

```text
No Ground Control.
No advanced BandejaExperto UI.
No PDF.
No send quote.
No WhatsApp/email/SMS.
No Gemini integration.
No Temporal workflow.
No public approval link.
No quote model.
No timeline/audit UI.
No mobile-optimized UI beyond responsive grid basics.
ManagedEntity data uses a simple JSON textarea.
Approve/reject are intentionally strong actions and use basic window.confirm only.
Quote summary/terms/validUntil are shown as non-durable backend limitations.
```

## Commands Executed

```powershell
git status --short --branch
git log --oneline --decorate -5
git checkout -b feat/poc-stable-core-pr7-case-operations-ui
npm run lint --prefix frontend
.\node_modules\.bin\eslint.cmd components\dashboard\TabCaseOperations.js app\admin\dashboard\page.js lib\api.js
npm run build --prefix frontend
npm run dev:frontend
curl-equivalent GET http://localhost:3000/admin/dashboard
node backend\index.js with ENABLE_TEMPORAL=false ENABLE_AUTO_SEED=false ENABLE_RECORDATORIOS=false
curl-equivalent GET http://localhost:4000/health
curl-equivalent GET http://localhost:4000/api/vertical-config
curl-equivalent GET http://localhost:4000/api/cases unauthenticated
```

## Manual Validation

```text
[PASS] PR-7 branch created.
[PASS] New Case Operations tab registered in the existing dashboard.
[PASS] PR-7-target ESLint completed with 0 errors.
[PASS] npm run build --prefix frontend completed successfully.
[PASS] npm run dev:frontend served /admin/dashboard with HTTP 200.
[PASS] Backend health returned HTTP 200.
[PASS] Vertical config returned HTTP 200.
[PASS] Unauthenticated /api/cases returned HTTP 401 as expected.
[PASS] No backend model files changed by PR-7 work.
[PASS] No backend/routes/citas.js changes by PR-7 work.
[PASS] No backend/services/gemini.js changes by PR-7 work.
```

Global frontend lint was also run and failed because of pre-existing errors outside PR-7 scope, including older issues in landing/dashboard components and hooks. The PR-7 touched files were linted separately and passed with only one pre-existing dashboard warning about the `router` dependency.

```text
[NOT RUN] Authenticated browser click-through for creating Case, expert review, quote, approve and reject was not run in a browser session.
[NOT RUN] Existing dashboard tab visual click-through was not manually run in browser; build and dashboard route smoke passed.
```

## Deviations From Original Plan

```text
Baseline was not exactly 4442825e when PR-7 started. The working branch already included frontend commits bf23ee35 and 78260522 after PR-6. PR-7 was branched from the current clean HEAD to preserve the user's existing frontend work.
No backend changes were made for PR-7.
```

## Risks / Follow-Up Items

```text
Global frontend lint remains red due to pre-existing issues outside PR-7 scope.
The UI is functional but not a polished Ground Control experience.
Approve/reject actions should eventually get richer confirmation/audit.
ManagedEntity JSON textarea should eventually be replaced by vertical-specific forms.
Quote send/PDF/customer link remain deferred.
```

## Rollback Notes

```text
Revert this PR.
No backend schema or database rollback is required.
Existing legacy dashboard tabs remain independent of the Case Operations tab.
```
