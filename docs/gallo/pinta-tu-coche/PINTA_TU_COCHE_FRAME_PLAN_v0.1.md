# Pinta tu coche — Frame Plan v0.1

Status: DESIGN FRAME SPEC · standalone module
Date: 2026-08-19

## 1. Purpose

Translate the Experience Design and Interaction Contract into a concrete visual prototype plan before ARCH/BUILD.

This document specifies what each frame must communicate and what states must be visually proven. It does not prescribe React/SVG/Three.js implementation.

## 2. Frame system

The prototype should contain the following primary frames:

```text
F01  Entry
F02  Vehicle body choice
F03  Partial selection — idle
F04  Partial selection — hover/focus
F05  Partial selection — multi-selected
F06  Whole-car selection
F07  Selection review
F08  Paint intent
F09  Vehicle details
F10  Contact + optional media
F11  Final review
F12  Standalone confirmation
```

And responsive variants for the critical interaction frames:

```text
F03/F05 desktop
F03/F05 tablet
F03/F05 mobile
F07 mobile
F11 mobile
```

## 3. F01 — Entry

### Objective

Explain the purpose in under five seconds.

### Composition

- Gallo/Pinta identity area;
- large automotive visual/object;
- title `Pinta tu coche`;
- one concise promise;
- primary CTA `Empezar`;
- subtle progress hint, not a long navbar.

### Copy direction

`Selecciona visualmente las zonas de tu auto que quieres revisar o pintar.`

Supporting truth:

`La evaluación y el precio final se confirman después de revisar el vehículo.`

### Visual behavior

Vehicle may have subtle depth/parallax but no distracting autoplay choreography.

## 4. F02 — Vehicle body choice

### Objective

Choose the visual model used in selection.

### Layout

Two large cards:

```text
[ SEDÁN ]     [ SUV ]
```

Each contains:

- body silhouette/render;
- body label;
- selected state;
- keyboard focus state.

No browser-native radio visual as the primary affordance.

Primary CTA activates after selection.

## 5. F03 — Partial selection / idle

### Objective

Teach interaction without instruction overload.

### Desktop composition

```text
┌─────────────────────────────────────────────────────┐
│ progress / step                                     │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│      INTERACTIVE VEHICLE     │ Selecciona zonas    │
│                              │                      │
│                              │ 0 seleccionadas     │
│                              │ [Coche completo]    │
│                              │ [Lista accesible]   │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│ Atrás                                  Continuar    │
└─────────────────────────────────────────────────────┘
```

The vehicle must be the largest object on screen.

### Idle panel treatment

No visible cyan rectangles. Selectable surfaces should remain visually natural until hover/focus/tap feedback.

## 6. F04 — Hover / focus proof

### Objective

Prove exact panel discoverability.

Create at least four visual states on one frame/spec sheet:

- idle door;
- hover door;
- keyboard-focused door;
- selected door.

The mask follows the body panel silhouette.

A small contextual label may appear near/over the vehicle:

`Puerta delantera derecha`

Avoid permanent labels covering the car.

## 7. F05 — Multi-selected state

### Objective

Show the core product value.

Example selection:

- front right door;
- front right fender;
- front bumper.

Vehicle visually highlights all three with a consistent branded material treatment.

Context panel:

```text
3 zonas seleccionadas

Puerta delantera derecha     ×
Guardafango delantero der.   ×
Parachoque delantero         ×

[Limpiar]

[Continuar]
```

Selection summary and vehicle must always agree.

## 8. F06 — Whole-car state

### Objective

Represent whole-car intent without pretending it equals a paño count or price.

Visual behavior:

- eligible body paint surfaces receive a subtle unified selection treatment;
- windows/lights/tires remain visually excluded;
- summary says `Coche completo`.

Supporting copy:

`La evaluación definirá el alcance final del trabajo.`

## 9. F07 — Selection review

### Objective

Allow the user to verify scope before moving away from the vehicle.

Include:

- body type;
- whole/partial mode;
- selected zones;
- mini visual or vehicle thumbnail with selected regions;
- edit action;
- no monetary subtotal.

Primary CTA: `Continuar`.

## 10. F08 — Paint intent

### Objective

Understand the requested outcome.

Use large option cards:

```text
Pintar
Reparar + pintar
Evaluar daño
Necesito asesoría
```

Optional second row:

```text
Mantener color
Explorar otro color
Necesito asesoría de color
```

