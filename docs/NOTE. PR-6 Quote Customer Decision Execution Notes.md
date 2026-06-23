# NOTE. PR-6 Quote Customer Decision Over Case

## What Was Implemented

Implemented PR-6 as a backend-only Quote Price State + Customer Decision layer over legacy `Cita`.

This is intentionally not a full durable Quote system. The implementation persists only existing `Cita` fields and returns derived Quote DTOs from those durable fields.

## Files Changed

```text
backend/routes/cases.js
```

## Files Created

```text
backend/services/quoteService.js
docs/PLAN. PR-6 Quote Customer Decision Over Case.md
docs/NOTE. PR-6 Quote Customer Decision Execution Notes.md
docs/CHECKLIST. PR-6 Manual QA.md
```

## API Endpoints Added

```text
POST /api/cases/:id/quote
GET /api/cases/:id/quote
POST /api/cases/:id/approve
POST /api/cases/:id/reject
```

All endpoints are mounted under `backend/routes/cases.js` and protected with `protegerRuta`.

## Quote DTO Contract

Derived Quote DTO:

```js
{
  caseId,
  legacyType: "Cita",
  source: "legacy_cita",
  status: "prepared | approved | rejected",
  proposedPrice,
  finalPrice,
  approvedAmount,
  currency: "PEN",
  summary,
  terms,
  validUntil,
  estimatedDeliveryDate,
  limitations,
  createdAt,
  updatedAt
}
```

`GET /quote` returns only durable or derived values. It does not return `summary`, `terms` or `validUntil` from earlier `POST /quote` requests because those fields are not persisted yet.

## Storage Behavior

Persisted:

```text
Cita.precio_estimado
Cita.precio_final
Cita.estado
Cita.fecha_cita only if active vertical supportsDeliveryDate=true
```

Immediate response only, not durable:

```text
summary
terms
validUntil
currency when explicitly provided
```

Not persisted and deferred to future Quote or TimelineEvent work:

```text
decisionNotes
approvedBy
rejectedBy
reason
approvedAt
rejectedAt
quote version history
line items
customer-visible quote snapshot
```

## Status Transition Behavior

Status mappings use `statusService`:

```text
waiting_customer -> esperando_cliente
approved -> confirmada
cancelled -> cancelada
```

Public snake_case values are not stored in `Cita.estado`.

## Approval Behavior

`POST /api/cases/:id/approve`:

```text
Validates Case exists.
Requires at least one persisted price.
Prefers Cita.precio_final as approvedAmount.
Falls back to Cita.precio_estimado.
Sets Cita.estado to confirmada.
Returns updated Case DTO and derived Quote DTO.
```

Approval metadata is validated for shape but not persisted.

## Rejection Behavior

`POST /api/cases/:id/reject`:

```text
Validates Case exists.
Sets Cita.estado to cancelada.
Returns updated Case DTO.
Returns derived Quote DTO when price data exists.
```

Rejecting quote maps to case cancellation only as a temporary legacy compromise. Future Quote/Timeline work should separate quote rejection from case cancellation.

Rejection metadata is validated for shape but not persisted.

## Side Effects Policy

Allowed side effects implemented:

```text
Update Cita.precio_estimado.
Update Cita.precio_final.
Update Cita.estado.
Update Cita.fecha_cita only if vertical supportsDeliveryDate=true.
Return Case DTO and derived Quote DTO.
```

Forbidden side effects not implemented:

```text
WhatsApp
SMS
Email
Gemini
Temporal
PDF
invoice
debt accounting
payment
repair history
agenda recalculation
frontend changes
PUT /api/citas/:id
/api/citas/:id/feedback-maestro
```

## Commands Executed

