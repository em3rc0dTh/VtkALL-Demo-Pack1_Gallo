# Pinta tu coche — High-Fidelity Vehicle Asset Strategy v0.4

Status: DESIGN FROZEN / ASSET PRODUCTION NEXT
Branch: `feature/pinta-tu-coche-v1`
PR: #4
Route: `/pinta-tu-coche`

## Trigger

Runtime review rejected the v0.3 vehicle renderer. Although v0.3 introduced top/lateral views and independent Sedan/SUV SVG drawings, the visible car still read as a technical blueprint and did not match the premium automotive fidelity of the approved Gallo frame.

The failure is not the workflow. It is the visible vehicle asset strategy.

## Frozen workflow

`Vehículo → Zonas → Necesidad → Datos → Revisión`

Do not redesign this sequence during v0.4.

## Stop rule

Do not continue improving the visible vehicle by hand-drawing more SVG paths, rectangles, CSS clip-paths or procedural body geometry.

The semantic SVG layer is useful for interaction, but it must stop being responsible for making the car look real.

## v0.4 rendering contract

```text
High-fidelity automotive render / image
                 ↓
Transparent semantic SVG hit-map
                 ↓
Hover / focus / selected overlay
                 ↓
Stable semantic zone IDs
```

The high-fidelity asset owns appearance.
The semantic overlay owns interaction.

## Required visible assets

At minimum:

- Sedan — top view
- Sedan — side view
- SUV — top view
- SUV — side view

The body families must be unmistakably different before any label is read.

### Sedan visual target

- premium executive passenger car
- lower stance
- long/smooth roofline
- defined trunk
- realistic wheels, glass, lamps and metal surfacing
- clean neutral/transparent studio background

### SUV visual target

- premium SUV / crossover
- visibly taller and broader body
- larger wheels
- higher greenhouse
- strong shoulders
- SUV-specific roof/body proportions
- clean neutral/transparent studio background

## Match to approved frame

The target is the visual character of the approved Pinta workflow frame:

- the car is immediately recognizable as a real premium vehicle;
- top view looks like an automotive configurator, not a diagram;
- lateral view looks like a product photograph/render;
- selected parts feel painted/highlighted on the vehicle surface;
- interaction controls remain secondary to the vehicle.

The approved frame is a design target, not a literal source of commercial truth.

## Semantic overlay contract

Keep the stable IDs:

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

The overlay may use SVG paths/polygons aligned to each high-fidelity asset, but idle outlines should be almost invisible.

## Visual states

### Idle
The user should primarily see the real vehicle. Hit areas must not cover the car with blueprint lines.

### Hover
Reveal only the hovered panel with a soft Gallo electric-blue tint and outline.

### Selected
Use a confident electric-blue surface tint/glow while preserving body texture and panel detail.

### Focus
Use a clear yellow accessibility focus indicator without permanently outlining all zones.

### Whole car
Apply a coherent low-opacity whole-body selection treatment; do not place a giant rectangular overlay over the car.

## View behavior

Keep:

- `Vista superior`
- `Vista lateral`
- left/right side semantics where useful

Switching view must not lose selected semantic zones.

## Asset authority / lifecycle

Vehicle images are presentation assets of the standalone Pinta module. They are not Workshop domain truth and do not identify a customer's actual make/model.

The visible generic vehicle may be replaced later by:

- better 2.5D renders,
- licensed vehicle-family assets,
- generated controlled assets,
- or a true 3D/glTF renderer.

None of those evolutions may rename semantic panel IDs or change the workflow contract without a new design decision.

## Explicitly out of scope

- pricing
- quote calculation
- discounts
- CRM
- Workshop Case
- Appointment
- WorkOrder
- current Gallo Landing integration
- backend PaintRequest persistence

## Acceptance gate

v0.4 is not accepted until runtime demonstrates:

1. visible car reaches premium automotive quality;
2. Sedan and SUV are unmistakably different;
3. top and side views both look like the same quality tier;
4. idle view does not expose blueprint-like hit-map noise;
5. hover/selected zones align naturally with the visible vehicle;
6. mobile keeps the vehicle readable and tappable;
7. workflow behavior remains unchanged;
8. no fake commercial truth is introduced.

Until then PR #4 remains Draft.
