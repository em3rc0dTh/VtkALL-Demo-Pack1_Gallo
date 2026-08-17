# VTKALL Demo Pack 1

VTKALL Demo Pack 1 is the Turagua vehicle-service vertical built on top of the reusable Demo Pack 0 foundation. It includes a Next.js frontend, an Express/Mongo backend, Temporal scheduling workflows, and the Hermes conversational agent layer.

Pack 0 remains visible in some internal names as `demo_test`; Pack 1 is the Turagua product identity and normally runs with the `turagua` business slug.

## What Is Included

- Public Turagua landing page with agent chat and landing-builder preview flows.
- Direct reservation console at `/agendar`.
- REST API with OpenAPI docs, Mongo persistence, seed data, and admin health checks.
- Temporal Server, UI, and TypeScript worker for consultation scheduling.
- Hermes orchestration, routing, scheduling, and conversational model support.
- Pack 0 regression, Pack 1 landing, backend guardrail, and Hermes verification suites.

## Quick Start

Copy the environment template, then start the full Docker stack:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Useful URLs:

| Service | URL |
| --- | --- |
| Frontend landing | http://localhost:3000 |
| Direct reservation flow | http://localhost:3000/agendar |
| Backend health | http://localhost:4000/api/v1/admin/health |
| OpenAPI docs | http://localhost:4000/api-docs |
| Temporal UI | http://localhost:8080 |
| Mongo Express | http://localhost:8081 |
| Ollama | http://localhost:11434 |
| Temporal gRPC | localhost:7233 |

The root compose file starts MongoDB, Mongo Express, Temporal, Temporal UI, Ollama, the backend API, the Temporal worker, and the frontend in API mode.

## Environment

Use `.env.example` as the local template. Do not commit real secrets.

Important defaults:

- `BUSINESS_SLUG=turagua` is the Pack 1 vertical slug used by the Docker frontend and API seed path.
- `DEMO_TEST_BUSINESS_SLUG=demo_test` is still useful for Pack 0 regression workflows.
- `DEMO_TEST_ADMIN_WRITE_TOKEN` protects admin write endpoints.
- `GEMINI_API_KEY` or `GCP_API_KEY` enables the Gemini-compatible response layer.
- `OLLAMA_URL`, `OLLAMA_MODEL`, and `HERMES_CONVERSATIONAL_OLLAMA_MODEL` configure local model fallback.

If you use Ollama directly, pull the configured model once:

```powershell
docker compose exec ollama ollama pull qwen2.5:0.5b
```

## Common Commands

Seed or reset demo data:

```powershell
docker compose exec api npm run seed:reset
```

Run the API verification pack:

```powershell
docker compose exec api npm run test:demo-test:api-pack
```

Follow the Temporal worker:

```powershell
docker compose logs -f temporal-worker
```

Expected worker startup includes:

```text
Temporal worker listening on vtkall-demo-test-schedule-consultation via temporal:7233
```

Run the manual agent workflow:

```powershell
docker compose exec api npm run agent:demo
```

Run the full acceptance gate from the repository root:

```powershell
npm run test:pack-0:acceptance
```

The acceptance gate builds the backend, runs Pack 1 landing checks, guardrails, core/idempotency/API verification, seed inspection, Temporal readiness, Hermes runtime invariants, Hermes Temporal E2E, frontend lint, and frontend build.

## Local Development

For Docker-first development, keep the full stack running and edit source files in `backend` and `frontend`.

For separate local processes:

```powershell
npm install --prefix backend
npm install --prefix frontend
```

Backend:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
$env:NEXT_PUBLIC_DEMO_TEST_DATA_MODE='api'
$env:NEXT_PUBLIC_DEMO_TEST_API_BASE_URL='http://localhost:4000'
$env:NEXT_PUBLIC_DEMO_TEST_BUSINESS_SLUG='turagua'
npm run dev
```

Hermes standalone runtime:

```powershell
$env:HERMES_API_KEY='local-hermes-dev-key'
node hermes/runtime/server.js
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8642/healthz
```

## Repository Map

| Path | Purpose |
| --- | --- |
| `backend/` | Express API, Mongo models, domain services, Temporal worker, Hermes backend integration, and verification scripts. |
| `frontend/` | Next.js app, Turagua landing, admin screens, direct reservation flow, and mock/API repositories. |
| `hermes/` | Standalone Hermes profile, workspace knowledge, skills, runtime, and smoke tests. |
| `docs/` | Architecture notes, contracts, reviews, audits, runbooks, and use-case documentation. |
| `docker-compose.yml` | Full local stack for the Pack 1 demo. |
| `datamodel.json` and `DATA_MODEL_*.md` | Source data model references for the demo pack. |
| `VTKALL_Demo_Pack_1.postman_collection.json` | Postman collection for API exploration. |

## Architecture Notes

- Temporal owns scheduling workflow state, while backend domain services remain the authority for customers, cases, availability, reservations, and appointments.
- Availability is calculated from team capacity, schedule rules, overrides, and existing reservations instead of treating legacy slots as the source of truth.
- Hermes visible runtime can answer customer-facing turns, route scheduling requests, present availability, and book slots while preserving backend invariants.
- The Demo Pack 0 extension contract is documented in `docs/architecture/DEMO_PACK_0_EXTENSION_CONTRACT.md`.

## More Documentation

- Backend run notes: `backend/README.md`
- Hermes run notes: `hermes/README.md`
- Project docs index: `docs/README.md`
- Hermes operational runbook: `docs/hermes/HERMES_RUNBOOK.md`
- Frontend/backend boundary: `docs/architecture/FRONTEND_BACKEND_BOUNDARY_MK1.md`
```powershell
1st version
```
