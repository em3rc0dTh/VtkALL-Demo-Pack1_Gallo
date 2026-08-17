# Gallo Autos Workshop — Iteration 1 Acceptance Gate

**Date:** 2026-08-17  
**Branch:** `develop`  
**PR:** `#1 — Gallo Workshop Iteration 1 — B0 acceptance gate`  
**Gate status:** `OPEN — ACTIONS EXECUTION BLOCKED / RUNTIME + VISUAL PROOF OPEN`

## Scope under acceptance

```text
Gallo Workshop Landing Iteration 1
+ Landing Builder parity
+ landing seed / migration / publish path
```

Explicitly outside this gate:

```text
Pinta tu coche
Gallo Agent / Hermes redesign
CRM / Workshop Core implementation
production adoption
```

## Evidence classes

```text
IMPLEMENTED
STATICALLY AUDITED
CI VERIFIED
RUNTIME VERIFIED
VISUALLY VERIFIED
ACCEPTED
PRODUCTION ADOPTED
```

No earlier state implies a later one.

## Repository-native CI investigation

The repository workflow `.github/workflows/acceptance.yml` is active. The original workflow declared:

```text
pull_request
push → main
```

Its acceptance chain includes:

```text
backend build
landing / guardrail / core / idempotency tests
seed + seed verification
API pack tests
Hermes readiness / H14 / E2E
frontend lint
frontend build
```

### Probe A — pull request

To obtain proof without merging to `main`:

1. draft PR `develop → main` was opened;
2. the PR head was synchronized repeatedly;
3. GitHub Actions/check endpoints were inspected.

Observed:

```text
pull_request workflow runs     0
check-runs                     0
check-suites                   0
```

### Probe B — direct `develop` push

B0 permits repair of the acceptance mechanism, so the workflow was minimally changed on `develop` to:

```yaml
on:
  pull_request:
  workflow_dispatch:
  push:
    branches:
      - main
      - develop
```

The change was committed as:

```text
068eaf51f103eb0ea96fcc8feeb43e0e4b8a8784
ci: run acceptance on develop
```

This should create a `push` run when GitHub Actions execution is available.

Observed for that exact SHA:

```text
workflow runs     0
check-suites      0
```

The connected integration can list the active workflow, but GitHub returns `403 Resource not accessible by integration` for the repository Actions-permissions endpoint.

## CI diagnosis

The evidence now rules out a missing PR synchronize and a branch-filter-only explanation.

Correct classification:

```text
CI PASS      NOT CLAIMED
CI FAIL      NOT CLAIMED
CI BLOCKED   YES
```

More specifically:

> **The acceptance workflow is defined and active, but GitHub does not instantiate a workflow run/check suite for either the PR synchronization path or a direct `develop` push that explicitly matches the workflow trigger. The remaining likely boundary is Actions execution/configuration/permission at repository or organization/platform level, which this connected integration cannot inspect because the permissions endpoint returns 403.**

Do not create additional no-op commits merely to provoke Actions. The next technical proof must come from an executable authenticated runner/environment or repaired GitHub Actions configuration/permissions.

A missing run is never converted into a passing or failing test result.

## Landing Builder runtime acceptance gate

The Builder slice becomes accepted only when evidence proves:

```text
edit text
→ live preview changes
→ save draft
→ reload admin
→ edit persists
→ reorder scene
→ public navigation follows visible scene order
→ upload image
→ image persists
→ publish
→ public landing matches published projection
```

Required viewport review:

```text
desktop
tablet
mobile
```

Additional capability-specific verification:

```text
video rendering where video support is claimed
curated/local brand + insurer assets before production polish sign-off
```

## Domain-authority guardrail

The Builder controls public presentation only.

It does not become authority for:

```text
CRM identity / relationship
Workshop operational state
appointment confirmation
business-domain execution
orchestration state
```

Operational contact identity remains governed by BusinessProfile/domain authority boundaries.

## Current gate matrix

```text
IMPLEMENTED                         ✅
STATIC AUDIT                        ✅
DRAFT PR                            ✅
CI WORKFLOW DEFINED / ACTIVE        ✅
PR TRIGGER PROBE                    ⛔ NO RUN INSTANTIATED
DEVELOP PUSH TRIGGER PROBE          ⛔ NO RUN INSTANTIATED
FRONTEND LINT / BUILD PROOF         ◉ OPEN / BLOCKED BY EXECUTION ENVIRONMENT
BACKEND ACCEPTANCE PROOF            ◉ OPEN / BLOCKED BY EXECUTION ENVIRONMENT
BUILDER END-TO-END RUNTIME LOOP     ◉ OPEN
DESKTOP / TABLET / MOBILE QA        ◉ OPEN
ACCEPTANCE                          ⛔ NOT YET CLAIMED
MERGE / PROMOTION                   ⛔ BLOCKED
PRODUCTION ADOPTION                 ⛔ NOT CLAIMED
```

## Environment-level decision

The Gallo Environment documentation consolidation is frozen as:

```text
RIGHT-TO-BUILD / CONTINUE-BUILD  PASS
CURRENT PILOT PROMOTION          BLOCKED BY THIS B0 ACCEPTANCE GATE
```

Meaning:

- defects/testability inside this Landing/Builder slice may continue to be fixed on development branches;
- this open gate is not permission to call the slice accepted or production-ready;
- future scope must follow the consolidated Environment Build sequence and its own evidence gates.

## Next acceptance action

Establish an executable proof environment for the existing acceptance chain, then run the GLB runtime/visual pack and update this record from actual evidence only.
