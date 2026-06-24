# CHECKLIST. PR-7 Manual QA

## Static / Build Checks

```text
[PASS] PR-7-target ESLint: components/dashboard/TabCaseOperations.js, app/admin/dashboard/page.js, lib/api.js.
[PASS] npm run build --prefix frontend.
[PASS] npm run dev:frontend served /admin/dashboard with HTTP 200.
[PASS] Backend /health returned HTTP 200.
[PASS] Backend /api/vertical-config returned HTTP 200.
[PASS] Backend /api/cases returned HTTP 401 without auth.
[WARN] Global npm run lint --prefix frontend fails due to pre-existing errors outside PR-7 scope.
```

## Dashboard Shell

```text
[PASS] New Case Operations tab is registered in the dashboard navigation.
[NOT RUN] Manual browser login and click-through for the tab.
[NOT RUN] Existing dashboard tab visual click-through.
```

## Case List / Detail

```text
[NOT RUN] Authenticated GET /api/cases populates list in browser.
[NOT RUN] Selecting a Case shows detail in browser.
[NOT RUN] GET /api/cases/:id/quote displays derived quote in browser.
[NOT RUN] Quote 404 displays "Sin cotizacion preparada" in browser.
```

## Create Case

```text
[NOT RUN] Creating Case from the UI.
[NOT RUN] managedEntity.data valid JSON path.
[NOT RUN] managedEntity.data invalid JSON error path.
[NOT RUN] Backend validation error display for create form.
```

## Expert Review

```text
[NOT RUN] Expert Review with notes only from UI.
[NOT RUN] Expert Review transition to waiting_customer from UI.
[NOT RUN] evidenceUrls textarea path.
[NOT RUN] sendToCustomer wording verified visually in browser.
```

## Quote / Decision

```text
[NOT RUN] Prepare quote price state from UI.
[NOT RUN] Confirm UI warning that no PDF/WhatsApp/SMS/email is sent.
[NOT RUN] Approve decision from UI.
[NOT RUN] Reject decision from UI.
[NOT RUN] Confirm approve maps to approved/confirmada in UI.
[NOT RUN] Confirm reject maps to cancelled/cancelada in UI.
```

## Scope Guard

```text
[PASS] No backend/models/* files changed by PR-7 work.
[PASS] No backend/routes/citas.js changes by PR-7 work.
[PASS] No backend/services/gemini.js changes by PR-7 work.
[PASS] No new backend endpoint added by PR-7 work.
[PASS] No PDF/send quote/WhatsApp/SMS/email integration added.
```
