Exacto. El ejemplo que enviaste define un **contrato de paquete entre dos fronteras ejecutoras**: una parte produce un paquete común y otra lo consume, sin que una tenga que conocer los detalles internos de la otra. En el ejemplo, el contrato separa responsabilidades entre **Capture Adapter** y **Storage Service**, define ownership, reglas, validación, versionado, ejemplos y non-goals. 

Para VtkALL, podemos adaptar ese patrón así:

```text id="7dn6j5"
Party A = Backend / Codex
Party B = Frontend / Antigravity

Contrato = Demo Test Pack 0 Execution Contract Mk1
Frontera = API + DTOs + estados + eventos + reglas de integración
Fuente de verdad = DATA_MODEL_VTKALL_DataModel-0_v3_timeslots
```

Te dejo una primera versión lista para usar.

# DESIGN. VtkALL Demo Test Pack 0 Execution Contract Mk1

## 1. Purpose

The **VtkALL Demo Test Pack 0 Execution Contract Mk1** defines the operational agreement between:

```text
Backend Party / Codex
        ↕
Frontend Party / Antigravity
```

The contract exists so Backend and Frontend can implement `demo_test` with the same vision, the same boundaries, and the same execution rules without redefining the scope independently.

This contract applies to the stabilization of `demo_test` as the clean laboratory for **VtkALL Demo Pack 0**.

The initial scope covers:

```text
USE-02 Register Customer
USE-03 Register ManagedEntity
USE-04 Create Operational Case
USE-05 Schedule Appointment / Consultation
```

The canonical data model is:

```text
DATA_MODEL_VTKALL_DataModel-0_v3_timeslots
```

This contract does **not** redesign the data model.

This contract does **not** replace ADR-001.

This contract defines how the two execution parties must collaborate over the already-defined model.

---

## 2. Core Principle

```text
Frontend presents and collects.
Backend validates and persists.
Temporal orchestrates.
MongoDB is the source of truth.
```

Frontend must not own business rules.

Backend must not assume UI-specific behavior.

Temporal must not replace Backend domain validation.

MongoDB remains the persistent source of truth.

---

## 3. Parties

## 3.1 Backend Party / Codex

The Backend Party owns:

```text
Domain services
API contracts
Persistence
MongoDB writes
Validation
Availability calculation
ResourceReservation creation
Appointment creation
TimelineEvent creation
Temporal Activities
Temporal Workflow integration
Error semantics
Idempotency
```

Backend is the authority for:

```text
Customer
ManagedEntity
Case
Appointment
TimelineEvent
WorkTeam
WorkTeamScheduleRule
WorkTeamScheduleOverride
ResourceReservation
```

Backend must follow the v3 timeslots model exactly.

## 3.2 Frontend Party / Antigravity

The Frontend Party owns:

```text
User experience
Manual console screens
Forms
Client-side flow
API consumption
Loading states
Error display
Availability selection UI
Appointment confirmation UI
Timeline rendering
Basic validation for usability
```

Frontend is not the authority for:

```text
Business rules
Capacity blocking
Double-booking prevention
Case state transitions
MongoDB persistence
Temporal workflow internals
```

Frontend must treat Backend responses as authoritative.

---

## 4. Shared Scope

The shared implementation scope is:

```text
Customer registration
ManagedEntity registration
Operational Case creation
Availability lookup
Appointment / Consultation scheduling
ResourceReservation linkage
TimelineEvent visibility
```

The final shared flow is:

```text
Customer
        ↓
ManagedEntity
        ↓
Case
        ↓
Availability calculation
        ↓
ResourceReservation
        ↓
Appointment
        ↓
TimelineEvent
```

---

## 5. Non-Negotiable Model Rule

The v3 scheduling rule is mandatory:

```text
Appointment schedules the customer-facing appointment.
ResourceReservation blocks real operational capacity.
```

Therefore:

```text
Appointment must reference ResourceReservation.
ResourceReservation must reference WorkTeam.
Only ResourceReservation with status held or booked blocks capacity.
Availability must be calculated from WorkTeamScheduleRule, WorkTeamScheduleOverride and ResourceReservation.
AvailabilitySlot must not be used as the future source of truth.
```

Frontend must never assume that a visible appointment alone means capacity is blocked.

Backend must never create a scheduled Appointment without a valid ResourceReservation.

---

## 6. Design Goals

## Shared Understanding

Both parties must implement the same flow, same entity meanings, and same success criteria.

