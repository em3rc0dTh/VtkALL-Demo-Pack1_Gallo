# Backend Current State Audit - BE-ADR-01 / B0

Date: 2026-07-10
Audited commit: `a62cb6be7a1eb639e25cb68781d61d79eee84d45`
Workspace: `C:\Users\eduar\Desktop\ai-integrations\demo_test`

## Scope

This audit implements the B0 baseline requested in the backend implementation plan before changing runtime design.

Mandatory documents reviewed:

- `docs/architecture/ADR-001.md`
- `docs/architecture/ADR-002.md`
- `docs/contracts/ContractMK1 (2).md`
- `docs/data-model/DATA_MODEL_VTKALL_DataModel-0_v3_timeslots.md`
- `docs/use-cases/USE_CASES_VTKALL_DEMO_PACK_1_2.md`

Filename mismatch observed: the plan references `ADR-001-Temporal-Orchestrator.md`, `ADR-002-Lite-Thread-Platform-Boundary.md`, and `ContractMK1.md`, while this checkout currently contains the files listed above. The content matches the intended architecture themes, but the filenames should be normalized or documented in the next PR.

## Baseline Commands

All commands below were run from `backend` unless noted.

| Command | Result | Notes |
| --- | --- | --- |
| `npm ci` | Passed | Installed 304 packages. `glob@11.1.0` emitted a deprecation/security warning. |
| `npm run build` | Passed | TypeScript compiled successfully. Generated `backend/dist` output was restored after verification so the audit PR stays source/doc focused. |
| `npm run test:demo-test:guardrails` | Passed | Current guardrails passed. They are still the initial stabilization guardrails, not the permanent B1 architecture suite. |
| `npm run test:demo-test:seed` | Passed | Connected to local Mongo. For default `businessSlug=demo_test`, seed was not sufficient: all inspected operational collections returned count `0`. |
| `npm run test:demo-test:smoke` | Skipped as designed | Without `DEMO_TEST_ALLOW_WRITES=true`, the smoke prints the opt-in message and does not write DB data. |

## Isolated Write Smoke

To avoid writing into the normal database, an isolated database was used:

```text
MONGO_URI=mongodb://localhost:27017/vtkall_b0_audit_20260710?authSource=admin
```

The existing seed loads Turagua data, not `demo_test` data, so the write smoke was run with:

```text
DEMO_TEST_BUSINESS_SLUG=turagua
DEMO_TEST_ALLOW_WRITES=true
```

Seed into the isolated database passed:

- `businessProfiles`: 1
- `catalogOfferings`: 3
- `customers`: 3
- `managedEntities`: 3
- `cases`: 3
- `customerInteractions`: 5
- `appointments`: 3
- `decisionRecords`: 2
- `notifications`: 3
- `timelineEvents`: 8
- `availabilitySlots`: 7
- `workTeams`: 3
- `workTeamScheduleRules`: 6
- `workTeamScheduleOverrides`: 2
- `resourceReservations`: 0

Seed inspection on the isolated database passed for `businessSlug=turagua` and reported seed sufficient.

The write smoke failed after creating a booked reservation:

```text
Expected DOUBLE_BOOKING_CONFLICT
Actual NO_AVAILABILITY
```

Created reservation evidence:

```text
resourceReservationId: res_86715b1b-8047-4919-9dc0-0b4af3ac13e0
teamId: team_mechanics
status: booked
appointmentId: appt_9756a6ac-483e-496b-a7ec-22fdf7e58a76
workflowId: pr007_smoke:pr007_1783700740088_c139a0ac
slotKeys:
  team_mechanics:2026-07-10T14:00:00.000Z
  team_mechanics:2026-07-10T14:15:00.000Z
  team_mechanics:2026-07-10T14:30:00.000Z
  team_mechanics:2026-07-10T14:45:00.000Z
```

Interpretation: the system blocks the selected capacity, but the API/service error contract for a second booking attempt currently returns `NO_AVAILABILITY` rather than the stricter `DOUBLE_BOOKING_CONFLICT` expected by the smoke.

No cleanup or reset was performed.

## Temporal Baseline

Temporal worker command tested with:

```text
TEMPORAL_ADDRESS=localhost:7233
MONGO_URI=mongodb://localhost:27017/vtkall_b0_audit_20260710?authSource=admin
npm run temporal:worker
```

Result:

- MongoDB connection succeeded.
- Temporal connection failed with `tcp connect error, 127.0.0.1:7233, ConnectionRefused`.
- Direct Temporal client connection also failed with `Failed to connect before the deadline`.
- `docker` command is not available in this shell, so container status could not be verified from the local CLI.

Temporal code review findings:

- `ScheduleConsultationWorkflow` still defaults `businessSlug` to `turagua`.
- Required fields still include vehicle-specific fields such as `vehiclePlate`, `vehicleBrand`, `vehicleModel`, and `vehicleYear`.
- Activity source metadata still references `temporal_schedule_consultation_workflow`.
- The workflow uses demoTest services through Activities and does not import Mongoose models in the workflow file itself.
- `reserveAppointmentActivity` uses `maximumAttempts: 1`, matching the earlier retry-safety rule for booking side effects.

