# Pinta tu coche — Interaction & State Contract v0.1

Status: DESIGN CONTRACT · standalone module
Date: 2026-08-19

## 1. Purpose

Define the user-visible state machine for the new standalone `Pinta tu coche` module before choosing implementation technology.

This contract must survive a renderer change from SVG/2.5D to a future true-3D vehicle.

## 2. Canonical interaction sequence

```text
ENTRY
  ↓
BODY_TYPE
  ↓
AREA_SELECTION
  ↓
SELECTION_REVIEW
  ↓
PAINT_INTENT
  ↓
VEHICLE_DETAILS
  ↓
CONTACT_DETAILS
  ↓
FINAL_REVIEW
  ↓
MODULE_CONFIRMATION
```

Back navigation is allowed from every state except ENTRY. Returning to a previous state must preserve later-compatible data and explicitly invalidate incompatible data.

## 3. Module-level state

Conceptual state only; this is not yet an implementation schema.

```text
PintaSessionDraft
├── sessionVersion
├── currentStep
├── bodyType
├── selectionMode
├── selectedPanelIds[]
├── paintIntent
├── colorIntent?
├── referenceMedia[]
├── vehicleDraft
├── contactDraft
├── notes?
├── completion
└── validation
```

No CRM/customer/workshop identifiers exist in standalone v1.

## 4. State: ENTRY

Goal: explain the module in one sentence and invite interaction.

Required content:

- `Pinta tu coche`
- clear promise: visually select the areas you want Gallo to evaluate for paint/repair
- explicit no-price language if relevant
- primary CTA: `Empezar`

Allowed actions:

- START → BODY_TYPE

No personal data requested.

## 5. State: BODY_TYPE

Initial options:

- `sedan`
- `suv`

Each option must use a recognizable visual, not only a radio input.

State transition:

```text
BODY_TYPE.selected(type)
    ↓
if previous bodyType == type
    preserve selection
else
    clear selectedPanelIds that are not guaranteed compatible
    require explicit UI feedback
```

Preferred safe v0.1 behavior: changing body type clears partial panel selection after a lightweight confirmation if selections already exist.

## 6. State: AREA_SELECTION

Two mutually exclusive selection modes:

```text
whole
partial
```

### Whole

Represents `entire vehicle requested for evaluation/paint`.

Rules:

- `selectedPanelIds` may be empty because `whole` is itself semantic intent;
- UI may visually highlight the whole eligible paint surface;
- no derived paño count or price is allowed in v0.1.

### Partial

Rules:

- one or more panels may be selected;
- selecting a selected panel deselects it;
- clear-all action must exist;
- selection is order-independent;
- selected panel identity is semantic, not screen-coordinate based.

## 7. Canonical panel vocabulary v0.1

Stable IDs should use English/technical identifiers while Spanish labels remain presentation copy.

Suggested IDs:

```text
front_left_door
front_right_door
rear_left_door
rear_right_door
front_left_fender
front_right_fender
rear_left_quarter
rear_right_quarter
front_bumper
rear_bumper
left_rocker
right_rocker
left_mirror
right_mirror
hood
roof
trunk
```

Labels can be adjusted in copy without changing IDs.

A future body-specific availability map may declare which IDs exist for each body type.

## 8. Panel interaction contract

Each panel supports:

```text
pointer hover
pointer leave
focus
blur
select
deselect
```

State visualization must represent:

```text
IDLE
HOVERED
FOCUSED
SELECTED
SELECTED_HOVERED
DISABLED (future)
```

Rules:

- visual selection and semantic selection must never diverge;
- clicking visual panel and clicking accessible list item call the same selection action;
- there is only one source of selection truth;
- panel masks may change with renderer/body asset, panel IDs may not silently change.

## 9. State: SELECTION_REVIEW

Purpose: confirm the user's paint scope without exposing a giant form.

Whole mode summary:

```text
Coche completo
```

Partial summary:

```text
N zonas seleccionadas
[list]
```

Allowed actions:

- remove one panel;
- clear selection;
- return to vehicle;
- continue.

