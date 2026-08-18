# Gallo B0 — P7 Re-run Evidence · 2026-08-18

## Operator re-run

The operator pulled the P7 harness corrections and re-ran the minimum executable gate.

## Results

### Backend build

`npm run build` → **PASS** (`tsc` completed without reported error).

### Landing persistence integration

`npm run test:pack-1:landing:integration` → **BLOCKED BY MONGO AUTHENTICATION**.

Observed terminal result:

```text
Authentication failed.
```

This occurred after the dedicated-test-database harness landed. The failure is therefore now narrowed to the credential value actually loaded by the local `backend/.env` / shell environment, not to Landing persistence semantics.

### Landing public-frames integration

`npm run test:pack-1:landing:public-frames` → **BLOCKED BY MONGO AUTHENTICATION** with the same observed result:

```text
Authentication failed.
```

### Frontend lint

`npm run lint` completed with:

```text
96 problems (0 errors, 96 warnings)
```

Verdict: **PASS for the B0 executable gate**. Warnings remain visible and are technical-debt/optimization diagnostics; no lint error remains.

### Frontend production build

`npm run build` → **PASS**.

Observed Next.js output included successful compilation, TypeScript completion, static generation, and final optimization. The multiple-lockfile/workspace-root message remains a non-blocking warning.

## Current executable matrix

```text
Gallo seed                              ✅ PASS
Backend TypeScript build                ✅ PASS
Landing contract pack                   ✅ PASS
SectionInstance executable contract     ✅ PASS
Frontend lint                           ✅ PASS WITH WARNINGS
Frontend production build               ✅ PASS
Landing persistence integration         ◉ BLOCKED — LOCAL MONGO CREDENTIAL RESOLUTION
Landing public-frames integration       ◉ BLOCKED — LOCAL MONGO CREDENTIAL RESOLUTION
Builder interactive acceptance          ⛔ WAITING FOR INTEGRATION AUTH CLEARANCE
```

## Credential-resolution guidance

The safest local rule is:

1. Keep the exact `MONGO_URI` that is already proven by successful local Gallo seed execution.
2. Set only `MONGO_TEST_DATABASE=vtkall_demo_pack_1_landing_test` unless an explicit test URI is genuinely needed.
3. Prefer allowing `landingTestMongo.ts` to derive the test URI from the proven development URI, preserving the same working authentication while changing only the database name.
4. Do not copy example credentials over an existing initialized Mongo volume unless they are known to match the real root/user credentials.
5. Do not point integration tests at the development/business database.

## Gate

`P7 EXECUTABLE EVIDENCE — FRONTEND PASS / BACKEND CONTRACT PASS / INTEGRATION AUTH BLOCKED`

Do not merge/promote B0 until the two dedicated-database integration tests execute successfully.