## Backend Authority

Backend must own all rules that protect data consistency.

## Frontend Clarity

Frontend must expose a clear operational experience without duplicating backend rules.

## Model Stability

No party may redesign, rename, replace, or fork the v3 timeslots model.

## Integration First

The contract must make it obvious what Frontend sends, what Backend returns, and what errors mean.

## Pack Isolation

`demo_test` must stabilize Pack 0 without breaking Pack 1 or Pack 2.

## Temporal Readiness

Manual API flow must work first. Temporal orchestration may be added after the backend flow is stable.

---

## 7. Ownership Matrix

| Area                       | Backend / Codex               | Frontend / Antigravity                    |
| -------------------------- | ----------------------------- | ----------------------------------------- |
| Data model interpretation  | Owns canonical implementation | Consumes canonical shape                  |
| Customer creation          | Owns                          | Calls API                                 |
| ManagedEntity creation     | Owns                          | Calls API                                 |
| Case creation              | Owns                          | Calls API                                 |
| Availability calculation   | Owns                          | Displays options                          |
| ResourceReservation        | Owns                          | Never creates directly except through API |
| Appointment creation       | Owns                          | Calls scheduling API                      |
| TimelineEvent creation     | Owns                          | Displays timeline                         |
| Double-booking prevention  | Owns                          | Shows conflict message                    |
| Form UX                    | Supports via API errors       | Owns                                      |
| Loading/error states       | Returns semantic errors       | Owns                                      |
| Temporal workflow          | Owns                          | Does not depend on internals              |
| MongoDB persistence        | Owns                          | No direct access                          |
| Pack 1 / Pack 2 protection | Must avoid regressions        | Must avoid UI coupling regressions        |

---

## 8. API Boundary

The shared operational boundary is the Backend API.

Frontend must integrate through these endpoints:

```http
POST /api/demo-test/customers
POST /api/demo-test/managed-entities
POST /api/demo-test/cases
GET  /api/demo-test/availability
POST /api/demo-test/schedule-consultation
GET  /api/demo-test/cases/:caseId/timeline
```

Backend may internally call services, MongoDB and Temporal.

Frontend must not call Temporal directly.

Frontend must not infer database state beyond API responses.

---

## 9. Backend Responsibilities

Backend must implement or expose:

```text
customerService
managedEntityService
caseService
availabilityService
resourceReservationService
appointmentService
timelineService
```

Backend must guarantee:

```text
1. businessSlug is required for all persistent operations.
2. Customer can be created or reused.
3. ManagedEntity belongs to Customer.
4. Case belongs to Customer and optionally ManagedEntity.
5. Availability is calculated from WorkTeam rules, overrides and reservations.
6. ResourceReservation blocks capacity.
7. Appointment references ResourceReservation.
8. TimelineEvent records important business events.
9. Double booking is rejected.
10. Failed Appointment creation releases held ResourceReservation.
```

---

## 10. Frontend Responsibilities

Frontend must implement a manual `demo_test` console or flow that supports:

```text
1. Register or select Customer.
2. Register or select ManagedEntity.
3. Create Operational Case.
4. Request availability.
5. Display available slots.
6. Submit selected slot.
7. Display scheduling success.
8. Display double-booking conflict.
9. Display case timeline.
```

Frontend must show Backend errors clearly.

Frontend must not fake success before Backend confirms.

Frontend must not locally mark a slot as reserved unless Backend returns a booked or held reservation according to the API contract.

---

## 11. Canonical Flow Contract

## 11.1 Create or reuse Customer

Frontend sends:

```json
{
  "businessSlug": "demo_test",
  "type": "person",
  "name": "Carlos Ramírez",
  "contact": {
    "phones": [
      {
        "countryCode": "+51",
        "number": "999888777",
        "normalized": "51999888777",
        "isWhatsapp": true,
        "primary": true
      }
    ],
    "email": "carlos@example.com"
  }
}
```

Backend returns:

```json
{
  "ok": true,
  "customer": {
    "_id": "cus_001",
    "businessSlug": "demo_test",
    "name": "Carlos Ramírez",
    "status": "active"
  },
  "reused": false
}
```

## 11.2 Create ManagedEntity

Frontend sends:

```json
{
  "businessSlug": "demo_test",
  "customerId": "cus_001",
  "type": "vehicle",
  "displayName": "Toyota Yaris ABC-123",
  "summary": "Toyota Yaris 2020, placa ABC-123",
  "data": {
    "brand": "Toyota",
    "model": "Yaris",
    "year": 2020,
    "plate": "ABC-123"
  }
}
```

