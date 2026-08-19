# Gallo Autos — Pinta tu coche · Standalone Build v0.1

## Status

`SOURCE IMPLEMENTED / RUNTIME QA REQUIRED`

## Route contract

The Gallo Workshop landing remains the root surface:

```text
/
```

The new Pinta tu coche module is exposed independently at:

```text
/pinta-tu-coche
```

Local development example:

```text
http://localhost:3000/pinta-tu-coche
```

Deployed example:

```text
https://<gallo-host>/pinta-tu-coche
```

The root Gallo navbar is **not connected to this route yet**. Linking the Workshop landing to Pinta tu coche belongs to the later CONNECT phase.

## Product boundary

This v0.1 is a standalone customer workflow. It does not write to:

- CRM;
- Workshop Case;
- WorkOrder;
- Appointment;
- Landing Builder;
- backend PaintRequest persistence.

The final state creates only a local `PaintRequestDraft` reference in the browser session state for UX validation. It must not claim that Gallo received, approved, quoted or scheduled the request.

## Commercial truth boundary

No monetary price, discount, subtotal or total is rendered.

Until an authorized pricing source exists, the module explicitly communicates that price is confirmed after real evaluation.

## Brand contract

Primary Gallo palette:

```text
Electric blue  #1741FF
White          #FFFFFF
Yellow         #FFD400
Black/navy     support only
```

The module uses the repository brand asset:

```text
/public/brand/gallo-autos-logo.svg
```

## Workflow implemented

```text
VEHICLE TYPE
    ↓
SELECT ZONES
    ├── multi-select
    └── whole car
    ↓
PAINT INTENT
    ↓
VEHICLE + CONTACT DETAILS
    ↓
FINAL REVIEW
    ↓
LOCAL MODULE CONFIRMATION
```

### Vehicle selection

- Auto / Sedán
- Camioneta / SUV

### Semantic paint zones

The v0.1 selector preserves stable semantic IDs for the main known legacy zone concepts:

- hood
- roof
- trunk
- front_bumper
- rear_bumper
- front_left_door
- front_right_door
- rear_left_door
- rear_right_door
- front_left_fender
- front_right_fender
- rear_left_quarter
- rear_right_quarter
- left_rocker
- right_rocker
- left_mirror
- right_mirror

The visual vehicle is intentionally implementation-neutral. These semantic IDs should survive a future move from the current 2D/SVG prototype to a richer 2.5D or glTF/Three.js renderer.

## Accessibility / interaction

- visual SVG zones are keyboard-addressable;
- a text/list selector is provided as an accessible alternative;
- selected zones can be removed independently;
- whole-car selection is reversible;
- every step supports back navigation;
- review can jump back to earlier states;
- the module does not require a monetary value to complete.

## Files

```text
frontend/app/pinta-tu-coche/page.js
frontend/components/pinta/PintaTuCocheScreen.jsx
frontend/lib/pinta/pintaConfig.js
```

## Runtime acceptance required

Before declaring the standalone module ready:

1. `npm run lint`
2. `npm run build`
3. open `/pinta-tu-coche`
4. complete Sedan flow
5. complete SUV flow
6. multi-select and remove zones
7. whole-car select/unselect
8. keyboard-select at least one visual zone
9. attach optional image files
10. edit previous state from Review
11. complete local confirmation
12. repeat on desktop, tablet and mobile widths
13. verify `/` is unchanged
14. verify no network write is made by the module
15. verify no price/discount is displayed

## Gate

`PINTA STANDALONE v0.1 — SOURCE IMPLEMENTED / QA OPEN / CONNECT LOCKED`
