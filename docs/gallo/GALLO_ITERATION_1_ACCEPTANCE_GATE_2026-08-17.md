# Gallo Autos Workshop — Iteration 1 Acceptance Gate

**Date:** 2026-08-17  
**Branch:** `develop`  
**PR:** `#1 — Gallo Workshop Iteration 1 — B0 acceptance gate`  
**Gate status:** `OPEN — SOURCE HARDENED / ACTIONS EXECUTION BLOCKED / RUNTIME + VISUAL PROOF OPEN`

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
TEST CONTRACT AUTHORED
CI VERIFIED
RUNTIME VERIFIED
VISUALLY VERIFIED
ACCEPTED
PRODUCTION ADOPTED
```

No earlier state implies a later one.

## B0 source-hardening round

A dedicated source audit is recorded at:

```text
docs/audits/GALLO_B0_SOURCE_HARDENING_2026-08-17.md
```

The round corrected these source-level defects:

```text
mock-read → API-write mismatch in Gallo admin
Builder controls not fully projected in public renderer
image-only rendering despite allowed video uploads
Evidence omitted from derived public navigation
active scene fragility across hide/reorder
stale landing seed-count contract test
missing Gallo draft/publish/reconnect persistence coverage
non-monotonic published-version risk for seeded v3 content
fragile partner/insurance mark selectors
```

Current source now includes:

```text
GalloWorkshopExperienceV4
Gallo wrapper → V4
Gallo admin authoritative API read/write seam
V4 preview marker
Gallo contract assertions
Gallo persistence integration scenario
monotonic landing version reconciliation
stabilized partner/insurer mark projection
```

These changes are **not** runtime acceptance by themselves.

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

Subsequent B0 source commits also continue to expose no PR workflow run/status through the connected GitHub integration.

The connected integration can list the active workflow, but GitHub returns `403 Resource not accessible by integration` for the repository Actions-permissions endpoint.

## CI diagnosis

Correct classification:

```text
CI PASS      NOT CLAIMED
CI FAIL      NOT CLAIMED
CI BLOCKED   YES
```

> **The acceptance workflow is defined and active, but GitHub does not instantiate an observable workflow run/check suite for the tested PR/develop paths. The remaining boundary is Actions execution/configuration/permission at repository or organization/platform level, which this integration cannot inspect through the permissions endpoint.**

Do not create additional no-op commits merely to provoke Actions.

A missing run is never converted into a passing or failing test result.

## Strengthened technical acceptance contract

Once an executable environment is available, B0 must now execute the strengthened landing gate, including:

```text
landing contract accepts demo_test + turagua + gallo
Gallo seed keeps 8 semantic scenes
Gallo seed variants/order remain deterministic
Gallo B0 does not silently enable Agent/Hermes
Gallo contact presentation does not imply automatic appointment confirmation
Gallo draft edits do not leak before publish
Gallo reorder/hide/media edits persist through publish
Gallo published state survives Mongo reconnect
Landing version history progresses monotonically
```

The tests are authored in source, not yet claimed executed.

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
→ upload supported video
→ video renders where claimed
→ publish
→ public landing matches published projection
```

Required viewport review:

```text
desktop
tablet
mobile
```

Partner/insurer review must confirm that visual marks appear and the insurance lane is not cut below the scene viewport.

Production polish still requires curated/local managed partner assets rather than external favicon identity.

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
LANDING / BUILDER IMPLEMENTED            ✅
B0 SOURCE HARDENING                      ✅ CHECK
STATIC AUDIT                             ✅
DRAFT PR                                 ✅
TECHNICAL TEST CONTRACT STRENGTHENED     ✅
CI WORKFLOW DEFINED / ACTIVE             ✅
PR TRIGGER PROBE                         ⛔ NO RUN INSTANTIATED
DEVELOP PUSH TRIGGER PROBE               ⛔ NO RUN INSTANTIATED
FRONTEND LINT / BUILD PROOF              ◉ OPEN / BLOCKED BY EXECUTION ENVIRONMENT
BACKEND ACCEPTANCE EXECUTION             ◉ OPEN / BLOCKED BY EXECUTION ENVIRONMENT
BUILDER END-TO-END RUNTIME LOOP          ◉ OPEN
DESKTOP / TABLET / MOBILE QA             ◉ OPEN
PARTNER / INSURER VISUAL QA              ◉ OPEN
ACCEPTANCE                               ⛔ NOT YET CLAIMED
MERGE / PROMOTION                        ⛔ BLOCKED
PRODUCTION ADOPTION                      ⛔ NOT CLAIMED
```

## Environment-level decision

```text
RIGHT-TO-BUILD / CONTINUE-BUILD  PASS
CURRENT PILOT PROMOTION          BLOCKED BY THIS B0 ACCEPTANCE GATE
```

Meaning:

- defects/testability inside this Landing/Builder slice may continue to be fixed on development branches;
- this open gate is not permission to call the slice accepted or production-ready;
- future scope must follow the consolidated Environment Build sequence and its own evidence gates.

## Next acceptance action

Establish an executable proof environment for the strengthened acceptance chain, then run the GLB runtime/visual pack and update this record from actual evidence only.
