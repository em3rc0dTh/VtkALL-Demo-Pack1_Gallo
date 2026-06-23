# CHECKLIST. PR-2 Manual QA

## Static Validation

```text
[PASS] node --check backend/config/env.js
[PASS] node --check backend/config/verticals/index.js
[PASS] node --check backend/services/verticalConfigService.js
[PASS] node --check backend/services/labelService.js
[PASS] node --check backend/services/statusService.js
[PASS] node --check backend/services/promptRegistryService.js
[PASS] node --check backend/routes/verticalConfig.js
[PASS] node --check backend/services/gemini.js
```

## Runtime Validation

```text
[PASS] Backend starts with VERTIKALL_BUSINESS=turagua and VERTIKALL_VERTICAL=vehicle_service.
[PASS] GET /api/vertical-config returns Turagua labels.
[PASS] Backend starts with VERTIKALL_BUSINESS=bateylate and VERTIKALL_VERTICAL=custom_orders.
[PASS] GET /api/vertical-config returns BateYLate labels.
[PASS] Backend starts with VERTIKALL_BUSINESS=repair-demo and VERTIKALL_VERTICAL=technical_repair.
[PASS] GET /api/vertical-config returns Repair Demo labels.
[PASS] Unknown business falls back when VERTIKALL_CONFIG_STRICT=false.
[PASS] Unknown business fails early when VERTIKALL_CONFIG_STRICT=true.
[PASS] npm run dev:backend starts and /health returns ok: true.
[NOT RUN] docker compose config; Docker CLI availability was not confirmed in this workspace.
```

## Scope Guard

```text
[PASS] No database migration.
[PASS] No model changes.
[PASS] No /api/cases.
[PASS] No CaseService.
[PASS] No frontend visual changes.
[PASS] No backend/routes/citas.js changes.
```
