# demo_test Pack 0 Model Alignment Audit

This audit covers the guarded PR-001 scope for USE-02 through USE-05. It documents how the current TypeScript backend maps to `DATA_MODEL_VTKALL_DataModel-0_v3_timeslots` and the ContractMK1 backend boundary without changing runtime behavior.

## Guardrails

- PR-001 is documentation only and must not modify runtime behavior.
- `DATA_MODEL_VTKALL_DataModel-0_v3_timeslots` remains canonical.
- `Case` is the operational root for `demo_test`.
- `Appointment` schedules the customer-facing appointment.
- `ResourceReservation` blocks real operational capacity.
- `AvailabilitySlot` is legacy compatibility only; it is not the source of truth for future availability.
- Do not create demo-only canonical entities such as `DemoCustomer`, `DemoCase`, `DemoAppointment`, `DemoReservation`, or `DemoTimeline`.
- `Cita`/legacy appointment concepts may be adapted for compatibility only and must not become the canonical `demo_test` root.
- Temporal may orchestrate later, but must call backend domain services and must not own domain validation or direct persistence rules.

## Entity Alignment

| Entity | Expected by v3 | Existing backend file | Status | Required action | Risk |
|---|---|---|---|---|---|
| Customer | Canonical customer identity scoped by `businessSlug`; reusable by normalized phone when present. | `backend/src/models/Customer.model.ts`, `backend/src/routes/customers.routes.ts`, `backend/src/controllers/customers.controller.ts` | REUSE_EXISTING | Reuse model; implement `demoTest` service semantics around required `businessSlug`, required name, and `businessSlug + normalized phone` reuse. | Current model is intentionally loose (`strict: false`), so service validation must own required semantics. |
| ManagedEntity | Canonical customer-owned subject such as vehicle, dessert request, or other managed item. | `backend/src/models/ManagedEntity.model.ts`, `backend/src/routes/managedEntities.routes.ts`, `backend/src/controllers/managedEntities.controller.ts` | REUSE_EXISTING | Reuse model; implement service checks that `customerId` exists and entity belongs to same `businessSlug`. | Legacy-style data may be embedded/flexible; avoid embedding new managed entities inside `Customer` for canonical flow. |
| Case | Operational root for Pack 0 flow. | `backend/src/models/Case.model.ts`, `backend/src/routes/cases.routes.ts`, `backend/src/controllers/cases.controller.ts`, `backend/src/controllers/relational.controller.ts` | REUSE_EXISTING | Reuse model; implement service-generated deterministic `caseNumber` and status rules by vertical. | Existing `workflowData.service.ts` creates Turagua/manual cases directly; new demoTest services must avoid making Cita or appointment the root. |
| Appointment | Customer-facing scheduled appointment linked to case, customer, managed entity, and reservation. | `backend/src/models/Appointment.model.ts`, `backend/src/routes/appointments.routes.ts`, `backend/src/controllers/appointments.controller.ts` | ADAPT_WITHOUT_BREAKING | Reuse model and add service-level requirement that scheduled appointments must reference `resourceReservationId`; start/end must match reservation. | Current interface only requires `scheduledStart`; `strict: false` allows extra fields, so missing service validation can create incomplete appointments. |
| TimelineEvent | Audit/history record for important state changes. | `backend/src/models/TimelineEvent.model.ts`, `backend/src/routes/timelineEvents.routes.ts`, `backend/src/controllers/timelineEvents.controller.ts`, `backend/src/controllers/relational.controller.ts` | REUSE_EXISTING | Reuse model; add typed demoTest event contract and case timeline listing service. | Timeline currently can be written as generic CRUD. Later orchestration must decide warning behavior after appointment/reservation are already booked. |
| CatalogOffering | Canonical service/offering metadata; may provide fulfillment policy for duration/team/granularity. | `backend/src/models/CatalogOffering.model.ts`, `backend/src/routes/catalogOfferings.routes.ts`, `backend/src/services/seed.service.ts` | REUSE_EXISTING | Reuse model; use `fulfillmentPolicy.suggestedTeamId`, `estimatedDurationMinutes`, and `slotGranularityMinutes` when present. | Current schema is flexible; offering policy must be validated in services before scheduling. |
| WorkTeam | Active operational capacity owner. | `backend/src/models/WorkTeam.model.ts`, `backend/src/routes/workTeams.routes.ts` | REUSE_EXISTING | Reuse model; availability and reservations must load active `WorkTeam` by `businessSlug + teamId`. | Existing seed data is Turagua-first; demo_test seed is still missing. |
| WorkTeamScheduleRule | Recurring work windows by weekday/team. | `backend/src/models/WorkTeamScheduleRule.model.ts`, `backend/src/routes/workTeamScheduleRules.routes.ts` | REUSE_EXISTING | Reuse model; availability must calculate base windows from active rules. | Existing `teamAvailability.service.ts` contains useful logic but is catalog/slotId oriented and should be adapted carefully. |
| WorkTeamScheduleOverride | Date-specific block/replace/extend windows. | `backend/src/models/WorkTeamScheduleOverride.model.ts`, `backend/src/routes/workTeamScheduleOverrides.routes.ts` | REUSE_EXISTING | Reuse model; enforce `block`, `replace`, and `extend` semantics in availability service. | Multiple overrides order must be explicit in later implementation. |
| ResourceReservation | Real capacity block against required micro-slots. | `backend/src/models/ResourceReservation.model.ts`, `backend/src/routes/resourceReservations.routes.ts`, `backend/src/services/teamAvailability.service.ts` | ADAPT_WITHOUT_BREAKING | Reuse model; implement held/booked/released lifecycle and capacity-aware double-booking checks by `slotKeys`. | Current `reserveTeamCapacity` creates `booked` directly and uses unique slotKeys; later service must support `held -> booked` and capacity > 1 counting. |