## Mongo Indexes Observed

Indexes observed in `vtkall_b0_audit_20260710` after seed and smoke:

- `workteams`: `_id_`, `businessSlug_1`, `businessSlug_1_active_1`, `businessSlug_1_type_1`
- `workteamschedulerules`: `_id_`, `businessSlug_1`, `teamId_1`, `businessSlug_1_teamId_1_weekday_1_active_1`
- `workteamscheduleoverrides`: `_id_`, `businessSlug_1`, `teamId_1`, `businessSlug_1_teamId_1_date_1_active_1`
- `catalogofferings`: `_id_`, `businessSlug_1`
- `resourcereservations`: `_id_`, `businessSlug_1`, `teamId_1`, `catalogOfferingId_1`, `businessSlug_1_teamId_1_status_1_startAt_1`, `businessSlug_1_appointmentId_1`, unique partial `businessSlug_1_teamId_1_slotKeys_1` for `status in ["held", "booked"]`
- `appointments`: `_id_`, `businessSlug_1`, `businessSlug_1_caseId_1`, `businessSlug_1_scheduledStart_1`, `businessSlug_1_status_1`
- `cases`: `_id_`, `businessSlug_1`, `businessSlug_1_caseNumber_1`, `businessSlug_1_customerId_1`, `businessSlug_1_managedEntityId_1`, `businessSlug_1_status_1`
- `timelineevents`: `_id_`, `businessSlug_1`, `businessSlug_1_caseId_1_createdAt_1`

Index gap: `TimelineEvent` uses `createdAt: 1`, while the v3 model recommends `createdAt: -1` for case timeline reads. `CatalogOffering` also lacks the fuller operational indexes implied by the next catalog phase.

## Conflicts And Risks

1. Seed namespace conflict: B0 plan frames the baseline as `demo_test`, but the current seed data is Turagua-only. Default seed inspection for `demo_test` is not sufficient.
2. Error contract drift: double-booking behavior blocks capacity, but the service reports `NO_AVAILABILITY` where the smoke expects `DOUBLE_BOOKING_CONFLICT`.
3. Temporal environment unavailable: Temporal is not reachable on `localhost:7233`, and Docker is unavailable from this shell.
4. Temporal neutrality gap: the current workflow is still vehicle/Turagua-specific and does not yet match the neutral B6 input/state/signal model.
5. `.env.example` has `TEMPORAL_ADDRESS=http://localhost:7233`; Temporal SDK connection examples in this repo work with `localhost:7233` style addresses.
6. Current guardrails are useful but incomplete for the permanent B1 architecture boundary list.
7. `WORKFLOW_API_BASE_URL` remains a legacy `/api/v1` value in `.env.example`; current activities use demoTest services directly, but the env name can mislead future implementation.

## Prioritized Debt

P0:

- Decide whether the canonical B0 seed slug is `demo_test` or whether Turagua remains the only seed profile for now.
- Fix or explicitly version the scheduling error contract: same-slot retry should produce a stable semantic conflict response.
- Make Temporal startup reproducible through Docker or a documented local prerequisite.

P1:

- Replace the temporary static guardrail with the permanent architecture guardrail suite requested in B1.
- Normalize mandatory documentation filenames or add a docs index that maps canonical names to current files.
- Remove Turagua/vehicle defaults from `ScheduleConsultationWorkflow` during B6.

P2:

- Expand Mongo indexes for timeline and catalog read paths.
- Decide whether generated `backend/dist` should remain tracked; build verification currently dirties it.
- Address the `glob@11.1.0` npm warning when dependency upgrades are in scope.

## Recommendation

Proceed next with `BE-ADR-02 Permanent architecture guardrails`, but include one small compatibility decision first: whether B1 should enforce `demo_test` as a seedable `businessSlug`, or whether the current Turagua seed remains the accepted Pack 0 fixture until catalog/profile work lands.

## BE-FIX-01 Resolution - Baseline Compatibility Corrections

Date: 2026-07-10

Canonical seed namespace decision:

- `demo_test` is the canonical laboratory `businessSlug`.
- `turagua` remains the automotive vertical fixture.
- The seed command now supports both namespaces. By default it seeds both; `SEED_BUSINESS_SLUG=demo_test` or `SEED_BUSINESS_SLUG=turagua` can be used for explicit selection.

Corrections applied:

- Added a neutral `demo_test` seed with `BusinessProfile`, `CatalogOffering`, `WorkTeam`, and `WorkTeamScheduleRule`.
- Preserved the existing Turagua fixture and enriched seed flow.
- Added `consultation` as a valid `WorkTeam.type` for the neutral laboratory team.
- Updated smoke data so `demo_test` uses `ManagedEntity.type=other` and `verticalType=generic_service`, while Turagua remains vehicle-specific.
- Tightened duplicate-key mapping so only the blocking `ResourceReservation` index maps to `DOUBLE_BOOKING_CONFLICT`.
- Preserved `NO_AVAILABILITY` for requests outside valid schedule/capacity windows.
- Added `TEMPORAL_ADDRESS` validation requiring `host:port` format and rejecting `http://...` / `https://...`.
- Updated `.env.example` to `TEMPORAL_ADDRESS=localhost:7233`.
- Marked `WORKFLOW_API_BASE_URL` as legacy because the current demoTest Temporal Activity path calls services directly.

