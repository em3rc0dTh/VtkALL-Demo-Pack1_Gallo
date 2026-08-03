# HERMES-05 Controlled Primary Q&A Report

Date: 2026-07-17

Status: HERMES-05 closed. Hermes visible Q&A is implemented behind a positive allowlist, canary gated, validated before display, and disabled by default.

## HERMES-05A

Status: CLOSED.

Router summary:

- allowlist-first categories:
  - `greeting`
  - `agent_identity`
  - `business_information`
  - `catalog_list`
  - `catalog_detail`
  - `catalog_comparison`
  - `general_faq`
- priority exclusions:
  - feature disabled
  - not in canary
  - security risk
  - attachment present
  - active process
  - active operational case
  - booking request
  - availability request
  - personal-data write
  - cancellation request
  - reschedule request
  - confirmation request
  - ambiguous message
  - unsupported category / insufficient context

Policy result:

```text
saludo sin proceso -> Hermes
pregunta de identidad -> Hermes
lista de servicios -> Hermes
detalle de servicio -> Hermes
comparacion -> Hermes
reserva -> legacy
disponibilidad -> legacy
dato personal -> legacy
cancelacion -> legacy
reprogramacion -> legacy
mensaje ambiguo -> legacy
attachment -> legacy
proceso activo -> legacy
case operacional activo -> legacy
feature disabled -> legacy
not in canary -> legacy
security risk -> legacy
```

Command:

```text
npm run hermes:h05:routing
```

Result:

```text
total: 17
passed: 17
failed: 0
```

## HERMES-05B

Status: CLOSED.

Visible Hermes path:

- inbound persists exactly once through the central interaction service;
- H04 visible history and read-only context are loaded before eligibility;
- eligible Q&A turns call Hermes in `qa_primary` mode;
- accepted Hermes reply persists as:

```text
visibility=customer
interactionType=agent_message
participant.runtime=hermes
metadata.runtimeMode=qa_primary
```

- public DTO remains unchanged;
- visible history now supports mixed `legacy` and `hermes` assistant turns without exposing runtime metadata.

Command:

```text
npm run hermes:h05:visible
```

Result:

```text
total: 5
passed: 5
failed: 0
```

## HERMES-05C

Status: CLOSED.

Canary and fallback:

- stable bucket:

```text
hash(businessSlug + ":" + conversationId) % 100
```

- default flags remain:

```text
HERMES_QA_VISIBLE_ENABLED=false
HERMES_QA_CANARY_PERCENT=0
HERMES_QA_FAIL_OPEN=true
HERMES_QA_REQUIRE_NO_ACTIVE_PROCESS=true
HERMES_QA_MAX_REPLY_CHARS=3000
```

- fail-open fallback to legacy covers:
  - Hermes unavailable
  - invalid response
  - rejected visible candidate
  - context failure
  - other unexpected exceptions

Visible-response validator blocks:

- empty reply
- excessive length
- unauthorized action claim
- false availability
- internal leakage
- filesystem path leakage
- prompt disclosure
- raw internal IDs
- secret leakage
- unsupported invented price
- visible JSON boilerplate
- provider boilerplate

Rejected Hermes candidates remain internal only:

```text
visibility=shadow
interactionType=shadow_response
participant.runtime=hermes
metadata.runtimeMode=qa_candidate_rejected
```

Commands:

```text
npm run hermes:h05:fallback
```

Result:

```text
total: 8
passed: 8
failed: 0
```

## HERMES-05D

Status: CLOSED.

End-to-end scenarios verified against real Mongo:

- Hermes visible:
  - greeting
  - identity
  - real catalog list
  - real published duration
  - price not published
  - catalog comparison
  - known-customer read-only follow-up
- legacy fallback:
  - booking
  - availability
  - personal data write
  - rename
  - cancellation
  - slot selection
  - ambiguous continuation
  - attachment
  - active process
  - active operational case
  - Hermes failure
  - invalid Hermes candidate
- restart reconstruction:
  - persisted Hermes visible turn reloads as `role=assistant`