```powershell
git status --short --branch
git log --oneline --decorate -5
git checkout feat/poc-stable-core-pr5-expert-review
git pull
git checkout -b feat/poc-stable-core-pr6-quote-decision
node --check backend\routes\cases.js
node --check backend\services\quoteService.js
npm run dev:backend
curl-equivalent GET http://localhost:4000/health
curl-equivalent GET http://localhost:4000/api/vertical-config
authenticated POST http://localhost:4000/api/auth/login with temporary local QA user
authenticated POST http://localhost:4000/api/cases
authenticated GET http://localhost:4000/api/cases/:id/quote
authenticated POST http://localhost:4000/api/cases/:id/quote
authenticated POST http://localhost:4000/api/cases/:id/approve
authenticated POST http://localhost:4000/api/cases/:id/reject
authenticated GET http://localhost:4000/api/cases/:id
authenticated GET http://localhost:4000/api/citas
node --input-type=module service-level derived Quote DTO check
```

`git pull` on `feat/poc-stable-core-pr5-expert-review` returned no upstream tracking information. Implementation proceeded from the clean local baseline at `702aa074`, which matched the authorized baseline and had `origin/feat/poc-stable-core-pr5-expert-review` pointing to the same commit.

## Manual Validation

```text
[PASS] node --check backend\routes\cases.js.
[PASS] node --check backend\services\quoteService.js.
[PASS] Backend starts with ENABLE_TEMPORAL=false, ENABLE_AUTO_SEED=false and ENABLE_RECORDATORIOS=false.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config returns ok:true.
[PASS] GET /api/cases/:id/quote returns 404 when no price exists.
[PASS] POST /api/cases/:id/approve returns 404 when no persisted price exists.
[PASS] POST /api/cases/:id/quote with invalid price returns 400.
[PASS] POST /api/cases/:id/quote with invalid date returns 400.
[PASS] POST /api/cases/:id/quote with finalPrice updates precio_final.
[PASS] POST /api/cases/:id/quote transitions to waiting_customer / esperando_cliente when transitionTo is provided.
[PASS] POST /api/cases/:id/quote does not persist estimatedDeliveryDate for active vehicle_service.
[PASS] GET /api/cases/:id/quote returns derived Quote DTO.
[PASS] GET /api/cases/:id/quote returns derived summary and null terms/validUntil.
[PASS] POST /api/cases/:id/approve maps approved -> confirmada.
[PASS] Approve returns approvedAmount from finalPrice.
[PASS] POST /api/cases/:id/reject maps cancelled -> cancelada.
[PASS] Reject returns derived Quote DTO when price data exists.
[PASS] GET /api/cases/:id returns updated status and price data.
[PASS] GET /api/citas still returns 200.
[PASS] No frontend UI changes.
[PASS] No Gemini changes.
[PASS] No Temporal changes.
[PASS] No model changes.
[PASS] No /api/citas changes.
```

## Known Limitations

```text
No first-class Quote model.
No quote versioning.
No durable quote text/terms/validUntil.
No durable decision notes/reason/actor timestamps.
No PDF.
No send quote.
No public approval link.
No WhatsApp/email/SMS.
No payment/debt accounting.
No frontend UI.
No TimelineEvent/audit.
Reject maps to case cancellation only as a temporary legacy compromise.
```

## Risks / Follow-Up Items

```text
Future PR should introduce a first-class Quote model or quoteSnapshot before exposing durable quote text, terms, validUntil or line items.
Future PR should introduce TimelineEvent/audit before claiming durable customer decision metadata.
Future PR should separate quote rejection from case cancellation.
Future communication PR must add an explicit send-quote flow instead of overloading this PR-6 layer.
```

## Deviations From Original Plan

```text
git pull could not run because feat/poc-stable-core-pr5-expert-review had no upstream tracking configuration. The branch was otherwise clean at the authorized commit, so implementation proceeded from local 702aa074.
```

## Rollback Notes

```text
Revert this PR.
No schema rollback is required.
Any QA Cita/Cliente/Usuario records created in local Mongo can be removed manually if desired.
```