Regression coverage added:

- `test:demo-test:compatibility` verifies neutral seed idempotence, seed sufficiency for `demo_test` and `turagua`, invalid Temporal URL rejection, and that unrelated duplicate-key errors are not mapped to double booking.
- `test:demo-test:seed` now inspects both `demo_test` and `turagua` unless `DEMO_TEST_BUSINESS_SLUG` is set.
- `test:demo-test:smoke` now verifies first booking succeeds, same-slot repeat returns `DOUBLE_BOOKING_CONFLICT`, and a genuinely unavailable schedule returns `NO_AVAILABILITY`.

Remaining blockers:

- Temporal runtime availability was not changed in this unit; local Temporal still requires the appropriate service/container to be running.
- Full workflow neutralization remains out of scope for BE-FIX-01 and belongs to a later Temporal unit.

## BE-CORE-01 Resolution - Semantic Errors, Execution Context, and Idempotency Boundary

Date: 2026-07-10

Contract decision:

- `ExecutionContext` is the canonical execution metadata carrier for `/api/demo-test`, demoTest write services, Temporal Activities, and TimelineEvent writes.
- `SemanticError` plus `semanticErrorRegistry` is the canonical error authority. `DemoTestDomainError` remains only as a compatibility bridge.
- `Idempotency-Key` is validated and propagated in MK1; no replay cache or persistent idempotency ledger was introduced.

Runtime corrections applied:

- Added `/api/demo-test` execution-context middleware that reads or generates `X-Correlation-Id`, `X-Causation-Id`, and validates `Idempotency-Key`.
- Added `/api/demo-test` semantic error middleware with stable `{ ok:false, error, context }` envelope.
- Removed manual demoTest controller error serialization and passed context through the active demoTest endpoint set.
- Updated write services to accept optional `ExecutionContext` as a second argument without accepting Express request/response objects.
- Updated `recordTimelineEvent` so TimelineEvent writes include `execution` metadata and derive actor from context when needed.
- Updated Temporal Activities to create `channel=temporal` context with workflow/activity metadata, while preserving `maximumAttempts: 1` for the booking Activity.

Regression coverage added:

- `test:demo-test:core` validates idempotency-key normalization, HTTP context middleware, semantic error envelopes, and TimelineEvent execution metadata persistence when Mongo is reachable.
- GR-08 now protects the central semantic error registry/envelope and rejects manual demoTest controller error serialization.
- GR-10 now protects TimelineEvent execution metadata.
- GR-14 now protects `/api/demo-test` middleware mounting and Temporal Activity context propagation.

Remaining blockers:

- Temporal runtime execution is still not required or started by this unit.
- Persistent idempotency behavior remains intentionally out of scope until a later storage-backed idempotency ADR/unit.

## BE-CORE-02 Resolution - Persistent Command Idempotency and Safe Replay

Date: 2026-07-10

Contract decision:

- `IdempotencyRecord` is the Mongo source of truth for command idempotency in `demo_test`.
- Unique identity is `businessSlug + scope + idempotencyKey`.
- Request fingerprints are deterministic and exclude execution-only metadata.
- `consultation.schedule` requires an idempotency key. Customer, managed-entity, and case creation use persistent idempotency when a key is supplied and remain compatible without one.

Runtime corrections applied:

- Added `IdempotencyRecord` with processing/succeeded/failed states, owner token, lease expiry, attempts, result, failure, and execution metadata.
- Added central `executeIdempotentCommand` with fingerprint comparison, active lease protection, expired lease takeover, success replay, final failure replay, and retryable failure support.
- Added scheduling reconciliation using `Appointment.workflow.idempotencyKey` and linked `ResourceReservation`.
- Wrapped `scheduleConsultation` as required-key `consultation.schedule`.
- Wrapped customer, managed-entity, and case creation at service layer for optional persistent idempotency.
- Required `Idempotency-Key` header for public `POST /api/demo-test/schedule-consultation`.
- Updated Temporal scheduling Activity to use stable key `schedule-consultation:<caseId>:<slotStartIso>`.

Regression coverage added:

- `test:demo-test:idempotency` verifies unique index presence, deterministic fingerprints, same-key replay, same-key conflict, different-key double booking, concurrent same-key execution, active/expired lease behavior, missing-key scheduling, and failed-final replay.
- GR-17 protects persistent idempotency model/service boundaries, stable Temporal keys, and rejection of in-memory idempotency caches.

Remaining limitations:

- No destructive TTL index is enabled in this unit.
- No Redis/distributed transaction/message bus/outbox was introduced.
- Temporal runtime execution remains outside this verification unit.
