# HERMES-06G Conversational Consolidation Report

## Scope

HERMES-06G consolidates the public conversational turn flow without adding new business capabilities. The goal is one public message entering one canonical orchestrator and producing one visible reply.

## Canonical orchestrator

The public routes now delegate to `backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts`.

Routes under the orchestrator:

- `POST /api/demo-test/agent/message`
- `POST /api/demo-test/agent/workflows/:workflowId/message`

The controller now limits itself to:

- validate request data;
- build the execution payload;
- invoke the orchestrator;
- return the existing DTO.

## Logic reused instead of rebuilt

H06G reuses the pieces already closed in prior phases:

- scheduling bridge for authoritative start and continuity;
- active workflow resolution and conversation identity reuse;
- visible runtime selection and post-commit fallback policy;
- Hermes shadow observation, reception desk, skill dispatch and candidate synthesis;
- deterministic fallback and public DTO shaping;
- existing persistence services for inbound, internal and visible outbound records.

## Handler competition removed

The previous risk was that several layers could compete to finish the same public turn. H06G consolidates that coordination in one place and removes the controller from direct conversational routing. The controller no longer coordinates Q&A, runtime execution, bridge logic, or naturalization directly.

## Turn plan and fact retention

The orchestrator now creates an internal turn plan per public turn. That plan keeps:

- route mode;
- primary skill and supporting skills;
- extracted and known facts;
- side-question detection;
- operational actions derived from authoritative execution;
- process status and pending field;
- whether the turn required an authoritative result.

This keeps multi-fact turns from being truncated after the first recognized element. The integrated H06G orchestration test verifies that a message carrying greeting, name and offering reaches `WAITING_FOR_CUSTOMER_DATA` without asking again for the already known name or service.

## Side questions

When a workflow is already waiting for customer contact data, the orchestrator preserves the active process and lets the visible reply answer the side question first, then resume the pending requirement. The H06G test verifies that duration is answered while the workflow stays in `WAITING_FOR_CUSTOMER_DATA` with phone still pending.

## One visible reply guarantee

Per public turn, the orchestrator persists:

- exactly one visible inbound;
- exactly one visible outbound.

Any extra bookkeeping stays internal. The H06G orchestration test asserts a single visible outbound for both the multi-fact turn and the side-question turn.

## Fallback policy

Pre-commit fallback may still remain on legacy if Hermes cannot safely produce the visible reply.

Post-commit fallback does not return to legacy. It uses deterministic naturalization grounded on the authoritative result. The H06G suite verifies this behavior explicitly through the visible runtime decision layer.

## Minimal checks passed

- `npm run hermes:h06g:orchestration`
- `npm run hermes:h06g:residue`
- `npm run hermes:h06b:temporal-readiness`
- `npm run test:demo-test:guardrails`
- `npm run build`

## Intentionally not changed

H06G does not change:

- Temporal workflows, signals, activities, task queue or booking authority;
- frontend DTOs or frontend behavior;
- availability, reservation, appointment or persistence business rules;
- data model, SOUL/AGENTS files, skills or MCP architecture.

No cancellation, rescheduling, notifications, attachments workflow, or new business capabilities were added in this phase.
