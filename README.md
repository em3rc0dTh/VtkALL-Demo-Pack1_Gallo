# VtkALL Demo_Pack_1

VtkALL Demo_Pack_1 is the Turagua vertical demo built on top of the reusable Demo_Pack_0 foundation.

Vertical: Turagua / vehicle_service

Architectural foundation: Demo_Pack_0

Current branch scope: public landing and landing builder

The neutral Pack 0 namespace remains `demo_test` for integration and regression verification. Turagua is the Pack 1 product vertical and should be presented as the final demo identity.

Current promotion status: `Demo_Pack_1 Landing Integration`.

The default Docker/frontend path may still use `DEMO_TEST_BUSINESS_SLUG=demo_test` for Pack0 regression workflows; use `turagua` when exercising the Pack1 vertical landing.

## Full Docker Stack

From the repository root:

```powershell
docker compose up --build
```

Services:

- Frontend landing with agent chat: http://localhost:3000
- Frontend direct reservation console: http://localhost:3000/agendar
- Backend health: http://localhost:4000/api/v1/admin/health
- OpenAPI: http://localhost:4000/api-docs
- Temporal UI: http://localhost:8080
- Mongo Express: http://localhost:8081
- Ollama: http://localhost:11434
- Temporal gRPC: localhost:7233

The root compose starts:

```text
MongoDB
Backend API
Temporal Server
Temporal UI
Temporal TypeScript Worker
Frontend in API mode
Ollama local AI fallback
```

## Verify Worker Startup

```powershell
docker compose logs -f temporal-worker
```

Expected worker log:

```text
Temporal worker listening on vtkall-demo-test-schedule-consultation via temporal:7233
```

## Seed And Smoke

```powershell
docker compose exec api npm run seed:reset
docker compose exec api npm run test:demo-test:api-pack
```

## Pack 0 Acceptance Gate

From the repository root:

```powershell
npm run test:pack-0:acceptance
```

The extension contract for vertical packs is documented in `docs/architecture/DEMO_PACK_0_EXTENSION_CONTRACT.md`.

## Manual Agent Workflow

```powershell
docker compose exec api npm run agent:demo
```

The workflow runs through Temporal. The worker calls the same backend domain services used by `/api/demo-test`, so Temporal orchestrates without redefining the domain model.

## Frontend Agent Flow

Open the Dockerized frontend in your browser:

```text
http://localhost:3000
```

The landing includes a floating agent chat and CTA buttons that start the real `/api/v1/agent-sim` Temporal workflow. The chat can load catalog, collect customer data, request slots, and reserve a slot through Temporal while preserving the current v3 data model.

## Agent AI Layers

The conversational agent endpoint uses three response layers:

```text
1. Gemini OpenAI-compatible API, when GEMINI_API_KEY or GCP_API_KEY is configured.
2. Ollama at OLLAMA_URL, defaulting to http://ollama:11434 inside Docker.
3. Deterministic default messages generated from the Temporal workflow state.
```

Real secrets belong in your local `.env`, not in `.env.example`.

If you use the default Ollama model, pull it once:

```powershell
docker compose exec ollama ollama pull llama3.2:1b
```

Then ask the agent to draft the next customer message for a workflow:

```powershell
curl -X POST http://localhost:4000/api/v1/agent-sim/workflows/<workflowId>/message `
  -H "Content-Type: application/json" `
  -d "{\"message\":\"Que le digo al cliente ahora?\"}"
```
```
1st version
```