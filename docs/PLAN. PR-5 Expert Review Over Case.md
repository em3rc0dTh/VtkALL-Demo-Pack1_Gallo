# PLAN. PR-5 Expert Review Over Case

## Goal

Add a backend-only expert review action for existing Cases by safely updating the underlying legacy `Cita` and returning the updated Case DTO.

## Scope

```text
POST /api/cases/:id/expert-review
backend/services/expertReviewService.js
minimal payload validation
safe Cita update
evidence URL merge
limited status transition
docs and manual QA
```

## Non-Goals

```text
No quote entity/service.
No PDF.
No send quote.
No approve/reject flow.
No client approval.
No WhatsApp sending.
No Gemini integration.
No Temporal workflow.
No frontend UI.
No BandejaExperto UI.
No new Case model.
No ExpertReview model.
No ManagedEntity model.
No TimelineEvent model.
No Mongo migration.
No backend/routes/citas.js changes.
No backend/models/* changes.
No backend/services/gemini.js changes.
```

## Baseline Assumptions

```text
Branch starts from feat/poc-stable-core-pr4-case-intake.
Accepted baseline commit is 88676270.
PR-4 already provides POST /api/cases and Case DTO readback.
Cita remains the persistence model.
```

## Files Expected To Change

```text
backend/routes/cases.js
```

## Files Expected To Be Created

```text
backend/services/expertReviewService.js
docs/PLAN. PR-5 Expert Review Over Case.md
docs/NOTE. PR-5 Expert Review Execution Notes.md
docs/CHECKLIST. PR-5 Manual QA.md
```

## POST /api/cases/:id/expert-review Contract

Authenticated with `protegerRuta`.

Payload:

```json
{
  "expertNotes": "Diagnóstico del experto",
  "proposedPrice": 120,
  "finalPrice": 150,
  "estimatedDeliveryDate": "2026-06-28T18:00:00.000Z",
  "evidenceUrls": ["https://example.com/image.jpg"],
  "transitionTo": "waiting_customer",
  "sendToCustomer": false
}
```

Success:

```json
{
  "ok": true,
  "data": {}
}
```

## Input Validation

```text
Case id must be valid.
At least one review field must be present.
expertNotes optional string.
proposedPrice optional non-negative number.
finalPrice optional non-negative number.
estimatedDeliveryDate optional valid date.
evidenceUrls optional array of non-empty strings after trimming.
transitionTo optional valid public snake_case status.
sendToCustomer optional boolean.
```

Allowed transitions:

```text
expert_review
waiting_customer
```

Default transition:

```text
waiting_customer
```

## Expert Review To Cita Mapping

```text
expertNotes -> notas_mecanico
proposedPrice -> precio_estimado
finalPrice -> precio_final
evidenceUrls -> merge into imagenes
transitionTo -> estado legacy via statusService
```

Status mapping:

```text
expert_review -> revision_maestro
waiting_customer -> esperando_cliente
```

## Estimated Delivery Date Policy

`Cita` has no first-class estimated delivery field.

```text
supportsDeliveryDate=true -> persist estimatedDeliveryDate into fecha_cita.
supportsDeliveryDate=false -> ignore estimatedDeliveryDate and document it.
```

This avoids silently overwriting vehicle-service appointment dates.

## Evidence Merge Policy

```text
Cita.imagenes remains an array of strings.
Keep existing images.
Trim incoming URLs.
Ignore empty strings.
Deduplicate exact URLs.
Do not introduce object-shaped evidence.
Do not remove existing images.
```

## Status Transition Policy

Only `expert_review` and `waiting_customer` are valid PR-5 transitions. This endpoint must reject `intake`, `approved`, `in_progress`, `completed`, and `cancelled`.

## sendToCustomer Policy

`sendToCustomer` is accepted for forward compatibility but does not send WhatsApp, SMS, email, Gemini, Temporal, or quote messages.

If `sendToCustomer=true` and no transition is provided, the transition remains the default `waiting_customer`.

## Side Effects Policy

Allowed:

```text
Update Cita.notas_mecanico.
Update Cita.precio_estimado.
Update Cita.precio_final.
Merge Cita.imagenes.
Optionally update Cita.fecha_cita according to delivery-date policy.
Update Cita.estado only to revision_maestro or esperando_cliente.
Return updated Case DTO.
```

Forbidden:

```text
WhatsApp
Gemini
Temporal
quote creation
PDF generation
client approval
debt accounting
repair history creation
agenda recalculation
frontend changes
```

## Implementation Steps

1. Create `expertReviewService.js` with controlled error class and `applyExpertReview`.
2. Validate input, status transitions, evidence URLs, prices, dates and boolean shape.
3. Find Cita by id, apply safe field updates, merge evidence, map status via `statusService`.
4. Apply estimated delivery date only when active vertical supports delivery dates.
5. Return updated Case DTO via existing case service readback.
6. Add `POST /api/cases/:id/expert-review` to `routes/cases.js`.
7. Run syntax, backend smoke, authenticated API checks and scope guard.
8. Create NOTE and CHECKLIST, then commit.

## Risk Areas

```text
Endpoint can be confused with quote flow even though no quote entity exists.
estimatedDeliveryDate has no first-class field.
Cita.imagenes must remain string-array compatible.
sendToCustomer must not send communication.
Status must stay legacy in Cita.estado and public snake_case in DTO.
```

## Validation Plan

```text
[ ] node --check backend/routes/cases.js
[ ] node --check backend/services/expertReviewService.js
[ ] npm run dev:backend
[ ] GET /health
[ ] GET /api/vertical-config
[ ] POST /api/cases/:id/expert-review with expertNotes only
[ ] POST /api/cases/:id/expert-review with proposedPrice/finalPrice
[ ] POST /api/cases/:id/expert-review merges evidenceUrls
[ ] transitionTo waiting_customer stores esperando_cliente
[ ] transitionTo expert_review stores revision_maestro
[ ] invalid transitionTo returns 400
[ ] empty payload returns 400
[ ] GET /api/cases/:id returns updated DTO
[ ] GET /api/citas still works
[ ] no frontend UI changes
[ ] no Gemini changes
[ ] no model changes
[ ] no /api/citas changes
```

## Rollback Notes

Revert this PR. No schema rollback is required. QA changes to local `Cita` records can be manually reverted or deleted if desired.
