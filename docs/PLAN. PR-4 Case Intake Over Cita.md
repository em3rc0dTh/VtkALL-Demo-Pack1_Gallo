# PLAN. PR-4 Case Intake Over Cita

## Goal

Add a limited authenticated `POST /api/cases` intake endpoint that creates or reuses a legacy `Cliente`, creates a legacy `Cita`, and returns the stable Case DTO introduced in PR-3A.

## Scope

```text
POST /api/cases
caseService.createCase(caseInput)
caseMapper.mapCaseInputToCitaPayload(caseInput, options)
private customer lookup/create helper inside caseService.js
```

## Non-Goals

```text
No PATCH /api/cases/:id general update.
No public intake endpoint.
No strict vertical validation.
No idempotency store.
No frontend integration.
No frontend UI changes.
No Gemini integration.
No WhatsApp side effects.
No Temporal workflow changes.
No quote flow.
No expert review flow.
No new Case model.
No new ManagedEntity model.
No Mongo migration.
No backend/routes/citas.js changes.
No model changes.
```

## Baseline Assumptions

```text
Branch starts from feat/poc-stable-core-pr3a.
Accepted baseline commit is 1202dc3e.
PR-3A already provides Case DTO mapping, list/get/status routes, and public status helpers.
Cita remains the persistence model.
```

## Files Expected To Change

```text
backend/mappers/caseMapper.js
backend/services/caseService.js
backend/routes/cases.js
```

## Files Expected To Be Created

```text
docs/PLAN. PR-4 Case Intake Over Cita.md
docs/NOTE. PR-4 Case Intake Execution Notes.md
docs/CHECKLIST. PR-4 Manual QA.md
```

## POST /api/cases Contract

Authenticated with `protegerRuta`.

Input:

```json
{
  "customer": {
    "id": "optional",
    "name": "Nombre Cliente",
    "phone": "+51999999999",
    "dni": "optional",
    "email": "optional"
  },
  "managedEntity": {
    "type": "vehicle | custom_order | equipment",
    "data": {},
    "summary": "optional"
  },
  "serviceId": "optional",
  "productId": "optional",
  "description": "Detalle de la solicitud",
  "scheduledDate": "2026-06-25T15:00:00.000Z",
  "status": "intake",
  "source": "case_api"
}
```

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Status code: `201 Created`.

## Input Validation

```text
customer.id OR customer.phone is required.
If no customer.id, customer.name is required.
description OR serviceId OR productId is required.
status defaults to intake.
If status is provided, it must be valid public snake_case.
scheduledDate is optional.
If scheduledDate is provided, it must parse as a valid date.
managedEntity is optional.
features.managedEntityRequired is not enforced in PR-4.
```

## Customer Lookup/Create Policy

```text
If customer.id exists, validate ObjectId and find Cliente.
If referenced Cliente is missing, return controlled 404.
If found, fill only missing safe fields: nombre, dni, email.
If customer.phone exists without id, trim only and find by numero_telefono.
If phone exists, reuse Cliente and fill only missing safe fields.
If phone does not exist, create Cliente with nombre, numero_telefono, dni, email.
If duplicate phone race happens, retry lookup once by phone before returning 409.
Increment cliente.total_citas only after Cita creation succeeds.
```

## Case Input To Cita Mapping

```text
customer.id -> cliente
customer.name -> nombre_cliente
customer.phone -> numero_telefono
description -> descripcion_trabajo
description + managedEntity.summary -> detalles_reserva
scheduledDate -> fecha_cita
status -> estado legacy through statusService
serviceId -> service lookup/name when available
productId -> producto_id and product name fallback when available
managedEntity.data -> vehiculo only for vehicle_service / technical_repair
source -> origen safe fallback dashboard
```

## Managed Entity Legacy Storage

```text
vehicle_service: managedEntity.data -> Cita.vehiculo
custom_orders: do not create fake vehicle; use description/summary in detalles_reserva
technical_repair: managedEntity.data -> Cita.vehiculo as accepted legacy debt
```

## Legacy Required Field Fallbacks

```text
Cita.fecha_cita is required. If scheduledDate is absent, use new Date().
Cita.servicio is required. If service/product name is unavailable, use active vertical labels or generic Caso.
```

## Side Effects Policy

Allowed:

```text
Create/reuse Cliente.
Create Cita.
Increment Cliente.total_citas after Cita creation when safe.
Return Case DTO.
```

Forbidden:

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

## Implementation Steps

1. Add `mapCaseInputToCitaPayload` in `caseMapper`.
2. Add validation, customer helper, product/service resolution, and `createCase` in `caseService`.
3. Add `POST /api/cases` in `routes/cases.js`.
4. Run syntax checks.
5. Run backend smoke and authenticated POST checks.
6. Document execution notes and manual QA.
7. Commit PR-4.

## Risk Areas

```text
Avoid duplicating heavy /api/citas behavior.
Avoid creating duplicate Cliente by phone.
Do not store public snake_case status in Cita.estado.
Do not trigger side effects.
Fallback fecha_cita/current date and servicio semantic label are legacy compatibility compromises.
```

## Validation Plan

```text
[ ] node --check backend/mappers/caseMapper.js
[ ] node --check backend/services/caseService.js
[ ] node --check backend/routes/cases.js
[ ] Backend starts.
[ ] GET /health works.
[ ] GET /api/vertical-config works.
[ ] Authenticated POST /api/cases with existing customer id.
[ ] Authenticated POST /api/cases with existing customer phone.
[ ] Authenticated POST /api/cases with new customer phone.
[ ] Missing customer id/phone returns 400.
[ ] Missing customer.name for new customer returns 400.
[ ] Invalid status returns 400.
[ ] expert_review stores revision_maestro.
[ ] GET /api/cases/:id returns created Case DTO.
[ ] GET /api/citas still works.
```

## Rollback Notes

Revert this PR. Created test `Cita` and `Cliente` records may be removed manually in local/dev databases if needed. No schema rollback is required.
