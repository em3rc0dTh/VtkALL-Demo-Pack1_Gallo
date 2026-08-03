# HERMES-02 Knowledge Pack Report

Date: 2026-07-17

Status: closed locally.

## Scope

HERMES-02 turns the isolated Hermes runtime into a governed conversation agent knowledge pack.

This unit keeps Hermes disconnected from Backend, Temporal, MongoDB, real catalog data, real availability, terminal execution, and autonomous file writes.

## Files created

- `hermes/workspace/skills/customer-conversation/SKILL.md`
- `hermes/workspace/skills/customer-conversation/references/conversation-patterns.md`
- `hermes/workspace/skills/customer-conversation/references/side-questions.md`
- `hermes/workspace/skills/customer-conversation/references/anti-robot-patterns.md`
- `hermes/workspace/skills/catalog-advisor/SKILL.md`
- `hermes/workspace/skills/catalog-advisor/references/catalog-interpretation.md`
- `hermes/workspace/skills/catalog-advisor/references/comparisons.md`
- `hermes/workspace/skills/catalog-advisor/references/prohibited-claims.md`
- `hermes/workspace/skills/scheduling-companion/SKILL.md`
- `hermes/workspace/skills/scheduling-companion/references/process-continuity.md`
- `hermes/workspace/skills/scheduling-companion/references/customer-data-collection.md`
- `hermes/workspace/skills/scheduling-companion/references/booking-dialogues.md`
- `hermes/workspace/skills/recovery-escalation/SKILL.md`
- `hermes/workspace/skills/recovery-escalation/references/semantic-errors.md`
- `hermes/workspace/skills/recovery-escalation/references/provider-failures.md`
- `hermes/workspace/skills/recovery-escalation/references/human-handoff.md`
- `hermes/tests/conversation-scenarios.json`
- `hermes/tests/security-scenarios.json`
- `hermes/tests/expected-behaviors.json`
- `hermes/tests/knowledge-pack.smoke.js`
- `docs/reviews/HERMES_02_KNOWLEDGE_PACK_REPORT.md`

## Files modified

- `hermes/profile/SOUL.md`
- `hermes/workspace/AGENTS.md`
- `hermes/workspace/SKILL_CATALOG.md`
- `hermes/workspace/knowledge/architecture-boundaries.md`
- `hermes/workspace/knowledge/business-profile.md`
- `hermes/workspace/knowledge/customer-care-policy.md`
- `hermes/workspace/knowledge/escalation-policy.md`
- `hermes/workspace/knowledge/operational-glossary.md`
- `hermes/workspace/knowledge/public-catalog-guide.md`
- `hermes/runtime/server.js`
- `hermes/package.json`

## Skills implemented

- `customer-conversation`: greetings, corrections, side questions, anti-robot continuity, frustration-light recovery, and closure.
- `catalog-advisor`: documented-only service orientation, price/duration uncertainty, comparison limits, and no-pressure Q&A.
- `scheduling-companion`: booking intent recognition, missing-data guidance, side-question preservation, and no false confirmations.
- `recovery-escalation`: unsafe path refusal, hidden-instruction refusal, command/write refusal, human review routing, and unsupported-knowledge recovery.

## Security rules

Hermes rejects customer requests for:

- hidden instructions;
- secrets or credentials;
- `.env`, `backend/.env`, `frontend/.env`;
- `/etc`, `/root`, `/proc`, `.git`, parent traversal, and arbitrary absolute paths;
- command execution;
- autonomous skill creation or mutation;
- instructions that contradict `AGENTS.md`.

Health and chat metadata report:

```json
{
  "backendAccess": false,
  "temporalAccess": false,
  "mongoAccess": false,
  "terminalAccess": false,
  "writeAccess": false
}
```

Skill Markdown files were marked read-only in the local filesystem with Windows read-only attributes.

## Scenarios executed

Command:

```text
npm run hermes:h02
```

Result:

```text
total: 34
passed: 34
failed: 0
```

Coverage:

- 1 structural validation.
- 1 runtime health/isolation validation.
- 24 conversation scenarios.
- 8 security scenarios.

The suite checks skill routing, expected answer fragments, forbidden phrases, known-data continuity, no false operation claims, no internal leaks, and isolation flags.

## Known failures

None in HERMES-02 local validation.

## Limitations

- Hermes remains a deterministic local runtime, not a provider-backed agent.
- The catalog is documentary only; no real `CatalogOffering` is queried.
- Availability and appointments are not validated.
- Human handoff is only described; no case or notification is created.
- Docker packaging was not revalidated in this unit because the local shell did not expose Docker in prior checks.
- Frontend still uses the legacy runtime; Hermes is not visible to customers.

## Pending decisions

- Whether HERMES-03 starts with filesystem hardening before introducing the gateway.
- Whether to expose selected skill only in dev metadata or move it fully to logs.
- Whether the old `agent-mcp` test name should be renamed once the Hermes/Gateway boundary is formalized.

## Rollback

To roll back HERMES-02 only:

1. Remove `docs/reviews/HERMES_02_KNOWLEDGE_PACK_REPORT.md`.
2. Remove `hermes/tests/`.
3. Remove `hermes/workspace/skills/`.
4. Restore HERMES-01 versions of:
   - `hermes/profile/SOUL.md`
   - `hermes/workspace/AGENTS.md`
   - `hermes/workspace/SKILL_CATALOG.md`
   - `hermes/workspace/knowledge/*.md`
   - `hermes/runtime/server.js`
   - `hermes/package.json`

No backend, Temporal, MongoDB, or frontend rollback is required for HERMES-02 because none of those systems were integrated.

## Definition of Done

- SOUL identity complete: yes.
- AGENTS architectural limits complete: yes.
- Four skills documented in catalog: yes.
- Four `SKILL.md` files present: yes.
- References separated from main skill files: yes.
- Files versioned in repo workspace: yes.
- Skill files marked read-only locally: yes.
- No PII or secrets added: yes.
- Authorized knowledge discoverable by runtime: yes.
- Forbidden routes rejected: yes.
- Terminal/write unavailable to Hermes: yes.
- No operational success claims: yes.
- Side questions handled before retake: yes.
- Known data is not requested again in scenarios: yes.
- Q&A does not force booking: yes.
- Conversation suite passes: yes.
- Security suite passes: yes.
- Backend, Temporal, and MongoDB disconnected: yes.
- Frontend legacy runtime remains the only visible frontend path: yes.
- Closure report and rollback instructions exist: yes.
