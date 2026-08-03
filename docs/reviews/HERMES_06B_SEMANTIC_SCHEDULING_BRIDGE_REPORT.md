# 
- `HERMES_SCHEDULING_BRIDGE_ENABLED=false`
- `HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT=0`
- `HERMES_SCHEDULING_BRIDGE_FAIL_OPEN_PRE_COMMIT=true`
- `HERMES_SCHEDULING_BRIDGE_POST_COMMIT_LEGACY_FALLBACK=false`
- HERMES-06B - Backend Semantic Scheduling Action Bridge

## Scope

H06B connects `SchedulingActionProposal` to the existing backend semantic boundary for pre-availability scheduling execution only:

- `START_SCHEDULE_CONSULTATION`
- `SUBMIT_OFFERING_SELECTION`
- `SUBMIT_CUSTOMER_INFORMATION`

The execution path remains:

`SchedulingActionProposal -> validator/policy -> agentCapabilityGateway -> temporalMcpClient -> temporalAgentBridge -> ScheduleConsultationWorkflow`

## Supported states

- `NO_ACTIVE_PROCESS`
- `WAITING_FOR_SERVICE_SELECTION`
- `WAITING_FOR_CUSTOMER_DATA`

## Excluded states and actions

H06B explicitly declines:

- date preference
- availability requests
- slot requests
- slot selection
- cancel
- reschedule
- reservation
- appointment creation

## Feature flags

Added with default-safe rollout values in [backend/.env.example](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/.env.example):
`HERMES_SCHEDULING_BRIDGE_MAX_ACTIONS_PER_TURN=2`
- `HERMES_SCHEDULING_PRE_AVAILABILITY_ONLY=true`

## Workflow association

- Backend resolves active workflow by `businessSlug + conversationId`.
- Hermes proposal `workflowId` is sanitized and never authoritative.
- Same `messageId` can now resolve to:
  - safe replay when payload matches
  - explicit `IDEMPOTENCY_CONFLICT` when payload differs

## Bounded composition

Maximum actions per turn remain capped at `2`.

Covered compositions:

- start
- start + offering
- start + customer info

## Reconciliation and fallback

- Pre-commit declines still fail open to legacy outside H06B.
- Post-commit legacy fallback remains forbidden.
- Ambiguous dispatch uses reconciliation instead of blind retry.
- Deterministic naturalization fallback is used after authoritative context.

## Persistence

H06B keeps the existing `CustomerInteraction` collection and writes:

- one inbound visible customer message
- one visible Hermes outbound
- optional internal system event for execution trace

Technical metadata excludes raw customer PII.

## Business-side effect proof

Validated repeatedly through atomic tests:

- `Availability calls = 0`
- `requestSlots signals = 0`
- `selectSlot signals = 0`
- `scheduleConsultation calls = 0`
- `ResourceReservation created = 0`
- `Appointment created = 0`

## Temporal E2E

Verified on Monday, July 20, 2026 against local Temporal runtime:

- address `localhost:7233`
- namespace `default`
- task queue `vtkall-demo-test-schedule-consultation`
- real workflow start
- real worker acceptance
- real `ProcessContext` query
- real offering continuation
- real customer-data continuation
- replay safety
- cleanup and zero residue

## Guardrails

Added and passing:

- `GR-71` through `GR-90`

## Atomic commands executed

- `npm run build` (backend)
- `npm run hermes:h06b:bridge`
- `npm run hermes:h06b:start`
- `npm run hermes:h06b:continue`
- `npm run hermes:h06b:idempotency`
- `npm run hermes:h06b:fallback`
- `npm run hermes:h06b:naturalization`
- `npm run hermes:h06b:no-capacity`
- `npm run hermes:h06b:e2e`
- `npm run hermes:h06b:residue`
- `npm run hermes:h06b:temporal-readiness`
- `npm run test:demo-test:guardrails`
- `npm run hermes:h05:visible`
- `npm run hermes:h06a:dry-run`
- `npm run build` (frontend)
- `npm run lint -- --quiet` (frontend)

## Files touched

Primary implementation:

- [backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingBridge.service.ts)
- [backend/src/agent/hermes/scheduling/hermesSchedulingExecution.contract.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingExecution.contract.ts)
- [backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingExecution.policy.ts)
- [backend/src/agent/hermes/scheduling/hermesSchedulingIdempotency.service.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingIdempotency.service.ts)
- [backend/src/agent/hermes/scheduling/hermesSchedulingReconciliation.service.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingReconciliation.service.ts)
- [backend/src/agent/hermes/scheduling/hermesSchedulingNaturalization.service.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/agent/hermes/scheduling/hermesSchedulingNaturalization.service.ts)
- [backend/src/controllers/agentSim.controller.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/controllers/agentSim.controller.ts)
- [backend/src/services/agentConversation.service.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/services/agentConversation.service.ts)

Tests and fixtures:

- [backend/src/tests/demoTest/h06bAssertions.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bAssertions.ts)
- [backend/src/tests/demoTest/h06bFixtures.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bFixtures.ts)
- [backend/src/tests/demoTest/h06bBridge.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bBridge.test.ts)
- [backend/src/tests/demoTest/h06bStart.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bStart.test.ts)
- [backend/src/tests/demoTest/h06bContinue.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bContinue.test.ts)
- [backend/src/tests/demoTest/h06bIdempotency.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bIdempotency.test.ts)
- [backend/src/tests/demoTest/h06bFallback.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bFallback.test.ts)
- [backend/src/tests/demoTest/h06bNaturalization.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bNaturalization.test.ts)
- [backend/src/tests/demoTest/h06bNoCapacity.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bNoCapacity.test.ts)
- [backend/src/tests/demoTest/h06bE2E.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bE2E.test.ts)
- [backend/src/tests/demoTest/h06bResidue.test.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/tests/demoTest/h06bResidue.test.ts)

Guardrails:

- [backend/src/scripts/guardrails/rules/index.ts](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/scripts/guardrails/rules/index.ts)
- `GR-71` to `GR-90` under [backend/src/scripts/guardrails/rules](/C:/Users/eduar/Desktop/ai-integrations/demo_test/backend/src/scripts/guardrails/rules)

## Limitations

- H06B stops before date, availability, slot, reservation, appointment, cancel, and reschedule.
- Managed entity collection remains required by the underlying workflow after customer data, which is still outside H06B scope.

## Rollback

Disable:

- `HERMES_SCHEDULING_BRIDGE_ENABLED=false`
- `HERMES_SCHEDULING_BRIDGE_CANARY_PERCENT=0`

Legacy continuity remains intact and no Temporal data rollback is required.

## Next authorized step

`HERMES-06C - Availability and Slot Presentation`