Do not present a digital color picker as an exact real-world paint promise in v0.1.

## 11. F09 — Vehicle details

### Objective

Capture only useful identification context.

Fields:

```text
Marca
Modelo
Placa (optional unless later required)
```

Composition should visually retain continuity with the selected vehicle, e.g. small car summary card.

No repeated panel selection controls here.

## 12. F10 — Contact + optional media

### Objective

Collect minimum viable contact/request context.

Fields:

```text
Nombre
Teléfono / WhatsApp
Email optional
Notas optional
```

Optional reference media area:

```text
+ Añadir fotos de referencia
```

Media categories can be chosen after upload or inferred by user label:

- daño actual;
- referencia deseada;
- otro.

Do not show legacy document/company fields unless later justified.

## 13. F11 — Final review

### Objective

Make the full request legible before completion.

Suggested layout:

```text
TU CONFIGURACIÓN

Vehículo
SUV · Toyota RAV4 · ABC-123

Áreas
3 zonas
• Puerta delantera derecha
• Guardafango delantero derecho
• Parachoque delantero

Necesidad
Reparar + pintar

Referencias
2 fotos

Contacto
Eduardo · +51 ...

Precio
Por confirmar después de evaluación
```

Each group has `Editar`.

Standalone CTA:

`Finalizar configuración`.

Do not use `Enviar a taller` until CONNECT exists.

## 14. F12 — Standalone confirmation

### Objective

Finish cleanly without making an untrue integration claim.

Title:

`Configuración lista`

Copy:

`Tu selección está preparada. Cuando este módulo se conecte al flujo de Gallo, esta información podrá acompañar tu solicitud de evaluación.`

During actual product build the wording may be softened for end-user mode depending on the launch boundary, but DESIGN must not silently claim backend acknowledgment.

Actions:

- `Ver resumen`
- `Crear otra configuración`

## 15. Desktop visual language

Target feeling:

- premium automotive configurator;
- spacious but not empty;
- vehicle-first;
- high contrast;
- limited border noise;
- interaction surfaces feel physical;
- motion is functional;
- Gallo blue drives state, yellow is accent.

Avoid the current visual pattern of a narrow image surrounded by large unused white space and generic form controls.

## 16. Tablet composition

Target width around 768–1024.

- vehicle uses upper 55–65% visual area;
- selection tray can become right sheet in landscape or below vehicle in portrait;
- never shrink panel targets below reliable touch size;
- preserve visible current-step progress.

## 17. Mobile composition

Critical pattern:

```text
Header / progress
Vehicle viewport
Selection feedback
──────────────
Bottom sheet
selected zones / actions
──────────────
Sticky Continue
```

Requirements:

- no hover dependency;
- tap to select/deselect;
- semantic list available from bottom sheet;
- body switch is deliberate, not a tiny radio;
- avoid horizontal page scroll;
- vehicle may support controlled zoom only if necessary;
- bottom sheet must not hide the currently selected zone feedback.

## 18. Empty/error/recovery frames

Prototype should include compact states for:

### No partial panels selected

`Selecciona al menos una zona para continuar.`

### Vehicle visual unavailable

Show accessible semantic zone list and retry visual.

### Invalid contact

Inline error with selection preserved.

### Media error

Individual failed media card with Retry/Remove; request state preserved.

### Change body after selection

Confirmation dialog/sheet:

`Cambiar el tipo de vehículo quitará las zonas seleccionadas. ¿Continuar?`

## 19. Transition plan

```text
Entry → body         crossfade/slide
Body → vehicle       vehicle morph/crossfade
Panel selection      local surface transition only
Step advance         directional scene transition
Back                  inverse directional transition
Final confirmation    calm completion transition
```

No page should wait for animation to allow action.

## 20. Frame acceptance checklist

Before ARCH begins, the visual prototype must prove:

- one coherent Gallo/Pinta visual identity;
- Sedan and SUV body choice;
- exact panel masks, not rectangles;
- hover/focus/selected panel states;
- multi-selection;
- whole-car state;
- selection summary;
- paint intent;
- vehicle details;
- minimal contact form;
- optional media concept;
- final review with `price pending`, not fake money;
- standalone confirmation semantics;
- desktop/tablet/mobile compositions;
- accessible list alternative;
- reduced-motion visual fallback direction.

## 21. DESIGN verdict

The next artifact after this frame plan should be the actual visual prototype/frames. ARCH should not begin until those frames are reviewed and frozen.