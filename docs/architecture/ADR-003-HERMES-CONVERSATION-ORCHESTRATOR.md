# ADR-003: Hermes Conversation Orchestrator Boundary

Status: Accepted for first-unit implementation

Date: 2026-07-17

## Context

`demo_test` already separates presentation, business validation, durable orchestration, and persistence:

- Frontend presents and collects.
- Backend validates and persists.
- Temporal orchestrates durable process state.
- MongoDB remains the operational source of truth.

The current agent runtime can answer and accompany scheduling, but Hermes is being introduced as a stronger conversational layer. This ADR defines the boundary before Hermes is connected to any operational capability.

## Decision

Hermes is the conversational authority for understanding, tone, continuity, skill selection, authorized knowledge usage, side questions, and final natural-language response composition.

Backend remains the business authority for validation, writes, idempotency, semantic errors, capacity, `Customer`, `Case`, `ManagedEntity`, `Appointment`, `ResourceReservation`, and `TimelineEvent`.

Temporal remains the durable orchestration authority. Hermes must not import Temporal SDKs, create workflow IDs, send signals directly, or infer workflow success without an authoritative backend result.

MongoDB remains the source of truth for customer data and conversation records. Hermes must not connect to MongoDB or persist PII in its profile, skills, memory, or local runtime state.

The Agent Gateway is the only frontend entry point for future Hermes-backed conversation. The frontend must not call Hermes directly.

## First-Unit Scope

The first unit is limited to:

- `HERMES-00`: baseline audit and feature flags.
- `HERMES-01`: isolated Hermes runtime with profile, identity, internal API, bearer auth, and smoke verification.

The first unit explicitly does not connect Hermes to backend domain services, Temporal, MongoDB, frontend traffic, or the existing runtime.

## Runtime Ownership

Hermes may:

- Load `SOUL.md` and `AGENTS.md`.
- Load a compact skill catalog and authorized knowledge files.
- Receive a message list in OpenAI-compatible chat format.
- Maintain operational session continuity for the local runtime.
- Produce a customer-facing response.

Hermes may not:

- Validate business rules.
- Create or update domain records.
- Read from MongoDB.
- Call Temporal.
- Call backend write paths.
- Access unrestricted filesystem paths.
- Execute terminal commands.
- Confirm operational success before backend confirmation.

## Feature Flags

Hermes starts disabled by default:

```env
AGENT_RUNTIME_MODE=legacy
HERMES_ENABLED=false
HERMES_SHADOW_ENABLED=false
HERMES_CANARY_PERCENT=0
```

Future modes:

- `legacy`
- `hermes_shadow`
- `hermes_canary`
- `hermes_primary`

Rollback is a configuration change back to `AGENT_RUNTIME_MODE=legacy` and `HERMES_ENABLED=false`.

## Public DTO Rule

Future public agent DTOs must not expose:

- Raw model responses.
- System prompts.
- Skill contents.
- Tool calls.
- `AgentDecision`.
- `toolResults`.
- Raw Temporal state.
- Stack traces.
- Filesystem paths.
- Full customer context.

## Consequences

Hermes can improve conversation quality without weakening current guarantees. The cost is an extra orchestration layer and a stricter gateway contract before writes are allowed.

## Acceptance Criteria

- Ownership is unambiguous.
- Hermes can run in isolation.
- Hermes can answer a basic identity question.
- Hermes has no backend, MongoDB, or Temporal dependency in the first unit.
- Current backend/frontend build and guardrails still pass.