Continue guard:

- whole mode: always valid;
- partial mode: requires at least one panel.

## 10. State: PAINT_INTENT

Required one-choice field:

```text
paint
repair_and_paint
evaluate_damage
unsure
```

Presentation labels:

- Pintar
- Reparar + pintar
- Evaluar daño
- No estoy seguro / necesito asesoría

Optional color intent:

```text
keep_current_color
explore_new_color
need_advice
```

No exact paint code/color match is promised.

## 11. Reference media

Optional.

Each media item conceptually stores:

```text
id
kind: current_damage | desired_reference | other
localPreview
file metadata
```

Standalone v1 may keep media local until a future connector exists.

Do not claim successful Gallo upload/persistence before CONNECT.

## 12. State: VEHICLE_DETAILS

Initial optional/required decision:

- brand: optional in early prototype, likely required before final module readiness;
- model: optional/required paired with brand;
- plate: optional unless future operational requirements require it;
- year: deferred.

The DESIGN principle is to ask only for data that will meaningfully accompany the request draft.

## 13. State: CONTACT_DETAILS

Preferred minimal contract:

```text
name       required
phone      required
email      optional
notes      optional
```

No document number/company fields in v0.1 unless later evidence justifies them.

Phone label should acknowledge WhatsApp if that is the preferred future contact channel, without claiming an automated WhatsApp integration.

## 14. State: FINAL_REVIEW

Show one coherent review:

```text
vehicle body
vehicle brand/model/plate if supplied
whole/partial scope
selected panels
paint intent
color intent if supplied
reference media count
contact summary
notes
```

Commercial section must say `Precio por confirmar / evaluación requerida` or omit money entirely.

Allowed actions:

- edit each group;
- finalize standalone draft.

## 15. State: MODULE_CONFIRMATION

Standalone semantics:

```text
PaintRequestDraft finalized locally/module-level
```

Not:

```text
submitted to Gallo
appointment created
quote created
case created
```

Suggested copy while disconnected:

`Configuración lista` / `Solicitud preparada`.

When CONNECT is implemented later, this state may become `Solicitud enviada`, but only after real backend acknowledgment.

## 16. Error and recovery states

### Unsupported visual asset

Fallback to semantic panel list; never block the request solely because vehicle art failed.

### Media upload/read error

Preserve request data and allow retry/remove media.

### Invalid contact data

Inline field validation; never wipe selected panels.

### Refresh/navigation recovery

DESIGN target: module should be able to restore an in-progress local draft during the same browser context. Exact persistence technology is an ARCH decision.

## 17. Responsive state behavior

Desktop/tablet/mobile share one logical state machine.

Do not create a different workflow for mobile.

Only composition changes:

- desktop: vehicle + side contextual panel;
- tablet: vehicle + stacked/side sheet controls;
- mobile: vehicle viewport + bottom sheet/selection tray.

## 18. Motion contract

Motion never changes business state by itself.

A transition completes after state has already changed logically.

No user action should be blocked solely waiting for decorative animation.

Reduced-motion mode removes transforms/parallax and preserves state feedback through color/border/icon/text.

## 19. Future CONNECT seam

The eventual connector accepts the finalized module payload and returns an acknowledgment.

Conceptually:

```text
finalizeDraft()
      ↓
PaintRequestDraft
      ↓
[future connector]
      ↓
Acknowledgment
```

The standalone DESIGN contract intentionally does not define CRM/Workshop ownership beyond this seam.

## 20. Acceptance rules for DESIGN

A prototype satisfies this contract only if a tester can:

1. choose Sedan or SUV;
2. choose whole or partial paint scope;
3. select/deselect multiple real-shaped panels;
4. see exact selection summary;
5. go backward without accidental data loss;
6. change body type with explicit selection invalidation;
7. choose paint intent;
8. add vehicle/contact details;
9. review the complete request;
10. finish without any fake price, appointment or Workshop claim;
11. complete the same journey on desktop and mobile;
12. use a semantic list alternative to the visual vehicle.