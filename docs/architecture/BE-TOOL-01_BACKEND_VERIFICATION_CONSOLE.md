# BE-TOOL-01 - Backend Verification Console and API Test Pack

Date: 2026-07-10
Workspace: `C:\Users\eduar\Desktop\ai-integrations\demo_test`
Status: Ready for implementation

Execution state:

```text
BE-ADR-01    CLOSED
BE-FIX-01    CLOSED
BE-ADR-02    CLOSED
BE-CORE-01   CLOSED
BE-CORE-02   CLOSED
BE-TOOL-01   READY FOR IMPLEMENTATION
BE-CORE-03   BLOCKED BY SEQUENCE
```

## Decision

Do not continue with `BE-CORE-03` until the backend has a comfortable verification surface beyond Postman.

`BE-TOOL-01` introduces two complementary surfaces:

- a backend API integration test pack that proves the full public `/api/demo-test` flow end to end;
- a lightweight verification console that lets a developer manually exercise the same contract and inspect IDs, headers, timeline, replay behavior, and semantic errors.

This unit is intentionally a tool and verification layer. It must not change the canonical domain model, add a parallel workflow engine, or make Temporal the only way to prove scheduling.

## Why This Comes Before BE-CORE-03

The backend now has enough architecture to need a practical proof surface:

- `ExecutionContext` exists and is propagated through `/api/demo-test`.
- `SemanticError` and the central error middleware define the error envelope.
- `IdempotencyRecord` protects persistent command idempotency.
- Scheduling distinguishes `DOUBLE_BOOKING_CONFLICT` from `NO_AVAILABILITY`.
- `Appointment` is the booking-facing record.
- `ResourceReservation` is the operational capacity blocker.
- Timeline events carry execution metadata.

Adding command handlers, state transitions, and compensation boundaries before this tool would increase architecture without improving day-to-day observability. `BE-TOOL-01` makes the existing contract visible first.

## Canonical Flow To Prove

The verification pack and console must exercise this flow through public API calls:

```text
Customer
-> ManagedEntity
-> Case
-> Availability
-> Schedule Consultation
-> Timeline
```

The canonical HTTP boundary is `/api/demo-test`. Direct service calls are allowed inside lower-level tests, but this unit's main value is proving what the frontend will consume.

## Required Scenarios

### 1. Happy Path

Create a complete neutral `demo_test` case and schedule a consultation.

Required evidence:

- created `customerId`;
- created `managedEntityId`;
- created `caseId`;
- selected `teamId`;
- selected `catalogOfferingId`;
- selected `startAt`;
- created `appointmentId`;
- created `resourceReservationId`;
- returned `X-Correlation-Id`;
- returned `X-Causation-Id`;
- returned `Idempotency-Key` for scheduled write;
- timeline contains the scheduling events for the case.

### 2. Idempotent Replay

Repeat `POST /api/demo-test/schedule-consultation` with the same body and the same `Idempotency-Key`.

Expected result:

- the same `appointmentId` is returned;
- the same `resourceReservationId` is returned;
- no duplicate business timeline events are created;
- replay remains successful through the public API boundary.

### 3. Idempotency Conflict

Repeat `POST /api/demo-test/schedule-consultation` with the same `Idempotency-Key` and a different semantic scheduling payload.

Expected result:

```text
IDEMPOTENCY_CONFLICT
```

Required evidence:

- `ok=false`;
- semantic error envelope;
- `context.correlationId`;
- `context.causationId`;
- response headers still expose correlation data.

### 4. Double Booking Conflict

Try to book the same occupied slot with a different `Idempotency-Key`.

Expected result:

```text
DOUBLE_BOOKING_CONFLICT
```

This proves the occupied capacity path is not collapsed into generic no-availability behavior.

### 5. No Availability

Request scheduling or availability outside a valid capacity window.

Expected result:

```text
NO_AVAILABILITY
```

This must remain distinct from `DOUBLE_BOOKING_CONFLICT`.

### 6. Missing Idempotency Key

Call `POST /api/demo-test/schedule-consultation` without `Idempotency-Key`.

Expected result:

```text
IDEMPOTENCY_KEY_REQUIRED
```

Public scheduling writes must not silently generate random idempotency keys.

### 7. Timeline And Execution Metadata

Fetch `GET /api/demo-test/cases/:caseId/timeline`.

Required evidence:

- timeline belongs to the created case;
- scheduling events are present;
- events expose execution metadata produced by `ExecutionContext`;
- at least one event can be traced back to the schedule request's idempotency key and correlation ID.

## API Test Pack

Add a backend script with this working name:

```text
backend/src/tests/demoTest/api-verification-pack.ts
```

Add an npm script:

```json
"test:demo-test:api-pack": "tsx src/tests/demoTest/api-verification-pack.ts"
```

The test pack should:

- start from a configured API base URL, defaulting to `http://localhost:4000`;
- connect to Mongo only for setup/inspection when necessary;
- seed `demo_test` before running;
- create unique test data using a `testRunId`;
- print a compact verification report;
- return non-zero exit code for real contract failures;
- treat unavailable backend/Mongo as a blocked verification, matching the style of existing demoTest tests.

Required environment variables:

```text
DEMO_TEST_API_BASE_URL=http://localhost:4000
DEMO_TEST_BUSINESS_SLUG=demo_test
DEMO_TEST_TIMEZONE=America/Lima
MONGO_URI=mongodb://localhost:27017/vtkall_be_tool_01?authSource=admin
```

The pack should prefer an isolated Mongo database for mutation evidence.

