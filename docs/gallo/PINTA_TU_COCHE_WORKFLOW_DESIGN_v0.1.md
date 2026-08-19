# Pinta tu coche — Workflow Design v0.1

## Status

DESIGN — active / standalone module / not connected to Gallo Workshop yet.

## Product boundary

`Pinta tu coche` is a new independent module. The current legacy Pinta experience is a quarry/reference only. This version does not integrate with CRM, Workshop Core, Appointment, Landing Builder, or GalloAutos.com.

Future connection happens only after the module is ready.

## Core experience law

Pinta must feel like a workflow, not a long form.

At every step the user must understand:

- where they are;
- what they already decided;
- what they can edit;
- what the next action is;
- that a request is being prepared, not a confirmed quote or work order.

## Canonical workflow

```text
START
  ↓
VEHICLE TYPE
  ↓
SELECT AREAS
  ├─ Partial selection
  └─ Whole car
  ↓
REVIEW SELECTION
  ↓
PAINT INTENT
  ↓
VEHICLE DETAILS
  ↓
CONTACT + OPTIONAL PHOTOS
  ↓
FINAL REVIEW
  ├─ Edit previous step
  └─ Confirm
  ↓
REQUEST CREATED
  ↓
END MODULE
```

## Visual direction

Gallo palette:

- Electric blue `#1741FF`
- White `#FFFFFF`
- Yellow `#FFD400`
- Black only as supporting contrast

The vehicle is the primary visual object. Forms appear only after visual selection is complete.

## Workflow stages

### 01 — Start
Purpose: explain the task in one sentence and move immediately into selection.

Primary CTA: `Comenzar`.

No prices.

### 02 — Vehicle type
Initial supported body styles:

- Auto / Sedán
- Camioneta / SUV

The choice changes the vehicle representation and available semantic geometry if needed.

### 03 — Select areas
The user selects directly on the vehicle.

Required interaction states:

- idle
- hover
- keyboard focus
- selected
- selected + hover/focus

The selected highlight must follow the body-panel silhouette; no floating rectangle hit boxes as final presentation.

### 04 — Partial vs whole-car branch
Two valid paths:

```text
Partial → one or more semantic panels
Whole car → explicit whole-car state
```

Whole-car selection must not silently fabricate a monetary total or fixed panel count.

### 05 — Review selection
The module shows a readable summary of selected zones and permits:

- remove one zone;
- clear selection;
- return to vehicle;
- continue.

### 06 — Paint intent
Initial intent vocabulary:

- Pintar
- Reparar + pintar
- Evaluar daño
- No estoy seguro

Optional secondary intent:

- mantener color actual;
- cambiar color;
- solicitar asesoría.

No digital color-match guarantee is made.

### 07 — Vehicle details
Capture only information useful to identify the vehicle request, initially:

- brand;
- model;
- plate;
- optional year.

These values remain module request input until future Controlled Intake resolves canonical entities.

### 08 — Contact + optional photos
Initial visible contact fields:

- name;
- phone / WhatsApp;
- optional email;
- optional reference photos.

Do not re-ask data already captured in previous stages.

### 09 — Final review
One consolidated read-only request review with edit links back to previous stages.

Primary CTA: `Enviar solicitud` / `Confirmar solicitud`.

### 10 — Module confirmation
Confirmation means only:

> request captured by the standalone module.

It does not mean:

- quote confirmed;
- appointment confirmed;
- WorkOrder created;
- workshop execution authorized.

## Commercial truth boundary

Until Gallo provides verified pricing authority, Pinta v1 must not display invented monetary quotes, fixed per-panel prices, discounts, or totals.

Allowed copy:

`Precio por confirmar después de evaluación.`

## Responsive behavior

### Desktop
Vehicle and selection summary may coexist side-by-side.

### Tablet
Vehicle remains dominant; summary can collapse below or into a side sheet.

### Mobile
Use a staged workflow with a sticky progress header and bottom-sheet selection summary. Do not shrink the entire desktop canvas until it becomes untappable.

## Future renderer decision

Design contract is renderer-agnostic.

Possible implementation evolution:

```text
SVG/vector semantic masks
        ↓
2.5D premium vehicle experience
        ↓
optional glTF / Three.js mesh selector
```

The interaction vocabulary and semantic panel IDs must survive renderer changes.

## Future integration seam

Standalone module output concept:

```text
PaintRequestDraft
- vehicleType
- selectedPanels[]
- wholeCar
- paintIntent
- colorIntent
- vehicleReference
- contactInput
- notes
- media[]
```

During this DESIGN stage, `PaintRequestDraft` ends the module.

Future CONNECT may project it into Controlled Intake / CRM / Workshop only after the module is accepted independently.

## Gate

`PINTA WORKFLOW DESIGN v0.1 — READY FOR VISUAL PROTOTYPE VALIDATION`
