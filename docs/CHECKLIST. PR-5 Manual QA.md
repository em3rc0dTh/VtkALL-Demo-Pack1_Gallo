# CHECKLIST. PR-5 Manual QA

## Static Checks

```text
[PASS] node --check backend\routes\cases.js
[PASS] node --check backend\services\expertReviewService.js
```

## Backend Smoke

```text
[PASS] npm run dev:backend starts the backend.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config returns ok:true.
```

## Authenticated Expert Review QA

```text
[PASS] POST /api/cases creates a temporary QA Case for validation.
[PASS] POST /api/cases/:id/expert-review accepts expertNotes.
[PASS] POST /api/cases/:id/expert-review accepts proposedPrice.
[PASS] POST /api/cases/:id/expert-review accepts finalPrice.
[PASS] POST /api/cases/:id/expert-review merges evidenceUrls.
[PASS] Duplicate evidence URL strings are deduplicated after trimming.
[PASS] Empty evidence URL strings are ignored.
[PASS] transitionTo=expert_review returns status expert_review.
[PASS] transitionTo=expert_review stores legacyStatus revision_maestro.
[PASS] Missing transition on a valid review defaults to waiting_customer.
[PASS] Default transition stores legacyStatus esperando_cliente.
[PASS] transitionTo=approved returns 400.
[PASS] Empty payload returns 400.
[PASS] GET /api/cases/:id returns the updated Case DTO.
[PASS] Active vehicle_service ignores estimatedDeliveryDate and preserves fecha_cita.
[PASS] GET /api/citas still returns 200.
```

## Scope Guard

```text
[PASS] No frontend files changed.
[PASS] No backend/models/* files changed.
[PASS] No backend/routes/citas.js changes.
[PASS] No backend/services/gemini.js changes.
[PASS] No WhatsApp side effects added.
[PASS] No Gemini side effects added.
[PASS] No Temporal side effects added.
[PASS] No quote flow added.
[PASS] No customer approval flow added.
```

## Not Run

```text
[NOT RUN] Cross-vertical runtime validation for supportsDeliveryDate=true was not run because the active local config is Turagua vehicle_service. The true branch is implemented behind verticalConfig.features.supportsDeliveryDate and should be tested when running custom_orders or technical_repair.
```
