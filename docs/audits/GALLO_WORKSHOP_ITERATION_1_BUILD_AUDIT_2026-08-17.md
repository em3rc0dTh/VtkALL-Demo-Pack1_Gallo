# Gallo Autos Workshop — Iteration 1 Build Audit

**Date:** 2026-08-17  
**Branch:** `develop`  
**Scope:** Iteration 1 — Gallo Workshop Landing  
**Status:** `IMPLEMENTED / STATICALLY AUDITED / RUNTIME VERIFICATION PENDING`

## 1. Build boundary

This iteration deliberately implements only the Gallo Workshop public landing foundation.

```text
ITERATION 1 — GALLO WORKSHOP LANDING   ← CURRENT
        ↓
ITERATION 2 — PINTA TU COCHE           DEFERRED
        ↓
ITERATION 3 — GALLO AGENT / HERMES     DEFERRED
```

The existing Admin/Dashboard architecture is preserved. Only the Landing Builder route and live preview boundary were pointed to the Gallo projection where required for parity.

## 2. Product laws implemented

### One screen = one section

The Gallo public renderer is a scene-based experience:

```text
SCENE
100dvh
snap-start
snap-always
        ↓
controlled scroll / navbar navigation
        ↓
NEXT SCENE
```

The public shell uses vertical mandatory scroll snap and each Gallo scene owns one viewport. Mobile keeps the same scene ownership while allowing internal vertical overflow when content cannot fit safely in one physical viewport.

### Landing remains one landing

The navbar navigates among anchors/scenes inside the same public landing:

```text
Inicio
Marcas
Servicios
Proceso
Nosotros
Contacto
```

`Pinta tu coche` is intentionally not modeled as another scrolling section.

### Agent deferred

The previous `/agendar` route opens the current agent experience. Because the Gallo Agent belongs to Iteration 3, the new landing does not route its primary CTA to `/agendar` and does not render `DemoTestAgentChat`.

The current Iteration 1 CTA moves to the contact/request scene instead.

## 3. Gallo projection

### Public entry

`frontend/app/page.js` now requests:

```text
businessSlug = gallo
pageSlug = home
```

### Dedicated renderer

`frontend/components/landing/GalloWorkshopExperience.jsx` isolates Gallo's scene experience from the historical Turagua renderer.

The initial `GalloWorkshopLanding.jsx` implementation was superseded during the same build pass and removed after static cleanup. The replacement removes the unused scene map and uses explicit Tailwind opacity utilities to reduce lint/build risk.

The existing `LandingPageRenderer` remains available for previous projections.

### Landing contract

`frontend/lib/landing/galloLandingContract.js` contains the Gallo mock/projection contract.

The Gallo scene sequence is:

```text
01 — Hero
02 — Brands
03 — Services
04 — Diagnostic story
05 — Workshop process
06 — Experience / Why Gallo
07 — Evidence
08 — Contact / request
09 — Final scene
```

## 4. Hero direction

The first screen is intentionally the strongest visual scene.

It uses:

```text
electric purple / blue
white
selective yellow accent
workshop imagery
large editorial typography
motion / depth cues
clear CTA hierarchy
```

The goal is to avoid a static generic workshop template and establish an automotive signature from the first interaction.

## 5. Evidence policy

The evidence/testimonial scene does not publish fabricated customer reviews.

It is reserved for the future evidence structure:

```text
vehicle
  ↓
problem
  ↓
intervention
  ↓
result
```

Real Gallo evidence can replace the temporary media without changing the information architecture.

## 6. Landing Builder parity

`frontend/app/admin/landing/page.js` now opens the Gallo landing context.

`frontend/components/landing/LandingPreviewFrame.jsx` now chooses the renderer by `businessSlug`:

```text
gallo
  → GalloWorkshopExperience

other / legacy
  → LandingPageRenderer
```

This prevents a Gallo public landing from being edited while the builder preview still renders the Turagua visual projection.

The broad Admin/Dashboard UI was not redesigned.

## 7. Backend/API-mode support

Created:

`backend/src/services/landing/galloLanding.seed.ts`

Registered the Gallo landing record in:

`backend/src/services/landing/landing.seed.ts`

The record is:

```text
_id          landing_gallo_home
businessSlug gallo
pageSlug     home
status       published
```

The existing default `seedDatabase()` path uses namespace `all` unless overridden and therefore can include registered landing seeds. A dedicated Gallo BusinessProfile/catalog seed is not yet part of this first landing slice.

## 8. Metadata

The root metadata was changed from Demo Test Laboratory to Gallo Autos Workshop metadata in:

`frontend/app/layout.js`

## 9. Explicitly preserved / not built

```text
Admin Dashboard redesign                    NOT DONE
Pinta tu coche module                       NOT DONE
Gallo conversational agent                  NOT DONE
Hermes adaptation                           NOT DONE
CRM / Workshop Core implementation          NOT DONE
automatic appointment confirmation          NOT CLAIMED
fake testimonials                           NOT ADDED
new external photo dependency               NOT ADDED
```

## 10. Runtime verification status

### Verified by repository inspection

- Gallo and Turagua public renderers remain separated.
- Root public route points to Gallo.
- Landing Builder route points to Gallo.
- Builder live preview can render the Gallo renderer.
- Gallo frontend mock projection exists.
- Gallo backend landing seed exists and is registered.
- Root page metadata is Gallo-specific.
- The initial Gallo renderer was replaced by the hardened `GalloWorkshopExperience` implementation.
- No changes were made to `main` during this build pass.

### Still pending

A real `npm run build` / `npm run lint` execution has not been observed from this connector session.

GitHub Actions workflow/commit endpoints are currently not accessible through the connected GitHub integration for this repository. The connected Vercel account was also inspected and currently has no Gallo/VtkALL Demo Pack project available for an independent preview build.

Therefore this audit does **not** claim runtime proof yet.

## 11. Known implementation debt before declaring Iteration 1 production-ready

1. Execute frontend lint/build in a runnable checkout or CI environment.
2. Visually inspect desktop, tablet and mobile scene snapping.
3. Replace inherited/demo automotive media with approved Gallo assets when available.
4. Add a canonical Gallo BusinessProfile/bootstrap before broader API/runtime adoption.
5. Make the Landing Builder's remaining Turagua-specific shell labels/fallbacks business-aware without redesigning the Admin.
6. Connect the contact/request CTA to the future Controlled Intake only when that operational path is actually implemented.

## 12. Gate

```text
IMPLEMENTATION FOUNDATION     ✅
GALLO PUBLIC PROJECTION       ✅
ONE-SCREEN SCENE MODEL        ✅
BUILDER PREVIEW PARITY        ✅
STATIC RENDERER CLEANUP       ✅
AGENT DEFERRED                ✅
PINTA TU COCHE DEFERRED       ✅
RUNTIME BUILD PROOF           ◉ PENDING
VISUAL DEVICE QA              ◉ PENDING
```

**Decision:** continue Iteration 1 only through verification and refinement. Do not expand into Pinta tu coche or the Agent until the Gallo Workshop landing is visually and technically stable.