Backend returns:

```json
{
  "ok": true,
  "managedEntity": {
    "_id": "me_001",
    "businessSlug": "demo_test",
    "customerId": "cus_001",
    "type": "vehicle",
    "displayName": "Toyota Yaris ABC-123"
  }
}
```

## 11.3 Create Case

Frontend sends:

```json
{
  "businessSlug": "demo_test",
  "verticalType": "vehicle_service",
  "customerId": "cus_001",
  "managedEntityId": "me_001",
  "source": {
    "channel": "manual_console",
    "agent": "manual",
    "origin": "demo_test_console"
  },
  "intent": {
    "type": "assessment_request",
    "summary": "Cliente solicita evaluación vehicular",
    "customerText": "Quiero revisar mi vehículo.",
    "selectedOfferingId": "off_vehicle_assessment"
  }
}
```

Backend returns:

```json
{
  "ok": true,
  "case": {
    "_id": "case_001",
    "businessSlug": "demo_test",
    "caseNumber": "DEMO-2026-0001",
    "customerId": "cus_001",
    "managedEntityId": "me_001",
    "status": "lead"
  }
}
```

## 11.4 Get Availability

Frontend requests:

```http
GET /api/demo-test/availability?businessSlug=demo_test&teamId=team_frontdesk&date=2026-07-06&durationMinutes=60&timezone=America/Lima
```

Backend returns:

```json
{
  "ok": true,
  "businessSlug": "demo_test",
  "teamId": "team_frontdesk",
  "date": "2026-07-06",
  "durationMinutes": 60,
  "timezone": "America/Lima",
  "slots": [
    {
      "startAt": "2026-07-06T09:00:00.000-05:00",
      "endAt": "2026-07-06T10:00:00.000-05:00",
      "capacityRemaining": 1
    }
  ]
}
```

## 11.5 Schedule Consultation

Frontend sends:

```json
{
  "businessSlug": "demo_test",
  "caseId": "case_001",
  "customerId": "cus_001",
  "managedEntityId": "me_001",
  "teamId": "team_frontdesk",
  "catalogOfferingId": "off_basic_consultation",
  "startAt": "2026-07-06T09:00:00.000-05:00",
  "durationMinutes": 60,
  "timezone": "America/Lima",
  "appointmentType": "consultation"
}
```

Backend executes:

```text
1. Validate Customer.
2. Validate ManagedEntity.
3. Validate Case.
4. Validate WorkTeam.
5. Validate requested availability.
6. Create ResourceReservation as held.
7. Create Appointment linked to ResourceReservation.
8. Confirm ResourceReservation as booked.
9. Register TimelineEvent.
10. Update Case status.
```

Backend returns:

```json
{
  "ok": true,
  "appointment": {
    "_id": "appt_001",
    "businessSlug": "demo_test",
    "caseId": "case_001",
    "customerId": "cus_001",
    "managedEntityId": "me_001",
    "status": "scheduled",
    "scheduledStart": "2026-07-06T09:00:00.000-05:00",
    "scheduledEnd": "2026-07-06T10:00:00.000-05:00",
    "resourceReservationId": "res_001"
  },
  "resourceReservation": {
    "_id": "res_001",
    "businessSlug": "demo_test",
    "teamId": "team_frontdesk",
    "status": "booked",
    "startAt": "2026-07-06T09:00:00.000-05:00",
    "endAt": "2026-07-06T10:00:00.000-05:00"
  }
}
```

---

## 12. Error Contract

Backend errors must be semantic and stable.

Expected error codes:

```text
VALIDATION_ERROR
CUSTOMER_NOT_FOUND
MANAGED_ENTITY_NOT_FOUND
CASE_NOT_FOUND
WORK_TEAM_NOT_FOUND
NO_AVAILABILITY
DOUBLE_BOOKING_CONFLICT
RESERVATION_FAILED
APPOINTMENT_CREATION_FAILED
TIMELINE_WRITE_FAILED
INTERNAL_ERROR
```

Example:

```json
{
  "ok": false,
  "error": {
    "code": "DOUBLE_BOOKING_CONFLICT",
    "message": "The selected slot is no longer available.",
    "details": {
      "teamId": "team_frontdesk",
      "startAt": "2026-07-06T09:00:00.000-05:00"
    }
  }
}
```

