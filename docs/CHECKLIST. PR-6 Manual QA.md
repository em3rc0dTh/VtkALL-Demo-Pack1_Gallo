# CHECKLIST. PR-6 Manual QA

## Static Checks

```text
[PASS] node --check backend\routes\cases.js
[PASS] node --check backend\services\quoteService.js
```

## Backend Smoke

```text
[PASS] npm run dev:backend starts the backend.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config returns ok:true.
```

## Quote Price State QA

```text
[PASS] GET /api/cases/:id/quote returns 404 when no price exists.
[PASS] POST /api/cases/:id/quote with invalid price returns 400.
[PASS] POST /api/cases/:id/quote with invalid date returns 400.
[PASS] POST /api/cases/:id/quote with finalPrice updates precio_final.
[PASS] POST /api/cases/:id/quote with transitionTo=waiting_customer stores esperando_cliente.
[PASS] POST /api/cases/:id/quote returns immediate request-only summary/terms/validUntil with limitations.
[PASS] GET /api/cases/:id/quote returns a derived Quote DTO.
[PASS] GET /api/cases/:id/quote does not return prior request-only terms or validUntil as persisted data.
[PASS] Active vehicle_service ignores estimatedDeliveryDate and preserves fecha_cita.
```

## Customer Decision QA

```text
[PASS] POST /api/cases/:id/approve returns 404 when no persisted price exists.
[PASS] POST /api/cases/:id/approve maps approved -> confirmada.
[PASS] POST /api/cases/:id/approve returns approvedAmount from precio_final when present.
[PASS] POST /api/cases/:id/reject maps cancelled -> cancelada.
[PASS] POST /api/cases/:id/reject returns derived Quote DTO when price data exists.
[PASS] GET /api/cases/:id returns updated status and prices.
[PASS] GET /api/citas still returns 200.
```

## Scope Guard

```text
[PASS] No frontend files changed.
[PASS] No backend/models/* files changed.
[PASS] No backend/routes/citas.js changes.
[PASS] No backend/services/gemini.js changes.
[PASS] No WhatsApp side effects added.
[PASS] No SMS/email side effects added.
[PASS] No Gemini side effects added.
[PASS] No Temporal side effects added.
[PASS] No PDF generation added.
[PASS] No send-quote endpoint added.
[PASS] No payment/debt accounting added.
```

## Not Run

```text
[NOT RUN] Cross-vertical runtime validation for supportsDeliveryDate=true was not run because the active local config is Turagua vehicle_service. The guarded true branch should be tested when running custom_orders or technical_repair.
```
