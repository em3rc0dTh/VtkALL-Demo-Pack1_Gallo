# Hermes Conversation Layer for demo_test

This folder contains the first isolated Hermes unit for `demo_test`.

Implemented scope:

- ADR-003 boundary documented.
- HERMES-00 baseline audit and feature flags.
- HERMES-01 isolated OpenAI-compatible chat API.
- Minimal `SOUL.md` and `AGENTS.md` loaded at runtime.
- Bearer authentication.
- Health check.
- Docker overlay and compose file.
- Local smoke test.

Not implemented in this unit:

- Backend integration.
- Temporal writes.
- MongoDB access.
- Shadow mode.
- Canary routing.
- Skills with tool execution.
- Filesystem tools.

## Local Run

```powershell
$env:HERMES_API_KEY='local-hermes-dev-key'
node hermes/runtime/server.js
```

Health:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8642/healthz
```

Chat:

```powershell
node hermes/scripts/smoke-test.js
```

## Docker

```powershell
docker compose -f hermes/docker/docker-compose.hermes.yml up --build
```

Docker is optional for local source verification. The runtime has no package dependencies.

## Security Boundary

The first Hermes unit has no public filesystem, terminal, browser, backend, MongoDB, or Temporal tool. It only reads its versioned profile and workspace files at startup.
