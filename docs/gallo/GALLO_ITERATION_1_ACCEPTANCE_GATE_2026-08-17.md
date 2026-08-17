# Gallo Autos Workshop — Iteration 1 Acceptance Gate

**Date:** 2026-08-17  
**Branch:** `develop`  
**PR:** `#1 — Gallo Workshop Iteration 1 — acceptance gate`  
**Purpose:** produce repository-native evidence before any merge to `main`.

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

A gate may be closed only with explicit evidence. The following states are distinct:

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

## CI gate

The repository workflow `.github/workflows/acceptance.yml` is expected to execute on pull requests and includes:

```text
backend build
landing / guardrail / core / idempotency tests
seed + seed verification
API pack tests
Hermes readiness / H14 / E2E
frontend lint
frontend build
```

The draft PR exists to obtain that evidence without merging `develop` into `main`.

## Landing Builder acceptance gate

The Builder slice is accepted only when evidence proves the complete loop:

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

## Domain-authority guardrail

The Builder controls public presentation only.

It does not become authority for:

```text
CRM identity / relationship
Workshop operational state
appointment confirmation
business-domain execution
```

Operational contact identity remains governed by BusinessProfile/domain authority boundaries.

## Current gate state at record creation

```text
IMPLEMENTED                         ✅
STATIC AUDIT                        ✅
DRAFT PR                            ✅
CI RUN                              ◉ NOT YET OBSERVED
FRONTEND LINT / BUILD PROOF         ◉ NOT YET OBSERVED
BUILDER END-TO-END RUNTIME LOOP     ◉ NOT YET OBSERVED
DESKTOP / TABLET / MOBILE QA        ◉ NOT YET OBSERVED
ACCEPTANCE                          ⛔ NOT YET CLAIMED
PRODUCTION ADOPTION                 ⛔ NOT CLAIMED
```

This record must be updated only from actual evidence; no gate is closed by intention.