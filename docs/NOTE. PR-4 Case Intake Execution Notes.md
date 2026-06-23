# NOTE. PR-4 Case Intake Over Cita

## What Was Implemented

Implemented a limited authenticated `POST /api/cases` intake endpoint. The endpoint creates or reuses a legacy `Cliente`, creates a legacy `Cita`, and returns the public Case DTO through the existing PR-3A mapper.

## Files Changed

```text
backend/mappers/caseMapper.js
backend/services/caseService.js
backend/routes/cases.js
```

## Files Created

```text
docs/PLAN. PR-4 Case Intake Over Cita.md
docs/NOTE. PR-4 Case Intake Execution Notes.md
docs/CHECKLIST. PR-4 Manual QA.md
```

## API Endpoints Added

```text
POST /api/cases
```

## POST /api/cases Contract

Authenticated with `protegerRuta`.

Input supports:

```text
customer.id
customer.name
customer.phone
customer.dni
customer.email
managedEntity.type
managedEntity.data
managedEntity.summary
serviceId
productId
description
scheduledDate
status
source
```

Success returns:

```json
{
  "ok": true,
  "data": {}
}
```

Status code:

```text
201 Created
```

## Input Validation

```text
customer is required.
customer.id OR customer.phone is required.
If customer.id is not provided, customer.name is required.
description OR serviceId OR productId is required.
status defaults to intake.
Provided status must be valid public snake_case.
scheduledDate is optional.
Provided scheduledDate must parse as a valid date.
serviceId and productId must be valid ObjectIds when provided.
```

Strict `features.managedEntityRequired` validation is intentionally not enforced in PR-4.

## Customer Lookup/Create Behavior

```text
customer.id: validates ObjectId, finds Cliente, returns 404 if missing.
customer.phone: trims only, finds Cliente by numero_telefono, creates if missing.
Existing Cliente: fills only missing safe fields: nombre, dni, email.
Duplicate phone race: retries lookup once by phone before returning conflict.
Cliente.total_citas: incremented after Cita creation; failure is logged and does not block case creation.
```

No advanced client merge or phone normalization was implemented.

## Case Input To Cita Mapping

```text
customer.id -> cliente
customer.name -> nombre_cliente
customer.phone -> numero_telefono
description -> descripcion_trabajo
description + managedEntity.summary/type + source -> detalles_reserva
scheduledDate -> fecha_cita
status -> estado legacy
serviceId lookup -> servicio name when available
productId lookup -> producto_id and product name fallback
managedEntity.data -> vehiculo only for vehicle_service / technical_repair
source -> origen safe fallback
```

`source: "case_api"` maps to legacy `origen: "dashboard"` because the current `Cita` enum allows only:

```text
whatsapp
dashboard
web
```

## Legacy Required Field Fallbacks

```text
scheduledDate fallback uses current date when absent because Cita.fecha_cita is required.
service fallback uses active vertical labels or generic Caso when service/product name is unavailable because Cita.servicio is required.
```

## Managed Entity Legacy Storage

```text
vehicle_service: managedEntity.data is stored in Cita.vehiculo.
custom_orders: no fake vehicle is created; description/summary are stored in detalles_reserva.
technical_repair: managedEntity.data is stored in Cita.vehiculo as accepted legacy debt.
```

## Status Mapping

Public statuses remain snake_case.

```text
intake -> pendiente
expert_review -> revision_maestro
waiting_customer -> esperando_cliente
approved -> confirmada
in_progress -> evaluacion_en_curso
completed -> completada
cancelled -> cancelada
```

## Side Effects Policy

Allowed:

```text
Create or reuse Cliente.
Create Cita.
Increment Cliente.total_citas after Cita creation when safe.
Return Case DTO.
```

Not added:

```text
WhatsApp
Gemini
Temporal
quote flow
repair history
debt accounting
agenda recalculation
customer approval flow
```

## Commands Executed

```powershell
git status --short --branch
git log --oneline --decorate -5
git checkout -b feat/poc-stable-core-pr4-case-intake
node --check backend\mappers\caseMapper.js
node --check backend\services\caseService.js
node --check backend\routes\cases.js
node --input-type=module -e "<case input mapper validation>"
npm run dev:backend
git diff --name-status
```

## Manual Validation

```text
[PASS] Backend starts.
[PASS] GET /health works.
[PASS] GET /api/vertical-config works.
[PASS] POST /api/cases with existing customer id.
[PASS] POST /api/cases with existing customer phone.
[PASS] POST /api/cases with new customer phone.
[PASS] POST /api/cases without customer id/phone returns 400.
[PASS] POST /api/cases without customer.name for new customer returns 400.
[PASS] POST /api/cases with invalid status returns 400.
[PASS] POST /api/cases with expert_review stores revision_maestro.
[PASS] GET /api/cases/:id returns created Case DTO.
[PASS] GET /api/cases?status=intake works.
[PASS] GET /api/citas still works.
[PASS] No frontend UI changes.
[PASS] No Gemini changes.
[PASS] No model changes.
[PASS] No /api/citas changes.
```

Authentication used the existing local development admin user.

## Known Limitations

```text
No idempotency store.
No ManagedEntity model.
No Case model.
No strict vertical validation.
No frontend integration.
No Gemini integration.
No WhatsApp side effects.
No Temporal side effects.
No quote flow.
No expert review flow.
scheduledDate fallback uses current date when absent because Cita.fecha_cita is required.
service fallback uses semantic label when service/product name is unavailable because Cita.servicio is required.
No advanced phone normalization.
No advanced client merge.
```

## Risks / Follow-Up Items

```text
Future PRs should decide whether unscheduled cases need first-class schema support instead of fecha_cita fallback.
Future PRs should introduce ManagedEntity before strict managedEntityRequired validation.
Future PRs should decide whether POST /api/cases needs idempotency keys.
Future PRs should model intentional operational side effects separately instead of calling legacy /api/citas behavior.
```

## Deviations From Original Plan

```text
None.
```

## Rollback Notes

```text
Revert this PR.
No schema rollback is required.
Created QA Cliente/Cita records can be manually removed from local/dev Mongo if desired.
```
