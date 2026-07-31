# HERMES_07 Triaging And Subagents Report

## Current point

Hermes already had reception desk assessment, skill dispatch, scheduling specialist execution planning, controlled visible runtime, deterministic fallback, persistent context, workflow continuity, and one visible reply per turn.

## Target point

HERMES-07 turns those pieces into one explicit shape:

- Hermes performs the triage;
- Hermes records an internal micro-stop;
- one selected sub-agent receives the minimum context package;
- backend and Temporal remain authoritative;
- Hermes keeps the only public identity.

## Canonical orchestrator

`backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts` remains the public coordinator and now imports:

- `buildHermesTriageResult`
- `persistHermesTriageResult`
- `dispatchHermesSubAgent`

It still owns the only public turn flow for:

- `POST /api/demo-test/agent/message`
- `POST /api/demo-test/agent/workflows/:workflowId/message`

## Triage

`backend/src/agent/hermes/contracts/hermesTriage.contract.ts` defines the internal H07 triage contract.

`backend/src/agent/hermes/orchestration/hermesTriage.service.ts` converts existing reception-desk assessment and dispatch-plan data into:

- intent;
- mode;
- facts;
- side-question metadata;
- selected agent;
- required context;
- confidence;
- reason code;
- process snapshot.

## Micro-stop

`backend/src/agent/hermes/orchestration/hermesTriagePersistence.service.ts` records the internal triage micro-stop with:

- `visibility=internal`
- `runtimeMode=triage_micro_stop`
- sanitized facts only

No raw prompts and no sensitive technical metadata are persisted.

## Agent registry

`backend/src/agent/hermes/orchestration/hermesAgentRegistry.ts` defines the four H07 sub-agents and their base skill mapping:

- conversation-agent -> customer-conversation
- catalog-agent -> catalog-advisor
- scheduling-agent -> scheduling-companion
- recovery-agent -> recovery-escalation

## Subagents

Sub-agent wrappers now exist in `backend/src/agent/hermes/subagents/`:

- `conversationAgent.ts`
- `catalogAgent.ts`
- `schedulingAgent.ts`
- `recoveryAgent.ts`

They standardize the H07 sub-agent output contract while keeping backend execution authority external to Hermes.

## Skill mapping

The current Hermes skills were reused instead of replaced. H07 adds orchestration shape, not new business engines.

## Multi-fact handling

The H07 orchestration suite verifies that triage preserves multi-fact input such as:

- first name;
- offering reference;
- scheduling intent.

For scheduling turns, triage resolves to `scheduling-agent` with `respond_and_act` when an authoritative action path is required.

## Side-question handling

For active scheduling turns, H07 triage now marks the side question explicitly and adds `catalog-agent` as supporting agent for duration or catalog facts while keeping the process pending field intact.

## Known-fact protection

Known facts are carried from assessment and dispatch-plan projection into triage facts and sub-agent input. The public path still relies on the existing visible runtime and candidate validation to avoid re-asking already known data.

## Context packaging

`backend/src/agent/hermes/contracts/hermesSubAgent.contract.ts` defines the minimum internal package delivered to sub-agents:

- triage;
- latest message;
- compact history;
- known facts;
- projected business, catalog, customer, case and process context;
- read-only permissions with proposal-only execution policy.

## Authoritative execution

Scheduling sub-agents can only propose actions. Backend and Temporal remain the authority for execution. H07 does not add direct persistence or direct Temporal access inside Hermes sub-agents.

## Final naturalization

The public visible answer still runs through the existing visible runtime and response validation layer. Sub-agents stay internal and do not publish technical payloads directly.

## One public identity

Hermes remains the only public identity. Selected agent, skill, reason code, triage and internal routing stay internal.

## One visible outbound

H07 did not change the public persistence model. The existing controlled visible runtime remains the path that protects one visible outbound per turn.

## Pre-commit fallback

Pre-commit can still fail open once through the existing visible runtime policy when no authoritative action was committed.

## Post-commit fallback

Post-commit legacy fallback remains forbidden. H07 keeps the H06 visible runtime policy that stays on deterministic post-commit reconciliation.

## Frontend compatibility

No frontend DTO contract was intentionally changed by H07. The work stayed in backend orchestration, triage and internal sub-agent wiring.

## Frontend manual check

Frontend manual check: not completed in this Windows session on July 20, 2026, because Temporal local readiness is still unavailable from the current host environment (`127.0.0.1:7233` refused and `docker` is not installed in this Windows shell).

## Minimal checks

- `npm run hermes:h07:orchestration` PASS
- `npm run hermes:h07:residue` PASS
- `npm run build` PASS

`npm run hermes:h06b:temporal-readiness` still fails in this Windows session because the local Temporal endpoint is unreachable.

## Intentionally not changed

H07 did not change:

- Temporal workflows, signals, activities or task queue;
- booking and availability authority;
- ResourceReservation or Appointment models;
- frontend DTO shape;
- SOUL.md, AGENTS.md or current skill catalog;
- cancellation, rescheduling, notifications, attachments or new business operations.
