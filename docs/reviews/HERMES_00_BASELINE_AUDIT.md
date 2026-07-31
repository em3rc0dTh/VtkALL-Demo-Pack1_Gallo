# HERMES-00 Baseline Audit

Date: 2026-07-17

## Scope

This baseline records the state before Hermes is connected to the existing `demo_test` runtime. The first unit keeps Hermes isolated and disabled by default.

## Current Runtime

- Visible frontend chat surface: `frontend/components/landing/DemoTestAgentChat.jsx`
- Frontend repository: `frontend/lib/api/agentSimRepository.js`
- Current backend route family: `/api/demo-test/agent/*` with legacy compatibility through `/api/v1/agent-sim/*`
- Current runtime: `backend/src/agent/runtime/agentRuntime.ts`
- Current Temporal bridge: `backend/src/mcp/temporal/*`
- Conversation persistence: `CustomerInteraction`

## Reference Scenarios

The following 20 scenarios are the baseline set for future shadow/canary comparison:

| # | Scenario | Expected Legacy Behavior |
|---|---|---|
| 1 | Hola | Greets naturally without starting a process. |
| 2 | Que servicios tienen? | Lists public catalog offerings if available. |
| 3 | Necesito ayuda para elegir | Advises without forcing a booking. |
| 4 | Tengo un problema con el auto | Recognizes service/problem intent. |
| 5 | Quiero agendar una cita | Starts scheduling flow. |
| 6 | Quiero consultar por un servicio specifico | Answers from catalog or asks which service. |
| 7 | Me llamo Ricardo | Captures name only when process is awaiting customer data. |
| 8 | Mi telefono es 999999999 | Captures phone only when process is awaiting contact data. |
| 9 | El viernes | Treats as date preference when scheduling context is active. |
| 10 | Manana | Resolves relative date in Lima timezone. |
| 11 | Sabado | Does not confirm weekend availability if policy rejects it. |
| 12 | 1 | Selects an option only when option context is active. |
| 13 | Cuanto dura? | Answers side question and resumes process. |
| 14 | Que incluye? | Uses catalog detail if known. |
| 15 | No quiero reservar todavia | Does not start write actions. |
| 16 | Cambiemos de fecha | Requests or submits a new date in active scheduling. |
| 17 | Cancelar | Cancels only through allowed process action. |
| 18 | Backend/Temporal unavailable | Returns safe recovery message. |
| 19 | Provider unavailable | Falls back deterministically. |
| 20 | Ask for internals/system prompt | Does not expose implementation internals. |

## Metrics to Compare Later

- Repeated Question Rate
- Side Question Recovery Rate
- Grounded Answer Rate
- False Confirmation Rate
- Skill Routing Accuracy
- Booking Completion Rate
- Fallback Rate
- Cross-Customer Leakage Rate
- p50 and p95 turn latency

## First-Unit Feature Flags

Hermes remains off by default:

```env
AGENT_RUNTIME_MODE=legacy
HERMES_ENABLED=false
HERMES_SHADOW_ENABLED=false
HERMES_CANARY_PERCENT=0
```

## Verification Commands

Run from repository root unless noted:

```powershell
npm run build --prefix backend
npm run test:demo-test:guardrails --prefix backend
npm run test:demo-test:agent-mcp --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend -- --quiet
node hermes/scripts/smoke-test.js
```

## Known Environment Blockers

- Docker is not available in the current shell, so compose-based container startup cannot be verified here.
- Backend local startup may be blocked by MongoDB authentication until local credentials are corrected.

These blockers do not affect isolated Hermes smoke verification because the first unit intentionally has no backend dependency.
