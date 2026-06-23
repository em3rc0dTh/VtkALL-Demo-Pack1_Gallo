# NOTE. PR-5 Expert Review Over Case

## What Was Implemented

Implemented a backend-only authenticated expert review action over the existing Case facade. The new endpoint updates the underlying legacy `Cita` with expert notes, prices, evidence URLs and a limited review status transition, then returns the existing public Case DTO.

No quote flow, customer approval flow, frontend UI, Gemini, Temporal, WhatsApp or model changes were added.

## Files Changed

```text
backend/routes/cases.js
```

## Files Created

```text
backend/services/expertReviewService.js
docs/PLAN. PR-5 Expert Review Over Case.md
docs/NOTE. PR-5 Expert Review Execution Notes.md
docs/CHECKLIST. PR-5 Manual QA.md
```

## API Endpoints Added

```text
POST /api/cases/:id/expert-review
```

The route is protected with `protegerRuta`.

## POST /api/cases/:id/expert-review Contract

Accepted payload:

```json
{
  "expertNotes": "Expert notes",
  "proposedPrice": 120,
  "finalPrice": 150,
  "estimatedDeliveryDate": "2026-06-28T18:00:00.000Z",
  "evidenceUrls": ["https://example.test/image.jpg"],
  "transitionTo": "waiting_customer",
  "sendToCustomer": false
}
```

Success:

```json
{
  "ok": true,
  "data": {
    "id": "...",
    "legacyType": "Cita",
    "status": "waiting_customer",
    "legacyStatus": "esperando_cliente"
  }
}
```

## Input Validation

```text
case id must be a valid ObjectId.
payload must be an object.
at least one expert review field or sendToCustomer=true must be present.
expertNotes must be a string when provided.
proposedPrice must be a non-negative number when provided.
finalPrice must be a non-negative number when provided.
estimatedDeliveryDate must be a valid date when provided.
evidenceUrls must be an array of strings when provided.
transitionTo must be a valid and allowed public snake_case status when provided.
sendToCustomer must be a boolean when provided.
```

Allowed transitions:

```text
expert_review
waiting_customer
```

Rejected transitions:

```text
intake
approved
in_progress
completed
cancelled
unknown values
```

If `transitionTo` is omitted for a valid expert review payload, the endpoint defaults to:

```text
waiting_customer
```

## Expert Review To Cita Mapping

```text
expertNotes -> Cita.notas_mecanico
proposedPrice -> Cita.precio_estimado
finalPrice -> Cita.precio_final
evidenceUrls -> merged into Cita.imagenes
transitionTo -> Cita.estado through statusService
```

## Estimated Delivery Date Behavior

`Cita` does not have a first-class estimated delivery date field.

Implemented behavior:

```text
supportsDeliveryDate=true -> persist estimatedDeliveryDate into Cita.fecha_cita.
supportsDeliveryDate=false -> ignore estimatedDeliveryDate.
```

The active Turagua `vehicle_service` config has `supportsDeliveryDate=false`, so validation confirmed the endpoint does not overwrite `fecha_cita` for that vertical.

## Evidence Merge Behavior

Implemented evidence merge policy:

```text
Keep existing Cita.imagenes entries.
Trim incoming URL strings.
Ignore empty incoming strings.
Deduplicate exact URL strings after trimming.
Keep Cita.imagenes as an array of strings.
Do not create object-shaped evidence records.
```

## Status Mapping

Public Case statuses remain canonical snake_case values. Legacy storage remains `Cita.estado`.

```text
expert_review -> revision_maestro
waiting_customer -> esperando_cliente
```

The implementation uses `statusService` for conversion and does not store public snake_case values in `Cita.estado`.

## sendToCustomer Behavior

`sendToCustomer` is accepted for forward compatibility only.

```text
sendToCustomer=true does not send WhatsApp, SMS, email, Gemini, Temporal or quote messages.
sendToCustomer=true with no explicit transition keeps the default local transition to waiting_customer.
```

## Side Effects Policy

