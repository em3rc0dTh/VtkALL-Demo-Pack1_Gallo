# Backend Guardrail Rules

## Purpose

`npm run test:demo-test:guardrails` validates the backend architecture boundaries from ADR-001, ADR-002, ContractMK1, and the v3 timeslots data model.

The suite protects architecture, not historical file placement. It should evolve by adding focused rules and explicit temporary exceptions, not by freezing the current implementation forever.

## How To Run

```bash
npm run test:demo-test:guardrails
npm run test:demo-test:guardrails -- --verbose
npm run test:demo-test:guardrails -- --rule GR-01
npm run test:demo-test:guardrails:self
```

The static guardrails do not require MongoDB or Temporal runtime.

## Migrated Temporary Rules

| Previous rule | Status | Replacement |
| --- | --- | --- |
| No `DemoCustomer` / `DemoCase` style parallel canonical entities | Keep | GR-09 and model access checks preserve Case-centered architecture and reject parallel roots by structure. |
| `ResourceReservation` must not use `confirmed` | Keep | GR-05 and GR-06 protect `held` / `booked` as blocking statuses. |
| No model/seed changes during early stabilization | Replace | BE-FIX-01 required legitimate seed/model evolution; permanent checks now validate architecture instead of banning model evolution. |
| Temporal Activities use demoTest services, not workflow-data HTTP | Keep | GR-02 and GR-14 protect this. |
| `/api/demo-test` error envelope remains normalized | Keep | GR-08 protects semantic errors and controller raw-error leakage. |

## Rule Inventory

| Rule | Decision protected | Allowed | Forbidden | Mechanism |
| --- | --- | --- | --- | --- |
| GR-01 Temporal Workflow purity | Temporal orchestrates but does not persist or call infrastructure. | `@temporalio/workflow`, workflow-local types, Activity declarations. | Mongoose, models, db modules, routes/controllers, filesystem, HTTP clients, Odoo clients. | Import scanner over `backend/src/temporal/workflows`. |
| GR-02 Temporal Activity boundary | Activities call services/ports and do not become workflows or legacy HTTP clients. | demoTest services, timeline service, future ports. | Workflow imports, `/api/v1/workflow-data`, `WORKFLOW_API_BASE_URL`. | Import and content scanner over Activity files. |
| GR-03 Domain service authority | Controllers/routes delegate domain work. | Service imports. | Mongoose model imports from API layer. | Import scanner over controllers/routes. |
| GR-04 Model access restrictions | Models stay out of forbidden layers. | Services, repositories, scripts, tests. | Workflows, frontend, route definitions, platform ports/adapters. | Import scanner over forbidden layers. |
| GR-05 Scheduling invariant | Appointment schedules; ResourceReservation blocks capacity. | Reservation-backed scheduling for time-slot appointments. | Appointment-only capacity blocking. | Structural checks on Appointment, ResourceReservation, availability, scheduling service. |
| GR-06 Double-booking protection | Blocking reservations retain DB conflict protection. | Unique partial index over capacity key for `held`/`booked`. | Raw Mongo duplicate leakage or non-semantic errors. | Model index and service mapper inspection. |
| GR-07 Availability authority | Availability comes from team schedules, overrides, reservations, and offering policy. | `AvailabilitySlot` fixtures/adapters only. | New authoritative scheduling over `AvailabilitySlot` or `Appointment`. | Scoped content scanner and dependency checks. |
| GR-08 Stable semantic errors | API keeps stable error contract. | `SemanticError`, central registry, `DemoTestDomainError` bridge. | Raw arbitrary controller errors, all scheduling failures collapsed to one code, parallel error authorities. | Error registry, envelope serializer, and controller scanner. |
| GR-09 Case-centered architecture | Case remains operational root. | Entities referencing `caseId` as they enter codebase. | Appointment-rooted operational aggregate. | Model metadata checks for implemented models. |
| GR-10 Timeline ownership | Timeline writes go through one service and carry execution metadata. | Timeline service, seed/migration/test code. | Direct `TimelineEvent.create` elsewhere or timeline writes without `execution.correlationId`. | Content scanner with narrow allowlist plus timeline service metadata inspection. |
| GR-11 Odoo isolation | External systems are accessed only through ports/adapters. | Future `platform/adapters/odoo` or `integrations/odoo-adapter`. | Direct XML-RPC/JSON-RPC/Odoo model calls in app/domain/frontend/workflows. | Non-doc content scanner. |
| GR-12 GoDigital Core isolation | GoDigital internals stay outside demoTest/vertical code. | `GoDigitalCapabilityPort`, docs, disabled flags. | Implementation-specific GoDigital logic in domain/controllers/models/workflows. | Non-doc content scanner. |
| GR-13 Frontend leakage | Frontend presents and collects only. | API client code. | Backend models/db, Temporal SDKs, Mongoose, Mongo drivers. | Frontend import scanner. |
| GR-14 Configuration hygiene | Active config and execution context propagation are explicit. | `TEMPORAL_ADDRESS=host:port`; `/api/demo-test` middleware; Temporal Activity context metadata. | URL-form Temporal address in examples; active demoTest dependency on `WORKFLOW_API_BASE_URL`; missing execution context middleware. | Config/source scanners and Activity context inspection. |
| GR-15 Seed separation | `demo_test` is neutral; `turagua` is vertical. | Neutral generic fixture and Turagua automotive fixture. | Vehicle/Iris/mechanic requirements in neutral seed metadata. | Seed metadata inspection. |
| GR-16 Documentation presence | Mandatory architecture references are readable and mapped. | Docs index mapping canonical names to paths. | Missing ADR/contract/model/use-case/audit/guardrail references. | Docs presence and README mapping checks. |
| GR-17 Persistent command idempotency | Write retries are protected by Mongo-backed command records. | `IdempotencyRecord`, `executeIdempotentCommand`, stable Temporal keys. | In-memory idempotency maps, random Activity-attempt keys, scheduling without required key. | Model/service/source scanner and self-test fixtures. |

## Known Temporary Exceptions

| File | Rule | Reason | Expiry condition |
| --- | --- | --- | --- |
| `backend/src/controllers/*` legacy CRUD controllers listed in GR-03 | GR-03 | Existing `/api/v1` CRUD controllers predate the demoTest service boundary and still instantiate generic CRUD services from models. | Remove file-by-file as each controller moves behind application/domain services. New controllers are not exempt. |
| `backend/src/temporal/activities/scheduleConsultation.activities.ts` | GR-02 | Current Activity reads `CatalogOffering` and `ManagedEntity` while catalog/profile services mature. | Remove when CatalogOffering/ManagedEntity read operations are exposed through application services or ports. |
| `backend/src/controllers/crud.factory.ts` | GR-08 | Legacy generic CRUD factory uses older response helpers outside the demoTest boundary. | Remove or adapt when `/api/v1` legacy CRUD is versioned behind the new semantic error contract. |

## Adding A Rule

1. Add a file under `backend/src/scripts/guardrails/rules`.
2. Export a `GuardrailRule` with a stable `GR-##` ID.
3. Register it in `backend/src/scripts/guardrails/rules/index.ts`.
4. Add at least one self-test fixture in `backend/src/scripts/guardrails/selfTest.ts`.
5. Update this document with intent, allowed/forbidden dependencies, mechanism, and temporary exceptions.

## Interpreting Failures

Each failure prints:

```text
file:line
GR-## violation: boundary explanation.
Evidence: offending import or snippet
```

Fix the architecture violation in production code when possible. If the current implementation must keep a temporary exception, add a narrow file-level exception in the relevant rule and document the reason and expiry condition here.
