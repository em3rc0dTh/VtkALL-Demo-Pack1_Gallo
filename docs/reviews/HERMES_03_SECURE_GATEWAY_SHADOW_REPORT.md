# HERMES-03 Secure Gateway Shadow Report

Date: 2026-07-17

Status: closed locally.

## Executive Summary

HERMES-03 introduces Hermes as a secure backend-observed conversation runtime in shadow mode.

Hermes can now be called by backend code through a validated gateway, but it still cannot operate the business. The legacy agent remains the only public response source, and Hermes shadow output is internal only.

## Files Created

- `hermes/tests/runtime-hardening.test.js`
- `hermes/scripts/runtime-control.js`
- `hermes/scripts/run-h03.js`
- `backend/src/agent/hermes/clients/hermesApi.client.ts`
- `backend/src/agent/hermes/contracts/executionContext.contract.ts`
- `backend/src/agent/hermes/contracts/hermesChatRequest.contract.ts`
- `backend/src/agent/hermes/contracts/hermesChatResponse.contract.ts`
- `backend/src/agent/hermes/contracts/hermesError.contract.ts`
- `backend/src/agent/hermes/contracts/hermesHealth.contract.ts`
- `backend/src/agent/hermes/mappers/hermesConversation.mapper.ts`
- `backend/src/agent/hermes/services/hermesGateway.service.ts`
- `backend/src/agent/hermes/services/hermesShadow.service.ts`
- `backend/src/agent/hermes/telemetry/hermesTelemetry.ts`
- `backend/src/agent/hermes/tests/hermesApi.client.test.ts`
- `backend/src/agent/hermes/tests/hermesShadow.service.test.ts`
- `backend/src/scripts/guardrails/rules/gr21-hermes-frontend-isolation.ts`
- `backend/src/scripts/guardrails/rules/gr22-hermes-no-mongoose.ts`
- `backend/src/scripts/guardrails/rules/gr23-hermes-no-temporal.ts`
- `backend/src/scripts/guardrails/rules/gr24-hermes-shadow-no-writes.ts`
- `backend/src/scripts/guardrails/rules/gr25-hermes-shadow-private.ts`
- `backend/src/scripts/guardrails/rules/gr26-hermes-key-no-default.ts`
- `backend/src/scripts/guardrails/rules/gr27-hermes-failure-fail-open.ts`
- `backend/src/scripts/guardrails/rules/gr28-hermes-role-separated.ts`
- `backend/src/scripts/guardrails/rules/gr29-hermes-no-confirmation.ts`
- `backend/src/scripts/guardrails/rules/gr30-hermes-access-flags.ts`

## Files Modified

- `hermes/runtime/server.js`
- `hermes/package.json`
- `hermes/profile/env.example`
- `hermes/profile/config.example.yaml`
- `backend/.env.example`
- `backend/package.json`
- `backend/src/controllers/agentSim.controller.ts`
- `backend/src/scripts/guardrails/fileScanner.ts`
- `backend/src/scripts/guardrails/rules/index.ts`

## Configuration

Runtime defaults:

```text
HERMES_HOST=127.0.0.1
HERMES_PORT=8642
HERMES_API_KEY=
HERMES_ENV=development
HERMES_REQUEST_TIMEOUT_MS=15000
HERMES_MAX_REQUEST_BYTES=262144
HERMES_MAX_MESSAGES=40
HERMES_MAX_MESSAGE_CHARS=12000
HERMES_MAX_CONCURRENT_REQUESTS=4
HERMES_QUEUE_LIMIT=20
HERMES_ENABLE_BACKEND_ACCESS=false
HERMES_ENABLE_TEMPORAL_ACCESS=false
HERMES_ENABLE_MONGO_ACCESS=false
HERMES_ENABLE_TERMINAL_ACCESS=false
HERMES_ENABLE_WRITE_ACCESS=false
```

Backend flags:

```text
HERMES_ENABLED=false
HERMES_SHADOW_ENABLED=false
HERMES_API_BASE_URL=http://127.0.0.1:8642
HERMES_API_KEY=
HERMES_REQUEST_TIMEOUT_MS=15000
HERMES_SHADOW_FAIL_OPEN=true
HERMES_SHADOW_SAMPLE_PERCENT=100
AGENT_RUNTIME_MODE=legacy
```

Rollback is flag-only.

## Contracts

Runtime:

- `GET /healthz`
- `GET /v1/models`
- `POST /v1/chat/completions`

Backend gateway:

- `HermesApiClient.getHealth(context)`
- `HermesApiClient.complete(input, context)`

Shadow:

- `dispatchHermesShadowSafely(input)`
- `HermesShadowResult`

