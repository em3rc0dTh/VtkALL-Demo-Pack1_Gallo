# PLAN. PR-2 Vertical Config Without Migration

## Goal

Introduce the first stable Vertical Config layer for the backend so VertikALL can resolve the active business and vertical from environment variables without migrating data, changing models, changing routes, or altering the frontend UI.

## Scope

- Add registry-based configs for `turagua`, `bateylate`, and `repair-demo`.
- Add services for active vertical config, labels, statuses, and prompt resolution.
- Add safe public endpoint `GET /api/vertical-config`.
- Add minimal frontend label helpers and API accessor without using them in visual components.
- Extend central environment config with `VERTIKALL_BUSINESS`, `VERTIKALL_VERTICAL`, and `VERTIKALL_CONFIG_STRICT`.
- Add separate base prompts per vertical.

## Non-Goals

- No database migration.
- No `/api/cases`.
- No `CaseService`.
- No model changes.
- No changes to `backend/routes/citas.js`.
- No frontend visual changes.
- No dashboard refactor.
- No editable config UI.
- No multitenancy or tenant permissions.
- No split of seed logic by business.
- No full AI workflow rewrite.

## Files Expected To Change

```text
backend/config/env.js
backend/index.js
backend/services/gemini.js
frontend/lib/api.js
.env.example
backend/.env.example
docs/NOTE. PR-1 Stable Core Execution Notes.md
```

## Vertical Config Contract

Each business config will expose:

```text
businessSlug
businessName
vertical
labels
legacy
statuses.canonical
statuses.toLegacyCita
statuses.fromLegacyCita
copy
features
promptKey
```

The public endpoint will expose only safe frontend-facing data:

```text
businessSlug
businessName
vertical
labels
statuses.canonical
copy
features
```

## Environment Variables

```env
VERTIKALL_BUSINESS=turagua
VERTIKALL_VERTICAL=vehicle_service
VERTIKALL_CONFIG_STRICT=false
```

Development defaults:

- Missing `VERTIKALL_BUSINESS` falls back to `turagua`.
- Missing `VERTIKALL_VERTICAL` is inferred from the active business.
- Invalid values fall back with a warning when strict mode is disabled.

Strict behavior:

- When `VERTIKALL_CONFIG_STRICT=true`, invalid business or vertical configuration fails early.
- This is especially important for production deployments.

## Implementation Steps

1. Create vertical config files and registry.
2. Extend `backend/config/env.js` with vertical-related variables and validation helpers.
3. Create `verticalConfigService`, `labelService`, `statusService`, and `promptRegistryService`.
4. Create base prompt modules for each vertical and prompt registry.
5. Add `backend/routes/verticalConfig.js` and mount it in `backend/index.js`.
6. Add frontend helper `frontend/lib/verticalLabels.js`.
7. Add `api.obtenerVerticalConfig()` in `frontend/lib/api.js`.
8. Optionally integrate prompt registry into `gemini.js` in a minimal, low-risk way; avoid changing tool names, workflows, route behavior, or booking logic.
9. Update examples/docs with the new env variables.
10. Validate syntax, service behavior, endpoint output, fallback behavior, and strict failure.

## Risk Areas

- The current Gemini prompt is large and tightly coupled to vehicle-service language; full replacement could affect chat behavior, so this PR should only prepend or expose vertical prompt context if done safely.
- Strict env validation must not break local development defaults.
- Public config must not expose env values, secrets, or internal legacy mappings.
- Status mapping must tolerate unknown values because legacy data may contain states outside the new canonical map.
- PR-2 is layered on top of local PR-1 changes that are not committed yet.

## Validation Plan

```text
[ ] node --check on new and modified backend files.
[ ] Import env/config/services with default development settings.
[ ] Verify Turagua active config and public payload.
[ ] Verify BateYLate active config and public payload.
[ ] Verify Repair Demo active config and public payload.
[ ] Verify unknown business falls back when VERTIKALL_CONFIG_STRICT=false.
[ ] Verify unknown business fails early when VERTIKALL_CONFIG_STRICT=true.
[ ] Start backend with seed, recordatorios, and Temporal disabled, then call GET /api/vertical-config.
[ ] Verify frontend helper/API modules parse.
```

## Rollback Notes

Revert this PR to remove the Vertical Config layer. The existing `Cita`, `Cliente`, `Taller`, auth, upload, Temporal, and dashboard behavior should remain intact because this PR does not migrate data or replace existing routes.
