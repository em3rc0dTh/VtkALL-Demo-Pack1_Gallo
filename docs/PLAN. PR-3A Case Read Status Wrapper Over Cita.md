# PLAN. PR-3A Case Read Status Wrapper Over Cita

## Goal

Create the first backend-only semantic Case API over the legacy `Cita` model without migrating MongoDB, changing legacy routes, or triggering existing operational side effects.

## Scope

Implement:

```text
GET /api/cases
GET /api/cases/:id
PATCH /api/cases/:id/status
```

Create a mapper/service/route layer:

```text
Cita -> statusService -> caseMapper -> caseService -> /api/cases
```

## Non-Goals

```text
No POST /api/cases.
No general PATCH /api/cases/:id.
No frontend integration.
No frontend UI changes.
No Gemini changes.
No WhatsApp changes.
No quote flow.
No expert review flow.
No Temporal workflow changes.
No Mongo migration.
No new Case model.
No new ManagedEntity model.
No model changes.
No backend/routes/citas.js changes.
```

## Baseline Assumptions

```text
Branch starts from feat/poc-stable-core-pr2.
Accepted baseline commit is 0b53ca1a.
PR-1 and PR-2 docs/config are already committed.
Existing Cita remains the persistence source.
Existing /api/citas remains the legacy operational API.
```

## Files Expected To Change

```text
backend/services/statusService.js
backend/index.js
```

## Files Expected To Be Created

```text
backend/mappers/caseMapper.js
backend/services/caseService.js
backend/routes/cases.js
docs/PLAN. PR-3A Case Read Status Wrapper Over Cita.md
docs/NOTE. PR-3A Case Read Status Wrapper Execution Notes.md
docs/CHECKLIST. PR-3A Manual QA.md
```

## Case DTO Contract

Case DTOs will expose stable semantic fields instead of raw `Cita` documents:

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

All nullable or unavailable fields must return safe values such as `null`, `{}` or `[]`.

## Status Convention

Public Case DTOs expose canonical statuses in snake_case:

```text
intake
expert_review
waiting_customer
approved
in_progress
completed
cancelled
```

Mappings:

```text
intake -> pendiente
expert_review -> revision_maestro
waiting_customer -> esperando_cliente
approved -> confirmada
in_progress -> evaluacion_en_curso
completed -> completada
cancelled -> cancelada
```

Reverse mappings:

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

`statusService` owns this mapping. `caseMapper` consumes `statusService` and does not duplicate status map logic.

## Endpoint Contract

```text
GET /api/cases
GET /api/cases/:id
PATCH /api/cases/:id/status
```

All endpoints use `protegerRuta`.

Responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{ "ok": false, "error": "Clear message" }
```

## Side Effects Policy

`PATCH /api/cases/:id/status` updates only `Cita.estado`.

It must not trigger:

```text
WhatsApp messages
debt accounting
repair history creation
agenda recalculation
Temporal workflows
quote flow
customer approval flow
```

## Implementation Steps

1. Add public snake_case helpers to `statusService` while preserving existing helpers.
2. Create `caseMapper` for Cita-to-Case DTO conversion and managed entity derivation.
3. Create `caseService` for list/get/status update.
4. Create authenticated `cases` route.
5. Mount `/api/cases` in `backend/index.js`.
6. Validate syntax and backend startup.
7. Run authenticated API checks where local data/auth allows.
8. Document execution notes and manual QA results.
9. Commit PR-3A.

## Risk Areas

```text
Do not accidentally return raw Cita documents.
Do not expose camelCase public statuses.
Do not reuse /api/citas update logic.
Do not touch forbidden files.
Search over Mixed fields should stay simple and safe.
PATCH status changes intentionally bypass legacy operational side effects.
```

## Validation Plan

```text
[ ] node --check backend/services/statusService.js
[ ] node --check backend/mappers/caseMapper.js
[ ] node --check backend/services/caseService.js
[ ] node --check backend/routes/cases.js
[ ] node --check backend/index.js
[ ] Backend starts.
[ ] GET /health works.
[ ] GET /api/vertical-config works.
[ ] Authenticated GET /api/cases returns Case DTO list.
[ ] Authenticated GET /api/cases/:id returns one Case DTO.
[ ] GET /api/cases?status=approved maps to legacy confirmada.
[ ] PATCH /api/cases/:id/status accepts expert_review and stores revision_maestro.
[ ] PATCH /api/cases/:id/status rejects unknown status.
[ ] /api/citas still works unchanged.
```

## Rollback Notes

Revert this PR to remove PR-3A. No database rollback is required because no schema migration is performed and the only write path updates the existing `Cita.estado` field.
