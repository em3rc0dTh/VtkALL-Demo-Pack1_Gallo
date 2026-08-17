# Gallo Autos Workshop — Landing Builder Parity v1

Status: **IMPLEMENTED / LOCAL RUNTIME VERIFICATION REQUIRED**

Branch: `develop`

## Scope

This slice closes the first visual-authoring loop for the Gallo Workshop landing only.

`Pinta tu coche` is explicitly out of scope.
The conversational agent / Hermes iteration is explicitly out of scope.

## Runtime loop

```text
/admin/landing
    ↓
GET /api/v1/admin/landing-pages/gallo/home
    ↓
MongoDB draft
    ↓
Gallo Visual Builder
    ↓
Live iframe preview
    ↓
PATCH draft
    ↓
POST publish
    ↓
GET /api/v1/public/landing-pages/gallo/home
    ↓
Gallo Workshop public landing
```

## Implemented controls

### Scene structure

- eight Gallo scenes recognized semantically
- drag-and-drop scene ordering
- move up / down
- hide / show without deletion
- public navigation projected from visible scene order

### Hero

- eyebrow
- title
- trust/highlight copy
- subtitle
- supporting text
- CTA labels
- highlighted stats
- media asset upload / replacement / removal

### Trust / partners

- title and supporting copy
- vehicle brand list
- insurer list
- reorder / add / remove
- existing animated marquee presentation preserved

### Services

- service-family title and description
- reorder / add / remove
- per-family media upload

### Diagnostic

- title and copy
- diagnostic media
- short diagnostic sequence

### Process

- process title
- steps
- reorder / add / remove
- step numbering normalized after reorder

### About / experience

- title and body
- media
- trust pillars

### Evidence

- presentation title/copy/media
- evidence truth remains outside free-form fabrication

### Contact

- presentation copy can be edited in the draft
- operational contact identity remains governed by BusinessProfile boundaries

### Layout

- left / center / right editorial alignment is projected into the public renderer
- media can be hidden by scene
- section order is authoritative through `block.order`

## Assets

Existing backend endpoint reused:

```text
POST /api/v1/admin/landing-assets
```

Managed assets are stored under `/uploads/landing/...`.

Allowed backend media today:

- JPEG
- PNG
- WebP
- GIF
- MP4
- WebM
- OGG

### Open asset hardening

1. The current Gallo public renderer was originally authored primarily with image elements. Video upload is supported by the backend, but video rendering in all Gallo visual slots is **not yet declared verified**.
2. Vehicle/insurance marks currently use the visual identity resolution introduced during landing v3. Production should move these to curated local managed assets instead of depending on external favicon identity.
3. Arbitrary SVG upload is intentionally not enabled because unsanitized SVG can contain executable content.

## Admin authorization

Production continues to require an explicit `DEMO_TEST_ADMIN_WRITE_TOKEN`.

For `NODE_ENV=development`, the backend now permits the explicit local fallback token:

```text
local-dev-admin
```

This matches the frontend development fallback and avoids a false 403 during local builder testing without weakening production behavior.

## Acceptance gate

The slice is closed only after local evidence proves:

```text
edit text
→ live preview changes
→ save
→ reload admin
→ edit persists
→ reorder scene
→ navigation follows order
→ upload image
→ image persists
→ publish
→ public landing matches
```

Additional verification:

```text
desktop
→ tablet
→ mobile
```

## Explicit non-goals

- no `Pinta tu coche`
- no Hermes / agent redesign
- no Workshop Core state editing
- no CRM editing
- no operational appointment authority in the Landing Builder

The Landing Builder controls public presentation. It does not become the authority for the Gallo business domains.
