# Gallo B0 — Builder → Public Landing Authority Fix

**Date:** 2026-08-18  
**Branch:** `develop`  
**Scope:** Gallo Landing / Landing Builder only  
**Pinta tu coche:** untouched  
**Agent / Hermes:** untouched

## Problem reported

The Gallo Landing Builder did not actually control the public Gallo Landing after editing/publishing.

## Root cause

The Builder admin path was already authoritative:

```text
Builder
  ↓
GET/PATCH /api/v1/admin/landing-pages/gallo/home
  ↓
MongoDB LandingPage.draft
  ↓
POST .../publish
  ↓
MongoDB LandingPage.published
```

However, the public frontend path still allowed Gallo to follow the global demo-test data mode:

```text
PublicLandingPage(gallo)
  ↓
landingRepository.getPublicLandingPage
  ↓
NEXT_PUBLIC_DEMO_TEST_DATA_MODE = mock (development default)
  ↓
galloMockLandingPayload
```

That produced split authority:

```text
Builder authority  → API / MongoDB
Public authority   → static mock payload
```

A successful Builder save/publish therefore did not guarantee that the public Landing rendered the published result.

## Correction

`frontend/lib/landing/landingRepository.js` now treats Gallo as an always-authoritative API surface.

```text
businessSlug === gallo
        ↓
ALWAYS API
```

Legacy/demo contexts may still use the existing `api | mock` switch.

The same authority helper is used by both:

```text
getAdminLandingPage
getPublicLandingPage
```

so Gallo can no longer accidentally split between mock admin/public sources.

## Expected authority chain after fix

```text
LANDING BUILDER
   ↓ edits
LOCAL DRAFT / LIVE PREVIEW
   ↓ Guardar
PATCH admin landing API
   ↓
MongoDB LandingPage.draft
   ↓ Publicar
POST publish
   ↓
MongoDB LandingPage.published
   ↓
GET public landing API
   ↓
PublicLandingPage
   ↓
GalloWorkshopExperience V4
```

## Backend confirmation

The backend public service returns `landingPage.published` as `content`, while publish copies the validated draft into `page.published` and increments the published version.

Therefore the backend already provided the required draft → publish → public projection behavior. The defect was the frontend public repository choosing mock data for Gallo before making the public API request.

## Runtime acceptance still required

This is a source correction, not a runtime acceptance claim.

B0 must now explicitly prove:

```text
1. open Gallo Landing Builder
2. change visible copy/media/order/alignment
3. verify live draft preview changes
4. save
5. reload Builder and verify draft persistence
6. publish
7. open/reload public Gallo Landing
8. verify the published Landing matches the Builder publication
9. verify an unpublished subsequent draft does NOT leak publicly
10. verify desktop/tablet/mobile public parity
```

Negative regression:

```text
Gallo public Landing must never read galloMockLandingPayload merely because the global demo-test mode is mock.
```

## Status

```text
ROOT CAUSE IDENTIFIED       ✅
SOURCE AUTHORITY FIXED      ✅
PINTA / AGENT UNTOUCHED     ✅
RUNTIME PARITY PROOF         ◉ OPEN
B0 PROMOTION                 ⛔ BLOCKED UNTIL ACCEPTANCE
```
