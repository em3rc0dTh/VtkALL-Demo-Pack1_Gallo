# NOTE. PR-3A Case Read Status Wrapper Over Cita

## What Was Implemented

Implemented a backend-only semantic Case wrapper over legacy `Cita` records. PR-3A adds authenticated read/list/status endpoints under `/api/cases`, maps legacy Cita statuses to public snake_case Case statuses, and returns stable Case DTOs without migrating MongoDB or changing legacy `/api/citas` behavior.

## Files Changed

```text
backend/index.js
backend/services/statusService.js
```

## Files Created

```text
backend/mappers/caseMapper.js
backend/services/caseService.js
backend/routes/cases.js
docs/PLAN. PR-3A Case Read Status Wrapper Over Cita.md
docs/NOTE. PR-3A Case Read Status Wrapper Execution Notes.md
docs/CHECKLIST. PR-3A Manual QA.md
```

## API Endpoints Added

```text
GET /api/cases
GET /api/cases/:id
PATCH /api/cases/:id/status
```

No `POST /api/cases` endpoint was added.

## Case DTO Contract

Case DTOs expose stable public fields and do not return raw `Cita` documents:

```text
id
legacyId
legacyType
businessSlug
vertical
status
legacyStatus
customer
managedEntity
service
product
description
scheduledDate
expert
expertNotes
estimatedPrice
finalPrice
evidence
team
workStatus
source
createdAt
updatedAt
```

Unavailable values are returned safely as `null`, `{}` or `[]` depending on field type.

## Status Mapping

Public Case statuses use snake_case:

```text
intake -> pendiente
expert_review -> revision_maestro
waiting_customer -> esperando_cliente
approved -> confirmada
in_progress -> evaluacion_en_curso
completed -> completada
cancelled -> cancelada
```

Reverse mapping:

```text
pendiente -> intake
revision_maestro -> expert_review
esperando_cliente -> waiting_customer
validada -> approved
pendiente_confirmacion -> waiting_customer
confirmada -> approved
evaluacion_en_curso -> in_progress
completada -> completed
cancelada -> cancelled
```

Added public helpers in `statusService.js`:

```text
toLegacyCitaStatusValue(publicStatus)
fromLegacyCitaStatusValue(legacyStatus)
isValidPublicCaseStatus(status)
getPublicCaseStatuses()
```

Existing PR-2 helpers were preserved.

## Backend Behavior

```text
Cita to Case: caseMapper maps Mongoose docs or plain objects into Case DTOs.
Case to Cita payload: not implemented in PR-3A because POST/general update are deferred.
Legacy status to canonical status: statusService returns public snake_case values.
Canonical status to legacy status: statusService maps public snake_case values to Cita.estado.
Managed entity labels: derived from active vertical config.
Vertical config: active business/vertical comes from verticalConfigService.
```

## Side Effects Policy

`PATCH /api/cases/:id/status` updates only:

```text
Cita.estado
```

It does not reuse `PUT /api/citas/:id` and does not trigger:

```text
WhatsApp messages
debt accounting
repair history creation
agenda recalculation
Temporal workflows
quote flow
customer approval flow
```

## Commands Executed

```powershell
git status --short --branch
git log --oneline --decorate -5
git branch --show-current
git checkout -b feat/poc-stable-core-pr3a
node --check backend\services\statusService.js
node --check backend\mappers\caseMapper.js
node --check backend\services\caseService.js
node --check backend\routes\cases.js
node --check backend\index.js
node --input-type=module -e "<statusService public helper validation>"
node --input-type=module -e "<caseMapper DTO validation>"
npm run dev:backend
git diff --name-status
git diff --check HEAD
```

## Manual Validation

```text
[PASS] Backend starts with PR-3A route mounted.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config works.
[PASS] Authenticated GET /api/cases returns Case DTO list.
[PASS] Authenticated GET /api/cases/:id returns one Case DTO.
[PASS] GET /api/cases?status=approved maps status to legacy confirmada.
[PASS] GET /api/cases?status=expertReview rejects camelCase public status with 400.
[PASS] PATCH /api/cases/:id/status accepts expert_review.
[PASS] PATCH /api/cases/:id/status updates Cita.estado to revision_maestro.
[PASS] PATCH /api/cases/:id/status rejects unknown/camelCase status with 400.
[PASS] /api/citas still works unchanged.
[PASS] No model migration.
[PASS] No frontend visual changes.
[PASS] No backend/routes/citas.js changes.
[PASS] No Gemini changes.
```

Authentication was tested using the existing local admin credentials in the development database.

## Known Limitations

```text
No Mongo migration.
No Case model yet.
No ManagedEntity model yet.
No TimelineEvent model yet.
No frontend integration.
No quote flow.
No expert-review flow.
No Gemini/AI verticalization.
No WhatsApp side effects from /api/cases.
Legacy /api/citas remains source of old operational side effects.
No POST /api/cases.
No general PATCH /api/cases/:id.
Search is intentionally simple and does not perform deep arbitrary Mixed-field inspection.
```

## Risks / Follow-Up Items

```text
PR-3B/PR-4 should decide whether and how to implement POST /api/cases without duplicating legacy Cliente creation logic.
Future UI work should consume Case DTOs only after this API contract is accepted.
If operational side effects are desired for cases later, they should be modeled explicitly rather than calling /api/citas update logic.
Managed entity mapping remains derived from legacy fields until a real ManagedEntity model exists.
```

## Deviations From Original Plan

```text
None.
```

## Rollback Notes

```text
Revert this PR.
No database rollback is required.
If a local QA PATCH changed a Cita status, restore that individual test record manually if needed.
```
