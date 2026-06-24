# PLAN. PR-7 Case Operations UI v0

## Goal

Add a minimal admin dashboard UI to operate the backend Case flow introduced in PR-3A through PR-6.

The UI should let an authenticated admin list Cases, inspect one Case, create a Case, apply expert review, prepare quote price state, approve or reject the customer decision, and refresh the displayed state.

## Scope

```text
Add Case Operations tab to the existing admin dashboard.
Add frontend API helpers for /api/cases.
Create frontend/components/dashboard/TabCaseOperations.js.
Create docs and manual QA notes.
```

## Non-Goals

```text
No Ground Control.
No complete dashboard redesign.
No replacement of legacy tabs.
No advanced BandejaExperto UI.
No PDF.
No send quote.
No WhatsApp/SMS/email.
No Gemini integration.
No Temporal workflow.
No public approval link.
No payment/debt accounting.
No new models.
No backend changes unless a blocking bug is found.
No /api/citas changes.
```

## Baseline Assumptions

```text
Authorized PR-6 commit is 4442825e.
Current working baseline already includes later frontend commits bf23ee35 and 78260522.
Working tree was clean before PR-7 edits.
PR-7 branch is feat/poc-stable-core-pr7-case-operations-ui.
Existing dashboard uses component tabs under frontend/components/dashboard.
Existing frontend API client uses fetch with credentials: include.
```

## Files Expected To Change

```text
frontend/lib/api.js
frontend/app/admin/dashboard/page.js
```

## Files Expected To Be Created

```text
frontend/components/dashboard/TabCaseOperations.js
docs/PLAN. PR-7 Case Operations UI v0.md
docs/NOTE. PR-7 Case Operations UI v0 Execution Notes.md
docs/CHECKLIST. PR-7 Manual QA.md
```

## UI Contract

Add a new dashboard tab named:

```text
Operaciones Case
```

The tab uses a simple three-zone layout:

```text
Top: filters and create form.
Left: Case list.
Right: selected Case detail and action forms.
```

The UI prioritizes clarity and backend flow coverage over visual polish.

## API Client Contract

Add helpers to `frontend/lib/api.js`:

```text
obtenerCases(filters)
obtenerCasePorId(id)
crearCase(payload)
actualizarCaseStatus(id, status)
aplicarExpertReview(id, payload)
prepararCaseQuote(id, payload)
obtenerCaseQuote(id)
aprobarCase(id, payload)
rechazarCase(id, payload)
```

Keep the existing request behavior and `credentials: include`.

## Case List Behavior

Filters:

```text
status
search
```

Each list item should show customer, phone, public status, legacy status, service/description, managed entity summary, estimated/final price and date context where available.

Selecting a Case loads full detail and attempts `GET /api/cases/:id/quote`. A 404 quote response is rendered as "Sin cotizacion preparada".

## Case Detail Behavior

Show public Case DTO fields only:

```text
id
businessSlug / vertical
customer
managedEntity
service
description
status / legacyStatus
expertNotes
estimatedPrice / finalPrice
evidence
scheduledDate
createdAt / updatedAt
derived quote state
```

Do not expose raw `Cita`.

## Create Case Behavior

Create Case form fields:

```text
customer.name
customer.phone
customer.dni optional
customer.email optional
description
managedEntity.type
managedEntity.summary
managedEntity.data optional JSON textarea
scheduledDate optional
status default intake
```

Frontend validation stays minimal:

```text
Require name, phone and description.
Validate managedEntity.data as JSON only when provided.
Show backend validation errors.
On success, refresh list and select the new Case.
```

## Expert Review Behavior

Expert Review form fields:

```text
expertNotes
proposedPrice
finalPrice
estimatedDeliveryDate
evidenceUrls textarea, one URL per line
transitionTo waiting_customer | expert_review
sendToCustomer boolean with wording that no message is sent
```

Action:

```text
POST /api/cases/:id/expert-review
```

After success:

```text
Refresh selected Case.
Refresh Case list.
Refresh quote where applicable.
```

## Quote Decision Behavior

Quote form fields:

```text
summary
proposedPrice
finalPrice
currency default PEN
terms
validUntil
estimatedDeliveryDate
transitionTo waiting_customer
```

Actions:

```text
POST /api/cases/:id/quote
GET /api/cases/:id/quote
POST /api/cases/:id/approve
POST /api/cases/:id/reject
```

Show clear warning:

```text
This quote is not sent to the customer yet. No PDF, WhatsApp, SMS or email is generated in this version.
```

Use basic `window.confirm` before approve/reject.

## Error Handling

Use local component state for:

```text
loading
action loading
empty state
success message
error message
backend validation errors
quote 404 as non-fatal "Sin cotizacion preparada"
```

Do not introduce a global toast system.

## Risk Areas

```text
UI can imply quote sending even though backend sends nothing.
Approve/reject actions are strong state transitions.
Managed entity JSON textarea can produce invalid JSON.
Existing branch contains pre-PR-7 frontend commits and a prior backend Gemini-related commit; PR-7 implementation must avoid touching those files further.
```

## Validation Plan

```text
[ ] npm run lint --prefix frontend
[ ] npm run build --prefix frontend if feasible
[ ] npm run dev:frontend
[ ] Admin dashboard loads
[ ] New Case Operations tab appears
[ ] GET /api/cases populates list
[ ] Selecting a Case shows detail
[ ] Creating Case works and selects new Case
[ ] Expert Review works with notes only
[ ] Expert Review can transition to waiting_customer
[ ] Quote price state can be prepared
[ ] GET quote displays derived quote or Sin cotizacion preparada
[ ] Approve maps status to approved/confirmada
[ ] Reject maps status to cancelled/cancelada
[ ] Backend validation errors display in UI
[ ] Existing dashboard tabs still load
[ ] No backend model changes
[ ] No Gemini changes in PR-7 work
[ ] No /api/citas changes
```

## Rollback Notes

Revert this PR. No database or backend schema rollback is required. Existing legacy dashboard tabs should remain available after rollback.