## Existing Backend Shape Inspected

- Current backend is TypeScript under `backend/src`, with Express mounted at `/api/v1` in `backend/src/app.ts`.
- Existing REST CRUD routes are present for customers, managed entities, cases, appointments, timeline events, catalog offerings, work teams, schedule rules, overrides, and resource reservations.
- Existing controllers mostly use generic CRUD via `BaseCrudService`, while `relational.controller.ts` exposes relationship reads such as case timeline and case appointments.
- Existing `teamAvailability.service.ts` already calculates slots from `WorkTeam`, `WorkTeamScheduleRule`, `WorkTeamScheduleOverride`, and blocking `ResourceReservation` states. It currently works through `catalogOfferingId + slotId` and creates reservations as `booked` directly.
- Existing `workflowData.service.ts` performs a Turagua/manual all-in-one customer/entity/case/reservation/appointment/timeline flow. It is useful as reference and compatibility, but should not become the canonical Pack 0 implementation because it mixes orchestration and persistence in one service and assumes Turagua-specific semantics.
- Existing Temporal files are present under `backend/src/temporal`. Activities call HTTP endpoints under `/api/v1/workflow-data`; the workflow should be prepared later to use the new domain services indirectly, after manual API stability.
- No `Cliente`, `Servicio`, `Producto`, `Team`, `Trabajador`, `caseService`, or `quoteService` files were found in the current TypeScript source tree. Legacy `Cita` concepts appear through `Appointment` and workflow naming, not as a separate canonical model in this repo.

## PR-002 Skeleton Direction

The next files may be added under `backend/src/services/demoTest/` but must remain non-mounted until review:

- `customer.service.ts`
- `managedEntity.service.ts`
- `case.service.ts`
- `availability.service.ts`
- `resourceReservation.service.ts`
- `appointment.service.ts`
- `timeline.service.ts`
- semantic error helpers

These skeletons must define the future ContractMK1 service boundary only. They must not change route mounts, existing CRUD behavior, Temporal behavior, seed behavior, or scheduling logic in this guarded block.
