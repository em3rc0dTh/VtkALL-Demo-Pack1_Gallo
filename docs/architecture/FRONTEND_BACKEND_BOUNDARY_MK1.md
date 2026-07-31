# Stable Frontend to Backend Boundary Mk1

## Status

```text
Architecture Decision
Backend-Authoritative
Canonical Model Frozen
Frontend-Adaptive
```

This document adopts the stable `demo_test` integration boundary. It is grounded in:

- `docs/data-model/DATA_MODEL_VTKALL_DataModel-0_v3_timeslots.md`
- `docs/architecture/ADR-001.md`
- `docs/architecture/ADR-002.md`
- ContractMK1 frontend/backend/Temporal/MongoDB ownership rules

The v3 data model is not changed by this boundary.

## Architectural Law

```text
Canonical Model v3
  -> Backend Domain Authority
  -> Stable API Boundary
  -> Frontend Contract Adapters
  -> View Models
  -> UI
```

Never:

```text
UI
  -> API shape
  -> backend semantics
  -> data model mutation
```

The frontend presents, collects, validates envelopes, adapts responses, and projects view models. Backend validates and persists. Temporal orchestrates durable process flow. MongoDB remains the operational source of truth.

## Boundaries

### Operational Boundary

```http
POST /api/demo-test/customers
POST /api/demo-test/managed-entities
POST /api/demo-test/cases
GET  /api/demo-test/availability
POST /api/demo-test/schedule-consultation
GET  /api/demo-test/cases/:caseId/timeline
```

These operations require execution context. Scheduling requires an `Idempotency-Key`.

### Reference Read Boundary

```http
GET /api/v1/business-profiles
GET /api/v1/catalog-offerings
```

The stable frontend consumes these as read-only reference data. Backend write routes for reference resources are administrative and must be protected by an explicit administrative context.

## Frontend Data Mode

`NEXT_PUBLIC_DEMO_TEST_DATA_MODE` must be explicit:

```text
api  -> backend required, no mock fallback
mock -> contract simulator only
```

Missing or invalid mode is a configuration defect. In stable build or CI, it fails fast. At runtime, `api` mode with backend unavailable renders a visible transport or integration error, never mock success.

## Reference Data Semantics

### BusinessProfile

The frontend requests:

```text
businessSlug=<slug>
active=true
```

Adapter rules:

```text
0 active profiles -> BUSINESS_PROFILE_NOT_FOUND
1 active profile  -> valid businessProfile
>1 active profile -> BUSINESS_PROFILE_AMBIGUOUS
```

The frontend never synthesizes a profile in API mode and never silently chooses `data[0]`.

### CatalogOffering

The frontend requires `businessSlug`. `verticalType` is interpreted according to the loaded `BusinessProfile`.

Adapter rules:

```text
active offerings only
pagination handled explicitly
metadata not silently ignored
backend sort used when present
presentation sort allowed only as UI projection
```

## Named Contract Outputs

Frontend contract outputs use named canonical keys:

```text
businessProfile
catalogOfferings
customer
managedEntity
case
availability
appointment
resourceReservation
timeline
executionContext
```

Generic `entity` is not the primary output shape.

## Idempotency

Scheduling idempotency represents the full semantic command:

```text
businessSlug
caseId
catalogOfferingId
teamId
startAt
durationMinutes
appointmentType
```

Same semantic scheduling command means the same `Idempotency-Key`. Any meaningful scheduling input change means a new key. Keys must not be generated from render time, click time, retry attempt, random values, or timestamp-only identity.

## Non-Negotiable Acceptance Rules

- The frontend never mutates canonical model semantics.
- UI labels never become backend statuses.
- `Appointment` remains customer-facing schedule.
- `ResourceReservation` remains operational capacity blocker.
- `WorkTeam.capacity > 1` allows parallel compatible reservations up to capacity.
- Normal execution and idempotent reconciliation return equivalent `Case` state.
- Generic Temporal scheduling never hardcodes Turagua, `vehicle_service`, plate, vehicle brand/model/year, or any Demo Pack specific field.
- Timeline is backend-authored; the frontend refetches or invalidates it after meaningful commands.

## Verification

Required validation includes:

```text
npm run lint --prefix frontend
npm run build --prefix frontend
npm run test:demo-test:guardrails --prefix backend
npm run test:demo-test:core --prefix backend
npm run test:demo-test:idempotency --prefix backend
npm run test:demo-test:compatibility --prefix backend
npm run test:demo-test:api-pack --prefix backend
```

Scenario coverage must include BusinessProfile zero/ambiguous results, catalog pagination, malformed envelopes, stable retry idempotency, new key on semantic command change, capacity greater than one, reconciliation equivalence, Temporal vertical neutrality, and mock/API parity.
