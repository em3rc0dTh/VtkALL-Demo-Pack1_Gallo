# HERMES-06B-R1 Temporal Runtime Recovery Report

STATUS: COMPLETED

DATE:

- 2026-07-20

STARTUP METHOD:

- Canonical repository Docker Compose already started by the user from `docker-compose.yml`.
- Codex runtime verification used the real Temporal SDK against `localhost:7233`.

COMPOSE FILE USED:

- `docker-compose.yml`

CONFIGURATION:

- `backend/.env`
  - `TEMPORAL_ADDRESS=localhost:7233`
  - `MONGO_URI` adjusted to host access with `directConnection=true`
- `backend/.env.example`
  - already matched `TEMPORAL_ADDRESS=localhost:7233`

TEMPORAL ADDRESS:

- `localhost:7233`

NAMESPACE:

- `default`

TASK QUEUE:

- `vtkall-demo-test-schedule-consultation`

SERVER STATUS:

- TCP reachability: PASS
- Temporal SDK connection: PASS
- Namespace describe: PASS

WORKER STATUS:

- Real worker accepted a live `ScheduleConsultationWorkflow` probe
- Worker verification script: `npm run temporal:worker:status`

WORKFLOW REGISTRATION:

- `ScheduleConsultationWorkflow` started successfully through canonical `agentSim.service`
- No alternate workflow ID scheme was introduced

WORKFLOW PROBE:

- `businessSlug=demo_test`
- probe conversation prefix: `hermes-h06b-readiness-`
- canonical workflow id returned by backend:
  - example successful probe: `schedule-consultation-1784557287672-94b7510f`
- initial workflow state:
  - `WAITING_FOR_SERVICE_SELECTION`

PROCESSCONTEXT RESULT:

- query used: `getScheduleConsultationProcessContext`
- returned:
  - `workflowType=schedule_consultation`
  - `status=WAITING_FOR_SERVICE_SELECTION`
  - `awaiting.type=offering_selection`
  - `allowedActions` includes `submit_offering_selection` and `cancel_process`
- no raw workflow history was exposed

WORKFLOW CLEANUP:

- probe cleanup used the real `cancelWorkflow` signal on the returned workflow handle
- business terminal state after cleanup:
  - `CANCELLED`
- Temporal execution closed as:
  - `COMPLETED`
- this is expected because the workflow handled the cancel signal and completed normally after reaching its terminal business state

TEMPORAL RESIDUE:

- active readiness workflows by readiness prefix: `0`

MONGO RESIDUE:

- `CustomerInteraction=0`
- `Customer=0`
- `ManagedEntity=0`
- `Case=0`
- `TimelineEvent=0`
- `IdempotencyRecord=0`

APPOINTMENT RESIDUE:

- `0`

RESOURCE RESERVATION RESIDUE:

- `0`

COMMANDS:

- `npm run temporal:local:status`
- `npm run temporal:worker:status`
- `npm run hermes:h06b:temporal-readiness`
- `npm run hermes:h06b:temporal-residue`
- `npm run hermes:h04`
- `npm run hermes:h05:residue`
- `npm run hermes:h06a:audit`
- `npm run hermes:h06a:intent`
- `npm run hermes:h06a:proposal`
- `npm run hermes:h06a:dry-run`
- `npm run hermes:h06a:no-effects`
- `npm run hermes:h06a:residue`
- `npm run test:demo-test:guardrails`
- `npm run build`
- `npm run test:demo-test:agent-mcp`
- `npm run build` in `frontend`
- `npm run lint -- --quiet` in `frontend`

REGRESSION RESULTS:

- HERMES-02 regression: PASS
- HERMES-03 regression: PASS
- HERMES-04 regression: PASS
- HERMES-05:
  - H05A routing: PASS
  - H05B visible: PASS
  - H05C fallback: PASS
  - H05D e2e: PASS
  - H05 residue: PASS
- HERMES-06A:
  - audit: PASS
  - intent: PASS
  - proposal: PASS
  - dry-run: PASS
  - no-effects: PASS
  - residue: PASS
- backend guardrails: PASS
- backend build: PASS
- legacy agent tests: PASS
- frontend build: PASS
- frontend lint quiet: PASS

LIMITATIONS:

- The all-in-one runners `npm run hermes:h05`, `npm run hermes:h06a`, and `npm run hermes:h06b:r1` are very long and produce large output streams in this shell.
- In Codex desktop they may appear silent for long stretches or hit wrapper timeouts even when the underlying subchecks are passing.
- For this gate, authoritative evidence came from direct atomic commands and the real Temporal probe, not from waiting for a single giant runner to finish streaming.
- The readiness conversation prefix is carried in the probe metadata path, while the canonical workflow id remains backend-derived `schedule-consultation-*`; no alternate workflow-id naming was introduced.

FILES MODIFIED:

- `backend/.env`
- `backend/package.json`
- `backend/src/tests/demoTest/h06bTemporalUtils.ts`
- `backend/src/tests/demoTest/h06bTemporalLocalStatus.test.ts`
- `backend/src/tests/demoTest/h06bTemporalWorkerStatus.test.ts`
- `backend/src/tests/demoTest/h06bTemporalReadiness.test.ts`
- `backend/src/tests/demoTest/h06bTemporalResidue.test.ts`
- `hermes/package.json`
- `hermes/scripts/run-h06b-r1.js`
- `docs/reviews/HERMES_06B_R1_TEMPORAL_RUNTIME_RECOVERY_REPORT.md`

SECURITY CHECK:

- No secrets printed in report
- No mock Temporal runtime used
- No alternate workflow primitive exposed to Hermes
- No forbidden areas were modified
- No global `deleteMany`, `dropCollection`, or `dropDatabase`

NEXT STEP:

- `HERMES-06B — Backend Semantic Scheduling Action Bridge`