Allowed side effects implemented:

```text
Update Cita.notas_mecanico.
Update Cita.precio_estimado.
Update Cita.precio_final.
Merge Cita.imagenes.
Conditionally update Cita.fecha_cita only when the active vertical supports delivery dates.
Update Cita.estado only to revision_maestro or esperando_cliente.
Return updated Case DTO.
```

Forbidden side effects not implemented:

```text
WhatsApp
SMS
email
Gemini
Temporal
quote creation
PDF generation
customer approval flow
debt accounting
repair history creation
agenda recalculation
frontend UI changes
```

## Commands Executed

```powershell
git status --short --branch
git log --oneline --decorate -5
node --check backend\routes\cases.js
node --check backend\services\expertReviewService.js
npm run dev:backend
curl-equivalent GET http://localhost:4000/health
curl-equivalent GET http://localhost:4000/api/vertical-config
authenticated POST http://localhost:4000/api/auth/login with temporary local QA user
authenticated POST http://localhost:4000/api/cases
authenticated POST http://localhost:4000/api/cases/:id/expert-review
authenticated GET http://localhost:4000/api/cases/:id
authenticated GET http://localhost:4000/api/citas
node --input-type=module service-level estimatedDeliveryDate policy check
```

One service-level check was first attempted from the repository root and failed because backend dependencies resolve from `backend/node_modules`; it was rerun successfully from `backend`.

## Manual Validation

```text
[PASS] node --check backend\routes\cases.js.
[PASS] node --check backend\services\expertReviewService.js.
[PASS] Backend starts with ENABLE_TEMPORAL=false, ENABLE_AUTO_SEED=false and ENABLE_RECORDATORIOS=false.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config returns ok:true.
[PASS] Authenticated POST /api/cases created a QA Case.
[PASS] Authenticated POST /api/cases/:id/expert-review with notes/prices/evidence/transition returns ok:true.
[PASS] transitionTo=expert_review returns public status expert_review and legacyStatus revision_maestro.
[PASS] Missing transition on a valid review defaults to waiting_customer.
[PASS] Default transition stores/returns legacyStatus esperando_cliente.
[PASS] evidenceUrls trims, ignores empty strings and deduplicates exact URLs.
[PASS] transitionTo=approved returns 400.
[PASS] Empty payload returns 400.
[PASS] GET /api/cases/:id returns updated Case DTO.
[PASS] Active vehicle_service ignores estimatedDeliveryDate and preserves Cita.fecha_cita.
[PASS] GET /api/citas still returns 200.
[PASS] No frontend UI changes.
[PASS] No Gemini changes.
[PASS] No model changes.
[PASS] No backend/routes/citas.js changes.
```

## Known Limitations

```text
No quote entity or quote service.
No PDF generation.
No send quote action.
No approve/reject customer flow.
No WhatsApp/SMS/email sending.
No Gemini integration.
No Temporal workflow.
No frontend UI.
No BandejaExperto UI.
No new Case model.
No ExpertReview model.
No ManagedEntity model.
No TimelineEvent model.
No Mongo migration.
estimatedDeliveryDate uses Cita.fecha_cita only for verticals that explicitly support delivery dates.
sendToCustomer is stored only as request intent and does not persist a communication event.
```

## Risks / Follow-Up Items

```text
PR-6 or later should introduce a real quote/customer approval model before sending anything to customers.
A future TimelineEvent or audit log should capture expert-review actions.
A future ManagedEntity model should remove the legacy overloading of Cita fields.
A future delivery-date field should avoid using Cita.fecha_cita for non-appointment delivery semantics.
sendToCustomer should remain disabled until a safe communication/approval workflow exists.
```

## Deviations From Original Plan

```text
sendToCustomer=true is treated as a valid action intent even without another review field, but it only performs the local default transition to waiting_customer and sends nothing externally.
```

## Rollback Notes

```text
Revert this PR.
No schema rollback is required.
Any QA Cita/Cliente/Usuario records created in local Mongo can be removed manually if desired.
```
