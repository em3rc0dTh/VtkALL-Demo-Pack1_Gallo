# Demo Test Execution Context Contract MK1

Date: 2026-07-10
Scope: `/api/demo-test`, demoTest services, Temporal Activities, and TimelineEvent writes.

## Purpose

Every active demoTest execution must carry a stable context for correlation, causation, actor, channel, and idempotency propagation. The context is metadata only: it does not create persistent idempotency records or change the canonical manual `/api/demo-test` service path.

## Canonical Context

`ExecutionContext` is defined in `backend/src/services/demoTest/core/ExecutionContext.ts`.

Required fields:

- `correlationId`: groups logs, API responses, timeline events, and activity work for one user-visible request.
- `causationId`: identifies the direct cause for this execution step.
- `channel`: one of `http`, `manual_console`, `web`, `whatsapp`, `temporal`, `seed`, `test`, or `internal`.
- `actor`: typed initiator metadata. Temporal Activities use `type=temporal_workflow`.
- `requestedAt`: ISO timestamp for context creation.

Optional fields:

- `idempotencyKey`: accepted from HTTP `Idempotency-Key` or stable Temporal command identity and propagated to writes. `POST /api/demo-test/schedule-consultation` requires this header at the HTTP boundary.
- `businessSlug`, `caseId`: domain scope when known.
- `workflowId`, `workflowRunId`, `activityId`: Temporal metadata when available.
- `metadata`: non-secret operational hints.

## HTTP Boundary

The `/api/demo-test` mount must include `executionContextMiddleware` before routes and `demoTestErrorMiddleware` after routes.

Accepted headers:

- `X-Correlation-Id`
- `X-Causation-Id`
- `Idempotency-Key`

Response headers:

- `X-Correlation-Id`
- `X-Causation-Id`
- `Idempotency-Key` when supplied and valid.

`Idempotency-Key` is validated for length and characters, then propagated. BE-CORE-02 adds persistent command idempotency for selected write commands; see `docs/contracts/DEMO_TEST_IDEMPOTENCY_CONTRACT_MK1.md`.

## Error Contract

`SemanticError` and `semanticErrorRegistry` are the canonical error authority. `DemoTestDomainError` is a compatibility bridge and must extend `SemanticError`.

`/api/demo-test` errors use this envelope:

```json
{
  "ok": false,
  "error": {
    "code": "NO_AVAILABILITY",
    "message": "The selected slot is not available.",
    "retryable": false
  },
  "context": {
    "correlationId": "corr_...",
    "causationId": "cause_..."
  }
}
```

Controller code must not manually serialize raw `error.message` responses for `/api/demo-test`.

## Service Boundary

Write services accept `ExecutionContext` as an optional second argument. Services must not accept Express `Request` or `Response`.

Current active endpoints pass context into:

- `POST /api/demo-test/customers`
- `POST /api/demo-test/managed-entities`
- `POST /api/demo-test/cases`
- `GET /api/demo-test/availability`
- `POST /api/demo-test/schedule-consultation`
- `GET /api/demo-test/cases/:caseId/timeline`

## Temporal Boundary

Temporal Activities build an `ExecutionContext` with:

- `channel=temporal`
- `actor.type=temporal_workflow`
- workflow/activity metadata when available.

The booking Activity keeps `maximumAttempts: 1`; idempotency is propagated but not persisted as a replay ledger.

## TimelineEvent Metadata

`recordTimelineEvent(input, context?)` is the only writer for operational timeline events outside seed/migration/test code. It must persist:

- `actor` derived from context when the caller did not provide one.
- `execution.correlationId`
- `execution.causationId`
- `execution.idempotencyKey` when present.
- `execution.workflowId`, `workflowRunId`, `activityId` when present.
- `execution.channel`

## Verification

Required checks:

```bash
npm run build
npm run test:demo-test:guardrails
npm run test:demo-test:guardrails:self
npm run test:demo-test:compatibility
npm run test:demo-test:core
npm run test:demo-test:seed
npm run test:demo-test:smoke
```

Write smoke remains opt-in with `DEMO_TEST_ALLOW_WRITES=true` and should use an isolated Mongo database when mutation evidence is required.
