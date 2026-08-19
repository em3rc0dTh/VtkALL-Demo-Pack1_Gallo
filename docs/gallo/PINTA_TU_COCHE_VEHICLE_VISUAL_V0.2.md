# Pinta tu coche — Vehicle Visual Upgrade v0.2

Status: SOURCE IMPLEMENTED / VISUAL QA OPEN
Branch: feature/pinta-tu-coche-v1
PR: #4

## Purpose

Upgrade the vehicle layer of the standalone `Pinta tu coche` workflow without changing the accepted workflow, semantic body-part contract, or future integration boundary.

## Frozen workflow

Vehicle → Zones → Need → Data → Review

This v0.2 does not change the flow.

## Problem found in runtime QA

The v0.1 selector proved the interaction but the vehicle renderer was visually too schematic. Sedan and SUV also read as almost the same body family because the semantic selector used one shared rectangular hit map over only slightly different artwork.

## v0.2 decisions

### Premium body-family artwork

Two independent visual assets remain under the same 400x490 coordinate system:

- `frontend/public/pinta/sedan-top.svg`
- `frontend/public/pinta/suv-top.svg`

Sedan visual language:

- lower and longer executive stance
- narrower glasshouse
- separate trunk deck
- low-profile wheels
- more tapered panel surfacing

SUV visual language:

- wider and more upright body
- larger tyres
- broad shoulder line
- roof rails
- panoramic roof treatment
- more squared tailgate/panel language

### Stable semantic contract

The body-part IDs do not change:

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

Visual evolution must not rename these IDs.

### Body-family-specific mask treatment

The runtime still uses the existing semantic rectangles as hit targets, but CSS clips them into more natural panel silhouettes.

Sedan masks are more tapered and sculpted.
SUV masks are wider and more squared.

This is an intermediate visual architecture: the semantic selector remains stable while the visual layer can later move to richer SVG paths, 2.5D assets, or 3D mesh selection.

### Selection states

- idle: almost transparent, discoverable outline
- hover: electric-blue surface + soft glow
- focus: yellow accessibility focus
- selected: stronger electric-blue projected paint state
- whole car: lower-opacity complete-body state so vehicle surfacing remains readable

### Gallo brand correction

The repository logo asset is a light variant and was losing contrast on the white module header. v0.2 places the real mark on a Gallo navy/electric-blue cradle instead of replacing it with a fake/generated logo.

## Not changed

- workflow
- `/pinta-tu-coche` route
- contact/data steps
- pricing policy
- CRM
- Workshop
- Appointment
- WorkOrder
- Landing Builder
- backend persistence

## Acceptance gate

The next runtime review must verify:

1. Sedan and SUV are unmistakably different at first glance.
2. Vehicle artwork feels automotive/premium rather than diagrammatic.
3. Hover states do not obscure the underlying vehicle.
4. Selected masks correspond visually to the intended panel.
5. Whole-car selection remains legible.
6. Gallo logo is clearly visible.
7. Desktop and mobile do not crop the vehicle or hit zones.
8. Semantic body-part selection behavior remains unchanged.

Until this visual QA passes, PR #4 remains Draft.
