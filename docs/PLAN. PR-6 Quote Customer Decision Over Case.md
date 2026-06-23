# PLAN. PR-6 Quote Customer Decision Over Case

## Goal

Implement a backend-only Quote Price State + Customer Decision layer over legacy `Cita`, exposing quote-compatible price preparation and customer approve/reject actions through Case endpoints.

This is not a full durable Quote system.

## Scope

```text
POST /api/cases/:id/quote
GET /api/cases/:id/quote
POST /api/cases/:id/approve
POST /api/cases/:id/reject
backend/services/quoteService.js
docs and manual QA
```

## Non-Goals

```text
No Quote model.
No quoteSnapshot field on Cita.
No TimelineEvent.
No quote versioning.
No line items.
No PDF.
No send quote.
No WhatsApp.
No SMS.
No email.
No public approval link.
No payment.
No invoice.
No debt accounting.
No frontend UI.
No Gemini integration.
No Temporal workflow.
No model/schema changes.
No /api/citas changes.
```

## Baseline Assumptions

```text
Branch starts from feat/poc-stable-core-pr5-expert-review.
Accepted baseline commit is 702aa074.
PR-5 already provides expert review fields over Cita.
Current implementation branch is feat/poc-stable-core-pr6-quote-decision.
git pull on the PR-5 branch may fail when no upstream is configured; implementation proceeds only if local baseline is clean at 702aa074.
```

## Files Expected To Change

```text
backend/routes/cases.js
```

## Files Expected To Be Created

```text
backend/services/quoteService.js
docs/PLAN. PR-6 Quote Customer Decision Over Case.md
docs/NOTE. PR-6 Quote Customer Decision Execution Notes.md
docs/CHECKLIST. PR-6 Manual QA.md
```

## Endpoint Contracts

All endpoints are authenticated with `protegerRuta`.

### POST /api/cases/:id/quote

Prepare or update quote-compatible price state for a Case.

Durable updates:

```text
proposedPrice -> Cita.precio_estimado
finalPrice -> Cita.precio_final
transitionTo=waiting_customer -> Cita.estado=esperando_cliente
estimatedDeliveryDate -> Cita.fecha_cita only if active vertical supportsDeliveryDate=true
```

Response:

```json
{
  "ok": true,
  "data": {
    "case": {},
    "quote": {}
  }
}
```

### GET /api/cases/:id/quote

Return a derived Quote DTO from durable `Cita` fields.

If neither `precio_estimado` nor `precio_final` exists, return:

```text
404 Quote not found
```

### POST /api/cases/:id/approve

Approve current quote-compatible price state.

Policy:

```text
Case must exist.
At least one persisted price must exist.
Prefer precio_final as approved amount.
Fallback to precio_estimado.
Set status approved -> Cita.estado=confirmada.
Return updated Case DTO and derived Quote DTO.
```

### POST /api/cases/:id/reject

Reject current quote-compatible price state.

Policy:

```text
Case must exist.
Set status cancelled -> Cita.estado=cancelada.
Return updated Case DTO and derived Quote DTO if price exists.
```

Rejecting quote maps to case cancellation only as a temporary legacy compromise.

## Quote DTO Contract

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

`GET /quote` must only return durable or derived values. Request-only fields such as `summary`, `terms` and `validUntil` may appear in the immediate `POST /quote` response but must not be returned later as if persisted.

## Storage Policy

Persist safely today:

```text
Cita.precio_estimado
Cita.precio_final
Cita.estado
Cita.fecha_cita only if active vertical supportsDeliveryDate=true
```

Request-only / immediate-response-only:

```text
summary
terms
validUntil
currency when explicitly provided
```

Must wait for Quote model or TimelineEvent:

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

Do not fake persistence.

## Status Transition Policy

Use `statusService` for mappings.

```text
waiting_customer -> esperando_cliente
approved -> confirmada
cancelled -> cancelada
```

Never store public snake_case values in `Cita.estado`.

## Approval Policy

Approval requires an existing persisted price:

```text
precio_final preferred.
precio_estimado fallback.
```

Approval metadata is accepted only for shape validation and immediate context. It is not persisted.

## Rejection Policy

Rejection sets:

```text
cancelled -> cancelada
```

This is a legacy compromise because quote rejection and case cancellation are not yet separate durable concepts.

Rejection metadata is accepted only for shape validation and immediate context. It is not persisted.

## Side Effects Policy

Allowed:

```text
Update Cita.precio_estimado.
Update Cita.precio_final.
Update Cita.estado.
Update Cita.fecha_cita only if vertical supportsDeliveryDate=true.
Return Case DTO and derived Quote DTO.
```

Forbidden:

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

## Implementation Steps

1. Create `quoteService.js` with `prepareCaseQuote`, `getCaseQuote`, `approveCaseQuote` and `rejectCaseQuote`.
2. Validate ObjectId, payload shape, prices, dates, strings and allowed transitions.
3. Build derived Quote DTOs from `Cita` without inventing persisted quote text.
4. Update only authorized `Cita` fields.
5. Mount endpoints under `backend/routes/cases.js`.
6. Run static, smoke and authenticated checks.
7. Create NOTE and CHECKLIST docs, then commit.

## Risk Areas

```text
Quote DTO may be mistaken for a durable Quote model.
Rejecting quote as cancelada over-cancels the Case in legacy storage.
Decision metadata cannot be stored honestly yet.
estimatedDeliveryDate has appointment/date semantics in legacy Cita.
```

## Validation Plan

```text
[ ] node --check backend/routes/cases.js
[ ] node --check backend/services/quoteService.js
[ ] npm run dev:backend
[ ] GET /health
[ ] GET /api/vertical-config
[ ] POST /api/cases/:id/quote with finalPrice updates precio_final
[ ] POST /api/cases/:id/quote transitions to waiting_customer / esperando_cliente
[ ] GET /api/cases/:id/quote returns derived quote DTO
[ ] GET /api/cases/:id/quote returns 404 when no price exists
[ ] POST /api/cases/:id/approve requires existing persisted price
[ ] POST /api/cases/:id/approve maps approved -> confirmada
[ ] POST /api/cases/:id/reject maps cancelled -> cancelada
[ ] Invalid quote price returns 400
[ ] Invalid date returns 400
[ ] GET /api/cases/:id returns updated status and prices
[ ] GET /api/citas still works
[ ] no frontend, Gemini, Temporal, model or /api/citas changes
```

## Rollback Notes

Revert this PR. No schema rollback is required. QA updates to local `Cita` records can be manually deleted or corrected if desired.
