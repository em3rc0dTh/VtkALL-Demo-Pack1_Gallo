# Progressive Conversation Identity Execution Notes

Date: 2026-06-25

## Summary

Implemented progressive identity recovery for the public web chat so a customer can resume a prior conversation from another browser or device by providing an exact phone number, DNI, or vehicle plate. Name-only input is recognized for personalization but does not claim or merge history.

## Implemented Changes

- Added `backend/services/conversationIdentityService.js` to extract reliable identifiers from free text, look up exact customer matches, detect ambiguous matches, and merge anonymous `web_...` sessions into the canonical customer conversation.
- Updated `backend/routes/webhook.js` to preserve full `web_...` session IDs instead of stripping them as phone numbers, auto-claim identity before IA processing, and expose `POST /api/webhook/identify` with IP rate limiting.
- Updated `frontend/lib/api.js` and `frontend/components/landing/ChatAsistente.js` so the web chat can claim a prior conversation before sending a message, then store the canonical phone in `localStorage.mecanica_web_session`.
- Updated `backend/services/gemini.js` so the real prompt and simulated fallback follow progressive capture: answer casual greetings directly, ask for name after a real thread forms, then ask for phone or plate for continuity, with DNI optional and last.

## Behavior Notes

- Phone, DNI, and plate can claim a unique existing customer and migrate messages/citas from the current anonymous web session.
- Ambiguous matches return `ambiguous` and do not expose or merge history.
- Name-only matches return `name_only` and do not recover history.
- The public history endpoint now reuses the shared conversation payload helper.
- WhatsApp/OpenWA flows still use the existing LID and phone handling, while web sessions keep their `web_...` IDs until claimed.

## Validation

- `node --check backend/services/conversationIdentityService.js`
- `node --check backend/routes/webhook.js`
- `node --check backend/services/gemini.js`
- Identifier extraction smoke tests for phone, DNI, plate, and accented names.
- `npm run build --prefix frontend`

## Local Runtime Observations

- Existing frontend dev server was already listening on `http://localhost:3000`.
- Existing backend server was already listening on `http://localhost:4000`.
- `frontend/next.config.mjs` was already modified before this implementation and was not changed as part of this work.