Histories remain role-separated arrays. They are not flattened into a "Recent conversation" prompt.

## Hardening

Implemented:

- mandatory bearer auth for chat/models/reload;
- empty production key rejected at startup;
- safe token comparison;
- request body limit;
- message count and character limits;
- content-type validation;
- role validation;
- model validation;
- correlation ID propagation;
- stable error envelope;
- request timeout;
- concurrency limit;
- bounded queue;
- clean SIGINT/SIGTERM shutdown;
- sanitized health response.

Health remains unauthenticated but sanitized. It does not expose keys, env, absolute paths, prompt text, skill content, or provider details.

## Errors

Runtime error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "HERMES_TIMEOUT",
    "message": "Hermes did not complete the response in time.",
    "retryable": true
  },
  "context": {
    "correlationId": "corr_..."
  }
}
```

Backend maps Hermes failures into internal codes:

- `HERMES_UNAVAILABLE`
- `HERMES_TIMEOUT`
- `HERMES_UNAUTHORIZED`
- `HERMES_INVALID_RESPONSE`
- `HERMES_OVERLOADED`
- `HERMES_PROVIDER_ERROR`
- `HERMES_CONFIG_ERROR`

## Shadow Mode

Shadow mode is called after the legacy runtime produces the visible reply.

The controller still returns only:

- `conversationId`
- `workflowId`
- `provider`
- `model`
- `message`
- `state`

`hermesReply` is never included in public DTOs.

Fail-open behavior:

- Hermes timeout does not throw publicly.
- Hermes down does not throw publicly.
- invalid Hermes response does not throw publicly.
- legacy response remains intact.

## Sampling

Stable sampling uses:

```text
sha256(businessSlug + ":" + conversationId) % 100
```

No per-turn `Math.random()` sampling is used.

## Guardrails

Added:

- GR-21 Frontend cannot call Hermes.
- GR-22 Hermes integration cannot import Mongoose models.
- GR-23 Hermes integration cannot import Temporal SDK.
- GR-24 Shadow mode cannot call write services.
- GR-25 Shadow result cannot enter public response DTO.
- GR-26 Hermes API key has no production default.
- GR-27 Hermes failure cannot break legacy output.
- GR-28 Hermes history remains role-separated.
- GR-29 Shadow mode detects completed-operation claims.
- GR-30 Hermes access flags remain false.

Final guardrail result:

```text
30 passed
0 failed
```

## Tests

Final command:

```text
npm run hermes:h03
```

Results:

```text
HERMES-02 regression: PASS 34/34
HERMES-03A runtime hardening: PASS 14/14
HERMES-03B client tests: PASS 14/14
HERMES-03C shadow tests: PASS 8/8
Backend guardrails: PASS 30/30
Backend build: PASS
Legacy agent tests: PASS
Frontend build: PASS
Frontend lint quiet: PASS
```

Manual checks:

```text
Hermes health=200
Hermes chat completion=200
version=h03
backendAccess=false
temporalAccess=false
mongoAccess=false
terminalAccess=false
writeAccess=false
```

Backend can consult health and completions through the `HermesApiClient` test suite. Shadow timeout/down/invalid-response fail-open behavior is covered by `hermesShadow.service.test.ts`.

## Problems Found

- HERMES-02 regression initially failed for frustration recovery because the hardened runtime routed frustration into a generic security refusal. It was corrected to preserve human-review recovery language.
- GR-26 initially flagged local dev scripts. The rule was adjusted to allow local development scripts while still blocking production defaults.

## Mongo Status

No MongoDB read/write access was added.

No `CustomerInteraction` shadow persistence was added.

Mongo-backed persistence remains HERMES-04 scope.

## Limitations

- Hermes is still knowledge-only.
- Shadow telemetry is in-memory/test-observable only.
- No MCP was implemented.
- No Temporal workflow starts, signals, updates, or queries were added.
- No real catalog, availability, customer, case, appointment, or reservation access was added.
- Docker hardening remains packaging work, not required for this local gate.

## Rollback

Immediate rollback:

```text
HERMES_ENABLED=false
HERMES_SHADOW_ENABLED=false
AGENT_RUNTIME_MODE=legacy
```

Rollback does not require frontend changes, Mongo migrations, Temporal changes, model changes, workflow cancellation, or conversation deletion.

## Next Unit

HERMES-04: Conversation Persistence and Read-Only Domain Context.

Allowed next scope:

- `CustomerInteraction`
- persisted conversation history;
- `BusinessProfile`;
- `CatalogOffering` read-only;
- customer summary;
- case summary;
- read-only process context.

Still excluded:

- workflow starts;
- signals;
- booking;
- `ResourceReservation`;
- `Appointment`;
- transactional actions.