Frontend must map these errors into clear UI messages.

Frontend must not convert all errors into generic failure messages.

---

## 13. Timeline Contract

Backend must record TimelineEvents for:

```text
customer.created
managed_entity.created
case.created
availability.checked
resource_reservation.held
resource_reservation.booked
resource_reservation.released
appointment.scheduled
appointment.confirmed
appointment.failed
status.changed
```

Frontend must render timeline events grouped by case.

Minimum display fields:

```text
createdAt
eventType
title
description
visibility
actor
```

Frontend should not invent timeline events locally.

---

## 14. Temporal Contract

Manual API flow must work before Temporal integration.

After manual stabilization, Backend may expose a Temporal-backed flow.

Temporal responsibilities:

```text
Orchestrate steps
Retry activities
Handle waits
Trigger compensation
Preserve workflow history
```

Temporal must not:

```text
Write directly to MongoDB
Bypass domain services
Own business validation
Replace Backend/API
Expose workflow internals to Frontend
```

Frontend must not care whether the flow is manual service orchestration or Temporal-backed, as long as the API contract remains stable.

---

## 15. Versioning Rules

This contract version is:

```text
mk1
```

Rules:

```text
contract_version must be documented.
Breaking changes require mk2.
Backend must not silently change response shapes.
Frontend must not depend on undocumented fields.
Optional fields may be added if they do not break existing consumers.
Deprecated fields must remain temporarily available during transition.
```

---

## 16. Validation Rules

Backend owns validation.

Frontend may perform usability validation only.

Backend validation includes:

```text
businessSlug required
Customer exists
ManagedEntity exists
ManagedEntity belongs to Customer
Case exists
Case belongs to Customer
WorkTeam exists and is active
Requested slot is inside schedule rules
Overrides are applied
held/booked reservations block capacity
Appointment must reference ResourceReservation
```

Frontend validation includes:

```text
Required form fields
Basic date selection
Basic phone/email formatting
Preventing empty submission
Displaying backend validation feedback
```

Frontend validation is not authoritative.

---

## 17. Non-Goals

This contract does not implement:

```text
Assessment
AssessmentReport
Quote
QuoteLine
DecisionRecord
WorkOrder
WorkOrderTask
Payments
WhatsApp integration
PDF generation
AI agent integration
Pack 1 migration
Pack 2 migration
Full SaaS multitenancy
```

This contract does not redesign:

```text
DATA_MODEL_VTKALL_DataModel-0_v3_timeslots
MongoDB canonical model
Temporal architecture
Pack 1 legacy Cita
Pack 2 BateYLate domain flow
```

---

## 18. Implementation Sequence

Backend / Codex executes:

```text
1. ADR and contract docs.
2. Model alignment against v3 timeslots.
3. Domain services.
4. Manual demo_test API.
5. Seeds.
6. Stability tests.
7. Temporal integration.
```

Frontend / Antigravity executes:

```text
1. Read this contract.
2. Build manual demo_test console flow.
3. Integrate Customer API.
4. Integrate ManagedEntity API.
5. Integrate Case API.
6. Integrate Availability API.
7. Integrate Schedule Consultation API.
8. Render Timeline.
9. Handle semantic backend errors.
10. Avoid direct assumptions about availability or reservation state.
```

---

## 19. Definition of Done

This contract is satisfied when:

```text
1. Frontend can create or reuse Customer.
2. Frontend can create ManagedEntity.
3. Frontend can create Case.
4. Frontend can request availability.
5. Frontend can schedule Appointment through Backend.
6. Backend creates ResourceReservation.
7. Backend links Appointment to ResourceReservation.
8. Backend rejects double booking.
9. Backend records TimelineEvent.
10. Frontend displays timeline.
11. Manual flow works without AI.
12. Temporal can later orchestrate the same flow without changing Frontend contract.
13. Pack 1 and Pack 2 remain unaffected.
14. No data model redesign was introduced.
```

---

## 20. Core Formula

```text
Collect
        ↓
Validate
        ↓
Reserve
        ↓
Schedule
        ↓
Record
        ↓
Display
```

Mi recomendación: este documento debería vivir como:

```text id="xco2lp"
docs/demo_test/DEMO_TEST_PACK_0_EXECUTION_CONTRACT_MK1.md
```

Y debería ser el documento común que se le entrega tanto a **Codex / Backend** como a **Antigravity / Frontend** antes de ejecutar PRs.