- isolation:
  - no cross-conversation leakage
  - no cross-business private data leakage

Command:

```text
npm run hermes:h05:e2e
```

Result:

```text
total: 24
passed: 24
failed: 0
```

## Persistence

Accepted visible Hermes:

```text
one inbound visible
one Hermes visible outbound
zero legacy visible outbound
```

Fallback:

```text
one inbound visible
one legacy visible outbound
zero Hermes visible outbound
optional rejected Hermes shadow/internal row
```

## Guardrails

Added GR-41 through GR-55:

- GR-41 Hermes visible requires explicit positive eligibility
- GR-42 Ambiguous turns route to legacy
- GR-43 Active process routes to legacy during H05
- GR-44 Availability requests route to legacy
- GR-45 Transactional intent routes to legacy
- GR-46 Hermes visible response must pass validation
- GR-47 Rejected Hermes candidate cannot become customer-visible
- GR-48 A turn can persist only one visible outbound
- GR-49 Hermes accepted path cannot execute legacy side effects
- GR-50 Public DTO cannot expose routing or Hermes metadata
- GR-51 H05 flags default disabled
- GR-52 Frontend cannot select the runtime
- GR-53 Personal-data writes route to legacy
- GR-54 Attachments route to legacy during H05
- GR-55 Hermes H05 cannot import Temporal or write services

Validation:

```text
backend guardrails: PASS 55/55
```

## Fixtures

H05 fixture prefixes:

```text
hermes-h05-
```

Observed test cleanup counts:

- H05A:
  - `CatalogOffering created=2 removed=2`
- H05B:
  - `CustomerInteraction created=2 removed=2`
  - `CatalogOffering created=2 removed=2`
- H05C:
  - `CustomerInteraction created=3 removed=3`
  - `CatalogOffering created=2 removed=2`
- H05D:
  - repeated isolated runs; final residue check passed

Residue check:

```text
CustomerInteraction=0
Customer=0
ManagedEntity=0
Case=0
CatalogOffering=0
```

## Full Validation

Command:

```text
npm run hermes:h05
```

Result:

```text
Mongo readiness: PASS 13/13
HERMES-02 regression: PASS 34/34
HERMES-03 regression: PASS
HERMES-04 regression: PASS
HERMES-05A: PASS 17/17
HERMES-05B: PASS 5/5
HERMES-05C: PASS 8/8
HERMES-05D: PASS 24/24
backend guardrails: PASS 55/55
backend build: PASS
legacy agent tests: PASS
frontend build: PASS
frontend lint quiet: PASS
fixture residue: PASS
```

## Public DTO

Public response shape remains unchanged. No routing decision, canary bucket, eligibility metadata, selected skill, or Hermes internals are exposed to the frontend.

## Security Check

- Hermes visible remains read-only.
- Hermes visible does not access MongoDB directly.
- Hermes visible does not access Temporal directly.
- Active process and active operational case are fail-closed to legacy.
- Pricing not published is not invented.
- Availability is never claimed by Hermes in H05.
- Secrets, API keys, Mongo URI, and real PII are not included in this report.

## Limitations

- HERMES-05 only activates on the open conversation path without an active workflow.
- Side-question handling during active operational processes still belongs to a later unit.
- `backend/dist` was regenerated by the verified build; no destructive cleanup was performed in this run.

## Rollback

Immediate rollback remains:

```text
HERMES_QA_VISIBLE_ENABLED=false
HERMES_QA_CANARY_PERCENT=0
HERMES_SHADOW_ENABLED=true
AGENT_RUNTIME_MODE=legacy
```

Effect:

```text
Hermes stops being publicly visible.
Legacy resumes all public turns.
Persisted visible Hermes history remains intact.
No Temporal changes are required.
```

## Next Step

Authorized next step:

```text
HERMES-06 Transactional Scheduling Companion
```

Not implemented here:

```text
booking
availability
schedule continuation
Temporal start
Temporal signal
Temporal update
attachments
Hermes tools
legacy removal
```
