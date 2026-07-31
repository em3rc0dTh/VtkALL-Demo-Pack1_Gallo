# HERMES-04 Conversation Context Report

Date: 2026-07-17

Status: HERMES-04 closed. HERMES-04A-R1, HERMES-04B, HERMES-04C, and HERMES-04D passed against real MongoDB.

## Summary

HERMES-04 was started in the required order. The codebase now has the H04 conversation contract, central interaction service extensions, read-only context builder, redaction policy, H04 guardrails, and the Mongo readiness gate.

HERMES-04A-R1 recovered Mongo authentication without adding alternate persistence, file fallback, JSON storage, SQLite, frontend changes, Temporal changes, or new Hermes runtime functionality. HERMES-04B/C/D then verified conversation persistence, read-only domain context, and persisted shadow evaluation against real MongoDB. H04 feature flags remain disabled by default.

## Mongo Authentication Recovery

Root cause:

- The readiness script was loading `backend/.env` from `C:\Users\eduar\Desktop\ai-integrations\demo_test\backend`.
- The effective variable was `MONGO_URI`; no inherited shell override was active.
- The previous local URI targeted the real local Mongo deployment, but used rejected credentials.
- The same rejected credential failed in both Node readiness and `mongosh`, so this was not a Node driver or working-directory problem.
- The real deployment is local MongoDB service on `127.0.0.1:27017`, with operational database `vtkall_demo_pack_1`.

Sanitized final configuration:

```text
source: backend/.env
variable: MONGO_URI
scheme: mongodb
host: 127.0.0.1
port: 27017
database: vtkall_demo_pack_1
authSource: admin
usernamePresent: true
passwordPresent: true
usernameLength: 13
passwordLength: 32
queryOptions: authSource
shellOverridePresent: false
codeDefaultWouldApply: false
```

Correction applied:

- Created a dedicated local Mongo application credential.
- Granted minimum required role: `readWrite` on `vtkall_demo_pack_1`.
- Updated only local `backend/.env`.
- Did not print or document the password, full username, or complete Mongo URI.
- Did not modify `backend/.env.example` with real credentials.
- Did not disable authentication, create alternate persistence, drop data, or run global cleanup.

Verification:

```text
mongosh authentication: PASS
node driver authentication: PASS
Mongo connection: PASS
Mongo ping: PASS
BusinessProfile read: PASS
CatalogOffering read: PASS
Case read: PASS
CustomerInteraction fixture write: PASS
CustomerInteraction fixture read: PASS
CustomerInteraction fixture cleanup: PASS
HERMES-04A gate: PASS
```

Readiness fixture:

```text
businessSlug: demo_test
conversationId: hermes-h04-readiness
messageId: mongo-readiness-fixture
visibility: internal
interactionType: system_event
cleanup: PASS
```

## Mongo Readiness

Command:

```text
npm run hermes:h04:mongo-readiness
```

Current result:

```text
ok: true
total: 13
passed: 13
failed: 0
```

Full runner:

```text
npm run hermes:h04
```

Current result:

```text
HERMES-04A Mongo readiness: PASS
HERMES-04B Persistence and history: PASS
HERMES-04C Domain context: PASS
HERMES-04D Shadow persistence and isolation: PASS
HERMES-02 regression: PASS
HERMES-03 regression: PASS
backend guardrails: PASS
backend build: PASS
legacy agent tests: PASS
frontend build: PASS
frontend lint quiet: PASS
```

HERMES-04A-R1, HERMES-04B, HERMES-04C, and HERMES-04D are closed.

## CustomerInteraction Model

Existing `CustomerInteraction` was extended non-destructively. No second conversation collection was created.

Added compatible fields:

- `conversationId`
- `customerId`
- `managedEntityId`
- `channel`
- `direction`
- `visibility`
- `interactionType`
- `messageId`
- `content`
- `participant`
- `execution`
- `metadata`

Indexes added:

- `{ businessSlug: 1, conversationId: 1, createdAt: 1 }`
- `{ businessSlug: 1, caseId: 1, createdAt: -1 }`
- `{ businessSlug: 1, customerId: 1, createdAt: -1 }`
- `{ businessSlug: 1, visibility: 1, createdAt: -1 }`
- sparse idempotency index for `{ businessSlug, conversationId, messageId, direction, participant.runtime }`

## Central Service

`backend/src/services/agentConversation.service.ts` now centralizes H04 interaction behavior:

- `recordInboundMessage`
- `recordVisibleAgentMessage`
- `recordShadowAgentMessage`
- `getVisibleConversationHistory`
- `getShadowEvaluationHistory`
- `linkConversationToCustomer`
- `linkConversationToCase`

Visible history selects `visibility=customer` and maps:

- inbound customer message -> `role=user`
- outbound visible legacy message -> `role=assistant`
- shadow response -> excluded

## Conversation Identity

Canonical identity remains:

```text
businessSlug + conversationId
```

It is not treated as:

- `customerId`
- `caseId`
- `correlationId`
- Hermes session id

## Read-Only Context

Created H04 context module:

- `hermesContextBuilder.service.ts`
- `businessContext.reader.ts`
- `catalogContext.reader.ts`
- `customerContext.reader.ts`
- `caseContext.reader.ts`
- `managedEntityContext.reader.ts`
- `processContext.reader.ts`
- `hermesContext.contract.ts`
- `contextRedaction.policy.ts`

Context DTO includes:

- business public summary;
- role-separated visible conversation;
- public catalog summary;
- redacted customer summary;
- managed entity summary;
- case summary;
- informational process summary;
- read-only permissions.

Process context exposes:

```text
allowedActions=[]
informationalOnly=true
```

## Redaction

Central policy masks or avoids:

- full phones;
- full emails;
- document/DNI-like values;
- internal notes by omission;
- non-public catalog details by omission.

Customer summary exposes `phoneKnown` and `emailKnown` booleans instead of full contact data.

## Shadow Context and Persistence

Shadow dispatch can now receive:

- role-separated visible history;
- optional H04 read-only context as a separate `system` message;
- legacy reply only as evaluation reference.

Shadow persistence is flag-gated:

```text
HERMES_PERSIST_SHADOW=true
```

Persisted shadow uses:

```text
visibility=shadow
participant.runtime=hermes
interactionType=shadow_response
metadata.evaluation
```

It is still not returned to frontend.

## Feature Flags

Added:

```text
HERMES_CONTEXT_ENABLED=false
HERMES_PERSIST_INTERACTIONS=false
HERMES_PERSIST_SHADOW=false
HERMES_READ_BUSINESS_CONTEXT=false
HERMES_READ_CATALOG_CONTEXT=false
HERMES_READ_CUSTOMER_CONTEXT=false
HERMES_READ_CASE_CONTEXT=false
HERMES_READ_PROCESS_CONTEXT=false
HERMES_HISTORY_MAX_MESSAGES=30
HERMES_HISTORY_MAX_CHARS=30000
```

All are disabled by default.

## Guardrails

H04 guardrails added as GR-31 through GR-40 to avoid renumbering H03 rules:

- GR-31 CustomerInteraction writes use central service.
- GR-32 Visible history excludes shadow interactions.
- GR-33 Conversation queries require businessSlug.
- GR-34 Hermes context readers are read-only.
- GR-35 Hermes context contains no raw Mongoose documents.
- GR-36 Hermes context redacts sensitive fields.
- GR-37 Hermes process context cannot expose executable actions.
- GR-38 Shadow interactions cannot become customer-visible.
- GR-39 No file-based conversation persistence.
- GR-40 Case selection follows explicit priority.

Validation:

```text
npm run test:demo-test:guardrails
40 passed
0 failed
```

## Validation Performed

Passed:

```text
backend build: PASS
backend guardrails: PASS 40/40
HERMES-02 regression: PASS 34/34
HERMES-03A runtime hardening: PASS 14/14
HERMES-03B client tests: PASS 14/14
HERMES-03C shadow tests: PASS 8/8
HERMES-04A Mongo readiness: PASS 13/13
legacy agent tests: PASS
frontend build: PASS
frontend lint quiet: PASS
```

## HERMES-04B Persistence Verification

Status: CLOSED.

Command:

```text
npm run hermes:h04:interactions
npm run hermes:h04:history
```

Result:

```text
total: 12
passed: 12
failed: 0
```

Verified:

- inbound persistence: `direction=inbound`, `participant.type=customer`, `interactionType=customer_message`, `visibility=customer`;
- legacy visible persistence: `participant.runtime=legacy`, `interactionType=agent_message`, `visibility=customer`;
- Hermes shadow persistence: `participant.runtime=hermes`, `interactionType=shadow_response`, `visibility=shadow`;
- visible history selects `businessSlug + conversationId + visibility=customer`;
- shadow responses, internal rows, and other conversations are excluded from visible history;
- chronological ordering and `HERMES_HISTORY_MAX_MESSAGES` / `HERMES_HISTORY_MAX_CHARS` behavior;
- idempotent replay does not create a duplicate;
- conflicting replay is rejected explicitly;
- legacy and Hermes can coexist with the same message id because runtime differs;
- `linkConversationToCustomer` and `linkConversationToCase` validate same-business documents;
- cross-business links are rejected;
- cleanup removed only the run fixtures.

Fixture counts:

```text
CustomerInteraction created=41 removed=41
Customer created=1 removed=1
ManagedEntity created=0 removed=0
Case created=1 removed=1
CatalogOffering created=0 removed=0
BusinessProfile created=0 removed=0
```

Index note:

```text
The existing sparse idempotency index was verified. It was not converted to unique because that would require an index migration against the existing deployment.
```

## HERMES-04C Domain Context Verification

Status: CLOSED.

Command:

```text
npm run hermes:h04:context
```

Result:

```text
total: 11
passed: 11
failed: 0
```

Verified:

- real `BusinessProfile` read for `demo_test`;
- public active `CatalogOffering` included;
- inactive, private, and cross-business offerings excluded;
- customer context redacts full phone, full email, DNI/document data, and internal notes;
- managed entity is scoped by explicit linked id;
- case selection honors explicit case priority and excludes stale closed cases;
- process context returns `allowedActions=[]` and `informationalOnly=true`;
- visible history is embedded in the context DTO and shadow is excluded;
- raw Mongoose internals are absent;
- prompt injection strings inside domain data remain data, not executable instructions;
- reader execution did not change fixture counts.

Fixture counts:

```text
CustomerInteraction created=3 removed=3
Customer created=1 removed=1
ManagedEntity created=1 removed=1
Case created=3 removed=3
CatalogOffering created=3 removed=3
BusinessProfile created=0 removed=0
```

Context contract verified:

```text
permissions.mode=shadow
permissions.readOnly=true
permissions.canExecuteActions=false
conversation.history contains only user/assistant visible messages
```

## HERMES-04D Persisted Shadow Verification

Status: CLOSED.

Command:

```text
npm run hermes:h04:shadow-persistence
npm run hermes:h04:isolation
```

Result:

```text
total: 10
passed: 10
failed: 0
```

Verified:

- inbound is persisted before shadow evaluation;
- legacy visible reply remains the only public response;
- visible history is recovered from Mongo;
- read-only context is built from real Mongo fixtures;
- shadow result is persisted as `visibility=shadow`;
- `metadata.runtimeMode=shadow`, `metadata.shadowStatus`, and `metadata.evaluation` are persisted;
- visible history excludes shadow rows;
- side questions are answered safely;
- price is not invented when pricing is not published;
- 60-minute catalog duration is grounded from context;
- selected case/offering prevents repeated service questions;
- user correction is acknowledged without claiming database update;
- false confirmation claims are rejected by evaluation;
- cross-conversation leakage is blocked;
- reconnect/restart reconstructs history from Mongo;
- Hermes failure is fail-open: legacy remains visible and shadow failure is recorded internally.

Fixture counts:

```text
CustomerInteraction created=15 removed=15
Customer created=1 removed=1
ManagedEntity created=0 removed=0
Case created=1 removed=1
CatalogOffering created=1 removed=1
BusinessProfile created=0 removed=0
```

Evaluator coverage:

```text
empty reply
repeated question
internal leakage
filesystem path leakage
ID leakage
unauthorized action claim
excessive length
side-question answer
customer recognition
catalog grounding
false price
false availability
```

## HERMES-04 Final Closure

Status: CLOSED.

Commands:

```text
npm run hermes:h04:mongo-readiness
npm run hermes:h04:interactions
npm run hermes:h04:history
npm run hermes:h04:context
npm run hermes:h04:isolation
npm run hermes:h04:shadow-persistence
npm run hermes:h04
npm run test:demo-test:guardrails
npm run build
```

Regression results:

```text
Mongo readiness: PASS 13/13
HERMES-04B: PASS 12/12
HERMES-04C: PASS 11/11
HERMES-04D: PASS 10/10
HERMES-02 regression: PASS 34/34
HERMES-03A runtime hardening: PASS 14/14
HERMES-03B client tests: PASS 14/14
HERMES-03C shadow tests: PASS 8/8
backend guardrails: PASS 40/40
backend build: PASS
legacy agent tests: PASS
frontend build: PASS
frontend lint quiet: PASS
fixture cleanup: PASS
```

Final fixture residue check:

```text
CustomerInteraction: 0
Customer: 0
ManagedEntity: 0
Case: 0
CatalogOffering: 0
```

Security check:

```text
No password, full username, full MONGO_URI, token, or customer-sensitive content was written to the report.
Hermes remains shadow.
Hermes remains read-only.
Hermes remains hidden from frontend.
Hermes does not access MongoDB directly.
Hermes does not access Temporal directly.
Backend remains the only persistence boundary.
```

Intentionally not changed:

- HERMES-05;
- Hermes primary mode;
- public response DTO;
- frontend behavior;
- Temporal workflows, activities, task queues, or scheduling logic;
- Appointment, ResourceReservation, quote, WorkOrder, MCP, Odoo;
- Hermes SOUL.md, AGENTS.md, skills, or H03 runtime behavior.

Next authorized step:

```text
HERMES-05: Hermes visible for read-only Q&A.
```

## Rollback

Immediate runtime rollback:

```text
HERMES_CONTEXT_ENABLED=false
HERMES_PERSIST_SHADOW=false
HERMES_READ_BUSINESS_CONTEXT=false
HERMES_READ_CATALOG_CONTEXT=false
HERMES_READ_CUSTOMER_CONTEXT=false
HERMES_READ_CASE_CONTEXT=false
HERMES_READ_PROCESS_CONTEXT=false
HERMES_SHADOW_ENABLED=false
AGENT_RUNTIME_MODE=legacy
```

Visible `CustomerInteraction` persistence should not be deleted during rollback.

## Limitation

No HERMES-05 work was implemented in this unit. HERMES remains hidden from the frontend and only legacy responses remain public. The next authorized work is HERMES-05, where Hermes may become visible for read-only Q&A under a new gate.
