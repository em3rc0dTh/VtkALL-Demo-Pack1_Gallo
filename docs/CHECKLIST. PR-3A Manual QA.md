# CHECKLIST. PR-3A Manual QA

## Static Checks

```text
[PASS] node --check backend/services/statusService.js
[PASS] node --check backend/mappers/caseMapper.js
[PASS] node --check backend/services/caseService.js
[PASS] node --check backend/routes/cases.js
[PASS] node --check backend/index.js
```

## Backend Runtime

```text
[PASS] npm run dev:backend starts.
[PASS] GET /health returns ok:true.
[PASS] GET /api/vertical-config returns ok:true.
```

## Case API

```text
[PASS] Authenticated GET /api/cases returns ok:true and data.items.
[PASS] Authenticated GET /api/cases/:id returns one Case DTO when local data exists.
[PASS] GET /api/cases?status=approved succeeds and maps to legacy confirmada.
[PASS] GET /api/cases?status=expertReview rejects camelCase status with 400.
[PASS] PATCH /api/cases/:id/status with expert_review returns status expert_review and legacyStatus revision_maestro.
[PASS] PATCH /api/cases/:id/status with expertReview rejects with 400.
```

## Legacy Compatibility / Scope Guard

```text
[PASS] /api/citas still responds through the legacy route.
[PASS] No backend/models/* changes.
[PASS] No backend/routes/citas.js changes.
[PASS] No frontend/app/* changes.
[PASS] No frontend/components/* changes.
[PASS] No backend/services/gemini.js changes.
[PASS] No POST /api/cases added.
[PASS] No general PATCH /api/cases/:id added.
```

## Notes

```text
Authentication used the existing local development admin user.
One local Cita record was patched during QA to verify expert_review -> revision_maestro.
```
