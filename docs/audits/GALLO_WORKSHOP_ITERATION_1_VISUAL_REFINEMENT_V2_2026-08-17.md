# Gallo Autos Workshop — Iteration 1 Visual Refinement v2

**Date:** 2026-08-17  
**Branch:** `develop`  
**Scope:** visual/runtime refinement after first real-browser review  
**Status:** `IMPLEMENTED / LOCAL RUNTIME REVIEW REQUIRED`

## 1. Input from browser review

The first Gallo Workshop implementation was accepted as a sound direction but exposed three concrete corrections:

1. Brand color read too purple; Gallo must read as **electric blue + yellow + black + white**.
2. Full-screen scene ownership was correct, but native snap behavior felt locked. Users must still be able to navigate naturally with mouse wheel, trackpad and mobile swipe without exposing halves of adjacent sections.
3. Partnership information needs two distinct concepts: vehicle brands handled by the workshop and insurance-company relationships.

## 2. Color correction

```text
Previous primary  #3217F6  → purple-heavy
Refined primary   #1741FF  → strong electric blue
Action yellow     #FFD400
Structural black  #05070F
Light surface     #FFFFFF / #F7F8FC
```

Purple-heavy dark surfaces and gradients were replaced with black/navy surfaces driven by the electric-blue highlight.

## 3. Navigation correction

The previous renderer used a native scroll-snap container. The v2 renderer uses **controlled scene transitions** while preserving familiar input gestures:

```text
mouse wheel / trackpad → previous scene hides, next scene appears
finger swipe           → previous / next scene
Arrow/Page keys        → scene navigation
navbar / scene rail    → direct navigation
```

The viewport never rests with multiple landing sections visible at once. A short transition lock prevents one physical wheel gesture from skipping multiple scenes.

## 4. Scene model

```text
01 Inicio
02 Marcas de vehículos
03 Aseguradoras
04 Servicios
05 Diagnóstico
06 Proceso
07 Nosotros
08 Evidencia
09 Contacto
10 Cierre
```

`Pinta tu coche` remains outside the normal landing scene sequence and is still deferred to Iteration 2. The conversational Agent remains deferred to Iteration 3.

## 5. Vehicle brands

The existing prototype vehicle-brand list remains present for visual/product evaluation and is explicitly marked in the contract as:

```text
prototype-list-requires-business-confirmation
```

This list must not be promoted to business truth until Gallo confirms the brands it wants to publish.

## 6. Insurance partners

A new independent full-screen scene now exists:

```text
#aseguradoras
layout.variant = gallo_insurance_scene
```

The available Gallo source supports the existence of insurance alliances, but does not provide a reliable current partner list. Therefore the contract intentionally contains:

```text
partners: []
verificationState: current-partner-list-pending-business-confirmation
```

The renderer shows a controlled data-gate state until current partner names/logos are confirmed. No insurer is fabricated or presented as a current partner based only on historical evidence.

## 7. API-mode migration

Local development currently uses:

```text
NEXT_PUBLIC_DEMO_TEST_DATA_MODE=api
```

A normal non-reset seed does not overwrite an already-created landing page, so a non-destructive versioned migration was added:

```text
backend/src/services/landing/galloWorkshopV2.migration.ts
backend/src/scripts/landing/publishGalloWorkshopV2.ts
```

The migration preserves the current published snapshot, updates the draft to v2, then publishes through the normal landing service and creates a new published version.

## 8. Local application command

After pulling `develop`, from `backend/` run:

```bash
npx tsx src/scripts/landing/publishGalloWorkshopV2.ts
```

Then refresh the frontend and verify the API response contains:

```text
theme.primary = #1741FF
block gallo-insurers
navigation #aseguradoras
```

## 9. Verification gate

```text
ELECTRIC BLUE SYSTEM             ✅ IMPLEMENTED
CONTROLLED WHEEL NAVIGATION      ✅ IMPLEMENTED
CONTROLLED TOUCH NAVIGATION      ✅ IMPLEMENTED
NO HALF-SECTION REST STATE       ✅ BY RENDERER DESIGN
VEHICLE BRAND SCENE              ✅ PRESENT
INSURER SCENE                    ✅ PRESENT
CURRENT VEHICLE BRAND LIST       ◉ BUSINESS CONFIRMATION REQUIRED
CURRENT INSURER PARTNER LIST     ◉ BUSINESS CONFIRMATION REQUIRED
LOCAL API MIGRATION              ✅ IMPLEMENTED
DESKTOP RUNTIME QA               ◉ NEXT
MOBILE TOUCH QA                  ◉ NEXT
TABLET QA                        ◉ NEXT
```

**Decision:** remain inside Gallo Workshop Landing Iteration 1. Refine and verify this experience before opening `Pinta tu coche`.
