# Gallo Autos Workshop — Iteration 1 Acceptance Gate

**Date:** 2026-08-17  
**Branch:** `develop`  
**PR:** `#1 — Gallo Workshop Iteration 1 — acceptance gate`  
**Gate status:** `OPEN — CI MECHANISM BLOCKED / RUNTIME + VISUAL PROOF OPEN`

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

## Repository-native CI attempt

The repository workflow `.github/workflows/acceptance.yml` exists, is active and declares:

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

To obtain proof without merging to `main`:

1. draft PR `develop → main` was opened;
2. this acceptance record was committed to `develop`, synchronizing the PR head;
3. GitHub Actions/check endpoints were inspected.

Observed after PR open + synchronize:

```text
pull_request workflow runs     0
check-runs                     0
check-suites                   0
```

The connected integration can list the active workflow, but GitHub returns `403 Resource not accessible by integration` for the repository Actions-permissions endpoint.

Therefore the correct classification is:

```text
CI PASS      NOT CLAIMED
CI FAIL      NOT CLAIMED
CI BLOCKED   YES — no runner/check suite instantiated
```

A missing run is not converted into a passing or failing test result.

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
CI RUN / CHECK SUITE                ⛔ BLOCKED — NOT INSTANTIATED
FRONTEND LINT / BUILD PROOF         ◉ OPEN
BACKEND ACCEPTANCE PROOF            ◉ OPEN
BUILDER END-TO-END RUNTIME LOOP     ◉ OPEN
DESKTOP / TABLET / MOBILE QA        ◉ OPEN
ACCEPTANCE                          ⛔ NOT YET CLAIMED
MERGE / PROMOTION                   ⛔ BLOCKED
PRODUCTION ADOPTION                 ⛔ NOT CLAIMED
```

## Environment-level decision

The separate Gallo Environment documentation consolidation has now reached:

```text
RIGHT-TO-BUILD / CONTINUE-BUILD  PASS
CURRENT PILOT PROMOTION          BLOCKED BY THIS ACCEPTANCE GATE
```

Meaning:

- defects/testability inside this Landing/Builder slice may continue to be fixed on development branches;
- this open gate is not permission to call the slice accepted or production-ready;
- future scope must follow the consolidated Environment Build sequence and its own evidence gates.

## Next acceptance action

Restore or provide an executable proof mechanism for the existing acceptance chain, then run the GLB runtime/visual pack and update this record from actual evidence only.
