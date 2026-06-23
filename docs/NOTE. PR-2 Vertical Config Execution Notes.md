# NOTE. PR-2 Vertical Config Without Migration

## What Was Implemented

Implemented the first Vertical Config layer without migrating data or changing existing UI/model behavior. The backend can now resolve an active business and vertical from centralized environment config, expose a safe public config endpoint, map canonical statuses to legacy `Cita` statuses, resolve labels, and select a base prompt by vertical.

PR-2 was implemented on top of the local PR-1 branch because PR-1 was not merged/committed in this workspace yet.

## Files Changed

```text
.env.example
.env.prod-example
backend/.env.example
backend/config/env.js
backend/index.js
backend/services/gemini.js
docker-compose.yml
frontend/lib/api.js
```

## Files Created

```text
backend/config/verticals/index.js
backend/config/verticals/turagua.js
backend/config/verticals/bateylate.js
backend/config/verticals/repairDemo.js
backend/services/verticalConfigService.js
backend/services/labelService.js
backend/services/statusService.js
backend/services/promptRegistryService.js
backend/routes/verticalConfig.js
backend/prompts/verticals/index.js
backend/prompts/verticals/turagua.prompt.js
backend/prompts/verticals/bateylate.prompt.js
backend/prompts/verticals/repairDemo.prompt.js
frontend/lib/verticalLabels.js
docs/PLAN. PR-2 Vertical Config Without Migration.md
docs/NOTE. PR-2 Vertical Config Execution Notes.md
docs/CHECKLIST. PR-2 Manual QA.md
```

## Configuration Changes

```env
VERTIKALL_BUSINESS=turagua
VERTIKALL_VERTICAL=vehicle_service
VERTIKALL_CONFIG_STRICT=false
```

No real secrets were added.

## Vertical Configs Added

```text
turagua
bateylate
repair-demo
```

## Backend Behavior

Active business:

```text
Resolved from VERTIKALL_BUSINESS.
Development/default fallback: turagua.
Supported values: turagua, bateylate, repair-demo.
```

Active vertical:

```text
Resolved from VERTIKALL_VERTICAL when valid and matching the active business.
If missing, inferred from business.
turagua -> vehicle_service
bateylate -> custom_orders
repair-demo -> technical_repair
```

Labels:

```text
Resolved through labelService from the active vertical config.
formatEntityLabel supports singular/plural labels including managedEntity -> managedEntities.
```

Statuses:

```text
statusService maps canonical statuses to legacy Cita statuses and legacy Cita statuses back to canonical keys.
Unknown statuses are returned unchanged with a warning unless VERTIKALL_CONFIG_STRICT=true.
```

Prompt key:

```text
promptRegistryService resolves the active prompt from config.promptKey.
Gemini integration is partial: the active vertical prompt is prepended to the existing system prompt, but the legacy tool names and booking flow were not rewritten.
```

Public vertical config:

```text
GET /api/vertical-config returns ok: true and a safe config payload.
It exposes businessSlug, businessName, vertical, labels, statuses.canonical, copy and features.
It does not expose env, secrets, legacy mappings or internal field names.
```

## Commands Executed

```powershell
git branch --show-current
git log --oneline --decorate -5
git checkout -b feat/poc-stable-core-pr2
node --check backend\config\env.js
node --check backend\config\verticals\index.js
node --check backend\services\verticalConfigService.js
node --check backend\services\labelService.js
node --check backend\services\statusService.js
node --check backend\services\promptRegistryService.js
node --check backend\routes\verticalConfig.js
node --check backend\services\gemini.js
node --check frontend\lib\verticalLabels.js
node --check frontend\lib\api.js
node --input-type=module -e "<vertical config import validation>"
node --input-type=module -e "<label/status/prompt helper validation>"
node backend\index.js
npm run dev:backend
git diff --check HEAD
```

## Manual Validation

```text
[PASS] Syntax checks passed for new and modified backend modules.
[PASS] Syntax checks passed for frontend/lib/verticalLabels.js and frontend/lib/api.js.
[PASS] Backend resolves VERTIKALL_BUSINESS=turagua and VERTIKALL_VERTICAL=vehicle_service.
[PASS] GET /api/vertical-config returns Turagua labels.
[PASS] Backend resolves VERTIKALL_BUSINESS=bateylate and VERTIKALL_VERTICAL=custom_orders.
[PASS] GET /api/vertical-config returns BateYLate labels.
[PASS] Backend resolves VERTIKALL_BUSINESS=repair-demo and VERTIKALL_VERTICAL=technical_repair.
[PASS] GET /api/vertical-config returns Repair Demo labels.
[PASS] Unknown business falls back to Turagua when VERTIKALL_CONFIG_STRICT=false.
[PASS] Unknown business fails early when VERTIKALL_CONFIG_STRICT=true.
[PASS] labelService returns singular/plural vertical labels.
[PASS] statusService maps expert_review to revision_maestro and confirmada to approved.
[PASS] promptRegistryService resolves the Turagua prompt from active config.
[PASS] npm run dev:backend starts and /health returns ok: true with PR-2 config.
[PASS] git diff --check HEAD reported no whitespace errors; only existing CRLF conversion warnings appeared.
[NOT RUN] docker compose config was not run in this PR-2 pass because Docker CLI availability was not confirmed in this workspace.
```

## Known Limitations

```text
No database migration.
No /api/cases.
No CaseService.
No visual frontend changes.
Existing /api/citas still uses legacy states directly.
Gemini prompt integration is partial; the active vertical prompt is prepended, but full prompt/tool verticalization is deferred.
Seeds are not split by business yet.
No multitenancy.
No editable vertical config UI.
No CSRF protection changes.
```

## Risks / Follow-Up Items

```text
PR-3 should introduce CaseService over Cita using statusService instead of rewriting Cita directly.
Gemini still has legacy automotive wording in the main prompt body; future PRs should split the prompt and tools by vertical more deliberately.
The legacy seed still contains mixed Turagua/BateYLate content and should be split later.
Frontend helpers are available but not wired into components yet.
Public config is intentionally unauthenticated; keep payload limited to safe display/config data.
Strict mode should be enabled in production once deployment env values are reviewed.
```

## Deviations From Original Plan

```text
docker-compose.yml was updated to pass VERTIKALL_BUSINESS, VERTIKALL_VERTICAL and VERTIKALL_CONFIG_STRICT into the backend container because backend.environment is an explicit list. This keeps Compose aligned with PR-2 config without adding Docker profiles or changing services.
Gemini integration was kept partial and low-risk: active vertical prompt is prepended, while tools, workflow names and booking logic remain unchanged.
```

## Rollback Notes

```text
Revert this PR.
Remove /api/vertical-config route registration if reverting manually.
Remove vertical config services, prompt registry and frontend label helpers.
Restore previous env behavior if needed.
No database rollback is required because this PR does not migrate or write schema changes.
```