## Verification Console

Add a developer-facing console under the backend, with this working path:

```text
backend/src/scripts/demoTestVerificationConsole.ts
```

Add an npm script:

```json
"demo-test:console": "tsx src/scripts/demoTestVerificationConsole.ts"
```

The first implementation can be terminal-based. A browser UI is useful later, but not required for BE-TOOL-01.

Minimum commands:

```text
happy-path
replay
idempotency-conflict
double-booking
no-availability
missing-idempotency-key
timeline
full
```

The `full` command must run the full canonical flow and all negative scenarios.

Every console scenario must be independently executable. A user must not need to run `happy-path` before running another command.

Scenario setup rules:

```text
happy-path
  -> always creates its own scenario.

replay
  -> automatically creates a happy path, then repeats scheduling.

idempotency-conflict
  -> automatically creates the base scenario, then modifies the payload.

double-booking
  -> automatically creates the first reservation, then retries the occupied slot with another key.

timeline
  -> creates a case with scheduling when no caseId is provided.

full
  -> shares one base scenario only when doing so is contract-safe.
```

Minimum output:

```text
testRunId
businessSlug
apiBaseUrl
correlationId
causationId
idempotencyKey
customerId
managedEntityId
caseId
teamId
catalogOfferingId
appointmentId
resourceReservationId
timelineEventCount
semanticErrorCode
```

The console should print copyable curl commands for failed steps when useful, but the console itself is the primary tool.

## Exit Codes

Both the API pack and console must use explicit exit codes:

```text
0 = PASS
1 = CONTRACT FAILURE
2 = BLOCKED BY ENVIRONMENT
```

Examples of environment-blocked verification:

- backend unavailable;
- Mongo unavailable;
- seed impossible because of infrastructure;
- connection refused;
- environment timeout.

Examples of contract failure:

- replay returns a different `Appointment`;
- `X-Correlation-Id` is missing;
- double booking returns `NO_AVAILABILITY`;
- timeline duplicates events during replay;
- missing idempotency key does not return `IDEMPOTENCY_KEY_REQUIRED`.

This separation is required so future CI can distinguish infrastructure absence from real contract regressions.

## Evidence Authority

Public API evidence is authoritative for this unit.

The primary assertions must use what a consumer can observe:

- HTTP status;
- response headers;
- response envelope;
- IDs;
- replay behavior;
- semantic error codes;
- public timeline.

Mongo may be used only for:

- seed;
- controlled preparation;
- complementary duplicate checks;
- diagnostics when the API response is insufficient.

A scenario must not pass only because Mongo contains expected documents if the API response violates the public contract.

## Replay Duplicate Proof

Replay verification must compare observable state before and after the replay:

```text
timelineBeforeReplay
appointmentIdOriginal
resourceReservationIdOriginal

-> execute replay

timelineAfterReplay
appointmentIdReplay
resourceReservationIdReplay
```

Required assertions:

```text
appointmentIdReplay === appointmentIdOriginal
resourceReservationIdReplay === resourceReservationIdOriginal
timelineAfterReplay.length === timelineBeforeReplay.length
```

Complementary Mongo inspection, when available:

```text
Appointment count for idempotencyKey       = 1
related ResourceReservation count          = 1
terminal IdempotencyRecord count           = 1
```

## Frontend Contract Notes For F8

`F8 - Appointment lifecycle` should not start backend integration until `BE-TOOL-01` confirms the API behavior below:

- `apiDemoTestRepository.scheduleConsultation` must send `Idempotency-Key` as an HTTP header, not only as JSON payload.
- API mode must preserve and surface semantic error codes from the backend envelope.
- The frontend should be able to show created IDs and timeline updates without Postman.
- `Appointment` remains the user-facing appointment result.
- `ResourceReservation` remains internal capacity proof, but the console should expose its ID for verification.

## Guardrail Expectations

This unit must not weaken the current architecture guardrails.

Run these before closing the unit:

```bash
npm run build
npm run test:demo-test:guardrails
npm run test:demo-test:guardrails:self
npm run test:demo-test:compatibility
npm run test:demo-test:core
npm run test:demo-test:idempotency
npm run test:demo-test:seed
npm run test:demo-test:smoke
npm run test:demo-test:api-pack
```

For mutation-heavy checks, use an isolated `MONGO_URI`.

## Acceptance Criteria

`BE-TOOL-01` is complete only when:

- the backend API test pack proves the full public API flow;
- the console can run the same flow without Postman;
- every console scenario is independently executable from zero prepared IDs;
- exit codes distinguish pass, contract failure, and environment blocker;
- public API evidence is authoritative and Mongo inspection remains complementary;
- replay compares IDs and timeline counts before and after;
- happy path, replay, idempotency conflict, double booking, no availability, missing idempotency key, headers, IDs, and timeline are visible;
- the console and test pack use `demo_test` as the default business slug;
- the implementation does not create a new model layer or alternate scheduling path;
- the final report documents the exact commands run and whether any verification was blocked by local services.

## Out Of Scope

- `BE-CORE-03` command handlers and compensation boundaries.
- Temporal workflow neutralization.
- A polished browser admin console.
- Replacing the frontend F8 flow.
- Changing the data model.
- Adding Redis, queues, message bus, or distributed transactions.

## Next Order After Completion

After `BE-TOOL-01` passes, resume in this order:

```text
1. Connect F8 to the real backend API
2. BE-CORE-03 command handlers, state transitions, and compensation boundaries
3. Temporal neutralization
```
