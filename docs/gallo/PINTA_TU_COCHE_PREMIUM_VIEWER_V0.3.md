# Pinta tu coche — Premium Vehicle Viewer v0.3

Status: SOURCE IMPLEMENTED / RUNTIME VISUAL QA OPEN
Branch: `feature/pinta-tu-coche-v1`
PR: #4
Route: `/pinta-tu-coche`

## Why v0.3 exists

Runtime QA showed that the v0.2 vehicle layer still looked like a technical diagram and did not visually match the premium automotive workflow frame approved for Gallo Autos.

The workflow itself remains accepted. v0.3 changes the vehicle renderer only.

## Frozen workflow

Vehicle → Zones → Need → Data → Review

No workflow step was added or removed.

## New renderer architecture

The active route now renders:

- `frontend/components/pinta/PintaTuCocheScreenV2.jsx`
- `frontend/components/pinta/PintaVehicleViewer.jsx`

Legacy files remain preserved:

- `PintaTuCocheScreen.jsx`
- v0.2 vehicle assets
- `pinta-vehicle-v2.css`

No prior iteration is deleted.

## Premium vehicle assets

v0.3 introduces four independent vehicle views:

- `public/pinta/v3/sedan-top.svg`
- `public/pinta/v3/sedan-side.svg`
- `public/pinta/v3/suv-top.svg`
- `public/pinta/v3/suv-side.svg`

Sedan and SUV are no longer the same renderer with minor scaling differences.

Sedan:
- lower executive body
- smoother roofline
- defined trunk
- smaller wheel stance

SUV:
- taller greenhouse
- larger wheel stance
- roof rails
- more upright body
- broader shoulder/body proportions

## View contract

The zone selector supports:

- Vista superior
- Vista lateral
- Lado izquierdo
- Lado derecho

This follows the approved visual prototype direction where the customer can inspect the vehicle from more than one useful projection.

## Semantic selection contract

The visual renderer may evolve, but semantic IDs remain stable:

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

v0.3 replaces CSS-clipped generic rectangles with explicit SVG path masks in `PintaVehicleViewer.jsx`.

## Selection behavior

Top view exposes all relevant semantic panels.

Side view exposes:
- hood
- roof
- trunk
- front/rear bumpers
- front/rear door for the selected side
- front fender for the selected side
- rear quarter for the selected side
- rocker for the selected side
- mirror for the selected side

Switching view or side does not clear the semantic selection.

## Brand treatment

The real repository Gallo logo remains the authority.
Because the asset is a light mark, the active V2 screen places it on a dark Gallo navy cradle instead of losing contrast on white.

Brand palette remains:
- Electric Blue `#1741FF`
- White `#FFFFFF`
- Yellow `#FFD400`
- dark/navy support only

## Explicitly unchanged

v0.3 still does NOT connect to:

- CRM
- Workshop
- Appointment
- WorkOrder
- Landing Builder
- backend PaintRequest persistence

It still does not publish monetary prices or discounts.

## Runtime acceptance gate

Test `/pinta-tu-coche` and verify:

1. Sedan and SUV look obviously different before entering the zone step.
2. Top view is horizontal and reads like a premium automotive object rather than a technical diagram.
3. Side view works and visually resembles the approved workflow direction.
4. Left/right switch changes the side-specific selectable panels.
5. Selection survives view changes.
6. Hover and selected states remain legible without covering the vehicle artwork.
7. Whole-car mode remains legible.
8. Review displays the new premium renderer.
9. Desktop/tablet/mobile do not crop the vehicle.
10. `/` remains unchanged.
11. No backend write occurs.
12. No price is invented.

Until those checks pass, PR #4 remains Draft.
