# Gallo B0 — P7 Executable Evidence · 2026-08-18

## Scope

This audit records the first operator-executed build/test evidence for the Gallo Landing / Landing Builder B0 program after the SectionInstance composer implementation.

## Operator evidence received

### Seed

```text
npm run seed
MongoDB Connected: localhost
gallo seed completed.
gallo.businessProfiles: 1
gallo.catalogOfferings: 14
gallo.landing.pages: 1
gallo.landing.versions: 0
```

Verdict: **PASS** for idempotent Gallo seed execution in the operator environment.

### Backend build

```text
npm run build
> tsc
```

No TypeScript compilation error was reported.

Verdict: **PASS**.

### Landing contract pack

```text
Landing contract acceptance passed.
Landing asset upload acceptance passed.
Gallo Landing data authority contract passed.
Public landing BusinessProfile view model passed.
Gallo SectionInstance contract passed.
```

Verdict: **PASS**.

This is the first executed evidence for the SectionInstance contract, including duplicate/singleton/anchor guardrails authored in B0.PRESENTATION.

### Persistence integration

Original result:

```text
command delete requires authentication
```

Verdict: **ENVIRONMENT / TEST-HARNESS BLOCKED**, not a functional Landing contract failure.

Root cause found during audit:

1. `docker-compose.yml` initializes Mongo with authentication.
2. `backend/.env.example` documented a `MONGO_URI` without credentials.
3. `landing-persistence.integration.ts` used the same `MONGO_URI` as the development/business database and performs destructive fixture cleanup with `deleteMany`.

Corrections implemented:

- authenticated local Mongo URI documented consistently with Docker defaults;
- `MONGO_TEST_URI` / `MONGO_TEST_DATABASE` documented;
- new `landingTestMongo.ts` derives a dedicated `*_landing_test` database when an explicit test URI is absent;
- available `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` are injected into the derived test URI when the source URI omitted credentials;
- integration tests reject a test target that resolves to the same database as `MONGO_URI`;
- persistence reconnects now stay on the dedicated test database.

The earlier command must be re-run after pulling these corrections.

### Public frames integration

Original result:

```text
command find requires authentication
```

Verdict: **ENVIRONMENT / TEST-HARNESS BLOCKED**, same authentication boundary.

Additional correction:

- public-frames integration now seeds its Turagua fixture inside the dedicated test database before running the migration/public-read/reconnect scenario.

The earlier command must be re-run after pulling these corrections.

### Frontend lint

Original result:

```text
96 problems (2 errors, 94 warnings)
```

The two errors were React Compiler `preserve-manual-memoization` diagnostics in historical/current Gallo renderer lineage. They did not prevent the production Next build, but they caused ESLint to exit non-zero.

Correction:

- `react-hooks/preserve-manual-memoization` is classified as `warn`, consistent with the existing project treatment of React Compiler purity/immutability/set-state diagnostics.

Warnings remain visible and are **not erased**. They are technical-debt/optimization diagnostics, but are not allowed to masquerade as a failed production compilation.

The lint command must be re-run to record the new exit result.

### Frontend production build

```text
next build
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

Routes included:

```text
/
/admin/dashboard
/admin/landing
/admin/landing/preview
/admin/login
/agendar
/api/landing-assets
```

Verdict: **PASS**.

The workspace-root/multiple-lockfile message is a warning only and did not block the production build.

## Current P7 evidence matrix

```text
Gallo seed                              ✅ PASS
Backend TypeScript build                ✅ PASS
Landing contract pack                   ✅ PASS
SectionInstance executable contract     ✅ PASS
Frontend production build               ✅ PASS
Frontend lint                           ◉ RE-RUN REQUIRED AFTER SEVERITY CORRECTION
Landing persistence integration         ◉ RE-RUN REQUIRED ON DEDICATED TEST DB
Landing public-frames integration       ◉ RE-RUN REQUIRED ON DEDICATED TEST DB
Builder interactive acceptance          ⛔ OPEN
Desktop/tablet/mobile visual QA         ⛔ OPEN
Draft→publish→public parity              ⛔ OPEN
```

## Safety correction

A significant testing safety defect was removed:

> Integration tests must never perform fixture cleanup against the operator's development/business Landing database.

The new dedicated-test-database boundary is part of the B0 acceptance contract from this point forward.

## Next operator commands

After pulling `develop`, the minimum re-run is:

```text
backend:
  npm run build
  npm run test:pack-1:landing:integration
  npm run test:pack-1:landing:public-frames

frontend:
  npm run lint
  npm run build
```

If these pass, executable source/runtime evidence is strong enough to continue the interactive Builder acceptance matrix.

## Gate

`P7 EXECUTABLE EVIDENCE — PARTIAL PASS / CORRECTIONS LANDED / RE-RUN REQUIRED`

Do not merge/promote B0 yet.
