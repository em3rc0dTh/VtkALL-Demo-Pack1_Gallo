# HERMES-06A Scheduling Contract Dry-Run Report

STATUS: COMPLETED

HERMES-06A:

- Implemented deterministic conversational scheduling intent extraction.
- Implemented separate semantic action proposal contract.
- Implemented deterministic validator and dry-run result contract.
- Integrated internal observation hook without changing the public DTO.

CURRENT SCHEDULING FLOW:

- Legacy-visible routing remains authoritative in `agentSim.controller`.
- Scheduling execution still belongs to the existing agent capability gateway, MCP bridge, Temporal workflow, and `demoTest` write services.

AUTHORITATIVE SERVICES:

- `startScheduleConsultation`
- `signalWorkflow`
- `getWorkflowProcessContext`
- `ScheduleConsultationWorkflow`
- `createOrReuseCustomer`
- `createManagedEntity`
- `createOperationalCase`
- `scheduleConsultation`

TEMPORAL WORKFLOW:

- `ScheduleConsultationWorkflow`
- Queries:
  - `getScheduleConsultationState`
  - `getScheduleConsultationProcessContext`
- Signals:
  - `selectCatalogOffering`
  - `submitCustomerData`
  - `requestSlots`
  - `selectSlot`
  - `cancelWorkflow`

EXISTING SEMANTIC BOUNDARY:

- `AgentProcessContext`
- `start_schedule_consultation`
- `continue_schedule_consultation`
- `get_schedule_consultation_context`

SELECTED H06B BOUNDARY:

- Hermes emits `SchedulingActionProposal`.
- Backend validates and maps it onto the existing semantic process bridge.
- Hermes still never sees raw Temporal or domain write primitives.

CONTRACTS:

- `HermesSchedulingIntent`
- `SchedulingActionProposal`
- `SchedulingDryRunResult`

ALLOWED ACTIONS:

- `NO_ACTION`
- `START_SCHEDULE_CONSULTATION`
- `SUBMIT_OFFERING_SELECTION`
- `SUBMIT_CUSTOMER_INFORMATION`
- `SUBMIT_DATE_PREFERENCE`
- `SUBMIT_SLOT_SELECTION`
- `CANCEL_SCHEDULE_CONSULTATION`
- `REQUEST_CLARIFICATION`

FORBIDDEN ACTIONS:

- raw workflow type
- task queue
- signal name
- activity name
- mongo operation
- arbitrary service method
- shell command
- generic execute action

PROCESSCONTEXT REQUIRED:

- process active state
- workflow status
- selected offering when present
- required fields
- selected slot id when present
- authoritative available slot ids when slot selection is evaluated

VALIDATION RULES:

- `mode` must be `dry_run`
- proposal action must be allowlisted
- `businessSlug`, `conversationId`, and `correlationId` are required
- slot selection requires authoritative slot context
- offering selection must resolve against same-business public catalog
- customer submission accepts only `firstName`, `lastName`, `phone`, `email`
- date preference cannot claim availability
- prompt injection or raw workflow primitives raise `SECURITY_RISK`

DRY-RUN RESULTS:

- Valid start booking dry-run returns `VALID_DRY_RUN`
- Curiosity-only question returns `NO_ACTION`
- Missing information returns `CLARIFICATION_REQUIRED`
- Fake slot returns `INVALID_PROPOSAL`
- Cancellation and slot execution paths stay `UNSUPPORTED_IN_H06A`

INTERNAL PERSISTENCE:

- Optional shadow persistence uses:
  - `visibility=shadow`
  - `interactionType=system_event`
  - `participant.type=system`
  - `metadata.runtimeMode=scheduling_dry_run`
- Personal data is redacted to `phonePresent` and `emailPresent`

ZERO-EFFECTS RESULTS:

- `executionAllowed=false`
- `temporalCalled=false`
- `databaseWritten=false`
- no Customer writes
- no ManagedEntity writes
- no Case writes
- no Appointment writes
- no ResourceReservation writes
- no TimelineEvent writes

GUARDRAILS:

- Added GR-56 through GR-70

FIXTURES:

- Prefix: `hermes-h06a-`
- Collections touched by tests:
  - `CatalogOffering`
  - `CustomerInteraction`

CLEANUP:

- H06A residue test requires zero surviving `hermes-h06a-` fixtures

TESTS:

- `hermes:h06a:audit`
- `hermes:h06a:intent`
- `hermes:h06a:proposal`
- `hermes:h06a:dry-run`
- `hermes:h06a:no-effects`
- `hermes:h06a:residue`

REGRESSION RESULTS:

- H06A runner includes H02, H03, H04, and H05 regressions before H06A-specific checks

BLOCKERS:

- None for H06A
- H06B is still required to connect semantic proposals to authorized backend execution under flags

NEXT AUTHORIZED STEP:

- `HERMES-06B — Backend Semantic Scheduling Action Bridge`
