# CHECKLIST. PR-4 Manual QA

## Static Checks

```text
[PASS] node --check backend/mappers/caseMapper.js
[PASS] node --check backend/services/caseService.js
[PASS] node --check backend/routes/cases.js
```

## Runtime Base

```text
[PASS] npm run dev:backend starts.
[PASS] GET /health works.
[PASS] GET /api/vertical-config works.
```

## Authenticated POST /api/cases

```text
[PASS] POST /api/cases with existing customer id.
[PASS] POST /api/cases with existing customer phone.
[PASS] POST /api/cases with new customer phone.
[PASS] POST /api/cases without customer id/phone returns 400.
[PASS] POST /api/cases without customer.name for new customer returns 400.
[PASS] POST /api/cases with invalid status returns 400.
[PASS] POST /api/cases with expert_review stores revision_maestro.
```

## Readback / Compatibility

```text
[PASS] GET /api/cases/:id returns created Case DTO.
[PASS] GET /api/cases?status=intake works.
[PASS] GET /api/citas still works.
```

## Scope Guard

```text
[PASS] No frontend UI changes.
[PASS] No Gemini changes.
[PASS] No model changes.
[PASS] No /api/citas changes.
[PASS] No WhatsApp side effects added.
[PASS] No Temporal side effects added.
[PASS] No quote/expert-review flow added.
```

## Notes

```text
QA created local development Cliente/Cita records using unique PR4 phone values.
```
