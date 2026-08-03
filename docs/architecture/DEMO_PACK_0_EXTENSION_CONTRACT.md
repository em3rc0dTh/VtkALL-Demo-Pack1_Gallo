# Demo Pack 0 Extension Contract

`demo_test` is the historical laboratory. `Demo_Pack_0` is the neutral base pattern extracted from it.

## Core Ownership

Pack 0 owns the reusable execution spine:

- BusinessProfile
- Customer
- ManagedEntity
- Case
- CatalogOffering
- WorkTeam
- Availability
- ResourceReservation
- Appointment
- TimelineEvent
- ExecutionContext
- SemanticError
- Idempotency
- Temporal workflows and activities
- Hermes runtime boundaries
- Frontend/backend repository boundary

Vertical packs must configure this spine instead of duplicating it.

## BusinessProfile Configuration

A vertical configures identity, labels, feature flags, landing content, agent naming, timezone, and public catalog semantics through `BusinessProfile`.

The neutral Pack 0 profile is `demo_test`. Vertical examples, including `turagua`, are fixtures selected by `businessSlug`.

## VerticalAdapter Boundary

A `VerticalAdapter` may define vertical vocabulary, required managed-entity fields, service-specific validation, and presentation defaults.

It must not own persistence, idempotency, reservation authority, Temporal workflow state, or timeline writes. Those remain Pack 0 core responsibilities.

## Demo Pack Overrides

A `Demo_Pack_#` may add:

- Seed data for its vertical namespace.
- Catalog offerings and team schedules.
- Labels, copy, and landing content.
- Optional domain-specific validation behind adapter boundaries.
- Tests proving mock/API parity for its own fixture.

It must not duplicate the Pack 0 scheduling flow, domain models, resource reservation rules, or Hermes orchestration contracts.

## Promotion Gate

The canonical acceptance entrypoint is:

```powershell
npm run test:pack-0:acceptance
```

It covers backend build, guardrails, core contract, idempotency, neutral seed inspection, API pack verification, Temporal readiness, Hermes runtime invariants, E2E scheduling flow, frontend lint, and frontend build.
