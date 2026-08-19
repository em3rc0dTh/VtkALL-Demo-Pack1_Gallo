# Pinta tu coche — Experience Design v0.1

Status: DESIGN BASELINE · standalone module · no Workshop connection yet
Date: 2026-08-19

## 1. Product boundary

`Pinta tu coche` is a new standalone customer-facing module.

It is not, in this phase:

- a Landing Builder section;
- a CRM client;
- a Workshop Case creator;
- an Appointment creator;
- a quote/invoice engine;
- a WorkOrder surface;
- a pricing authority.

The module must first become a coherent, testable product experience. Connection to the Gallo Workshop website and downstream operational systems is a later CONNECT phase.

```text
legacy Pinta reference
        ↓
recover useful interaction knowledge
        ↓
NEW PINTA MODULE
        ↓
DESIGN → ARCH → BUILD → QA
        ↓
MODULE READY
──────── integration boundary ────────
        ↓
CONNECT TO GALLO WORKSHOP
```

## 2. Source/quarry truth recovered from the current public experience

The current public experience demonstrates useful concepts that should be preserved as knowledge, not necessarily as implementation:

- vehicle body choice: `Auto / Sedán` and `Camioneta / SUV`;
- whole-car versus partial selection;
- visually selectable vehicle body zones;
- explicit panel taxonomy;
- multiple-panel selection;
- a visible selected-area count;
- capture of vehicle/contact information;
- a final request/submission step.

Observed panel vocabulary:

- Puerta delantera derecha
- Puerta delantera izquierda
- Puerta trasera derecha
- Puerta trasera izquierda
- Guardafango delantero derecho
- Guardafango delantero izquierdo
- Guardafango posterior derecho
- Guardafango posterior izquierdo
- Parachoque delantero
- Parachoque trasero
- Estribo LH
- Estribo RH
- Retrovisor derecho
- Retrovisor izquierdo
- Capó delantero
- Techo
- Maletera

The current screenshots also show monetary totals, a per-panel style calculation and a 10% discount. These values are **not accepted as business truth** because no verified Gallo pricing authority has been provided.

## 3. Design thesis

The new module should feel like a visual vehicle configuration experience, not a long form with an image map attached.

The vehicle is the primary interaction object.

```text
choose body
    ↓
understand vehicle
    ↓
select visible zones
    ↓
review selection
    ↓
explain paint intent
    ↓
identify vehicle
    ↓
provide contact/request details
    ↓
review
    ↓
local/module confirmation
```

The user should never need to understand the internal panel taxonomy before interacting with the vehicle.

## 4. Core experience principles

### 4.1 Visual first

The car is the hero of the experience. Lists are secondary/accessibility support.

### 4.2 Progressive disclosure

Do not show vehicle selection, all panels, contact fields and summary at once. Reveal only the decision required at the current step.

### 4.3 Selection must be reversible

Every user action must support immediate deselection, reset and back navigation without losing unrelated work.

### 4.4 No invented commercial truth

Until pricing is verified, the module must never imply that the displayed request is a confirmed monetary quote.

Preferred wording:

- `Solicitar evaluación`
- `Solicitar revisión`
- `Preparar solicitud`
- `La cotización final se confirma después de revisar el vehículo.`

Avoid:

- `Total a pagar`
- unverified discounts
- unverified unit prices
- `Compra` / `Pagar` semantics

### 4.5 Request is not operational acceptance

The standalone module may produce a complete `PaintRequestDraft`, but it does not claim:

`request prepared = appointment confirmed = work authorized = quote accepted`.

## 5. Initial supported body types

v0.1 begins with the two bodies evidenced in the legacy experience:

- Sedan
- SUV

No Pickup/Hatchback/Van is introduced until a real product requirement exists.

Body type changes must preserve compatible metadata where possible but clear incompatible visual selections explicitly.

## 6. Vehicle interaction model

Recommended v0.1 visual mechanism: **premium 2.5D with semantic SVG/vector masks over a high-quality vehicle render**.

Why first:

- precise selectable geometry;
- mobile-safe;
- easier accessibility mapping;
- deterministic states;
- lower asset/runtime complexity than a true 3D vehicle;
- future renderer can be replaced without changing interaction semantics.

True Three.js / React Three Fiber / glTF remains an optional later renderer after the interaction contract is proven.

### Panel states

Every selectable panel supports:

```text
idle
hover / focus
selected
selected + hover
unavailable (future)
```

Visual language:

- idle: original vehicle surface;
- hover/focus: subtle outline + luminance/depth cue;
- selected: branded surface tint + edge highlight;
- selected hover: stronger edge / remove affordance;
- keyboard focus: unmistakable focus ring independent of color.

Do not use disconnected rectangular cyan hit boxes as the final design language. The highlight should conform to the actual panel silhouette.

## 7. Whole-car versus partial selection

The experience exposes two user intents:

### Whole car

`Quiero revisar/pintar el coche completo.`

This is a semantic request. It must **not** automatically assert `20 paños`, a price, or a commercial quantity unless a future verified rule defines that relation.

### Selected areas

The user selects one or more semantic panels.

The UI should show a concise selection tray rather than a permanent giant checkbox catalog.

Example:

```text
3 zonas seleccionadas
✓ Puerta delantera derecha
✓ Parachoque delantero
✓ Retrovisor izquierdo
[Limpiar selección]
```

## 8. Paint intent

After selecting areas, capture why the user is here rather than immediately asking for contact information.

Initial intent options:

- Pintar
- Reparar + pintar
- Evaluar daño
- No estoy seguro / necesito asesoría

Optional secondary intent:

- Mantener color actual
- Explorar otro color
- Necesito asesoría

Changing color does not imply exact digital paint matching.

## 9. Media/reference input

The user may optionally attach reference images later in the flow.

Examples:

- current damage;
- desired finish/reference;
- angle of the affected zone.

The design must distinguish `reference image` from `diagnostic evidence`. In standalone v1 it is only user-provided request context.

## 10. Vehicle information

The module may ask for:

- Marca
- Modelo
- Placa
- Año only if later evidence says it materially helps the request

Do not ask for fields the experience does not use.

The standalone module does not resolve or mutate a canonical vehicle/ManagedEntity.

## 11. Contact/request information

Reduce the current generic form substantially.

v0.1 preferred visible fields:

- Nombre
- Teléfono / WhatsApp
- Email optional
- Notas optional

Document type, company identity and other fields are deferred unless later integration requirements justify them.

No field already captured in previous steps should be asked again.

## 12. Confirmation model

Standalone v1 ends with a review/confirmation state.

Example:

```text
Solicitud preparada

SUV
Toyota RAV4
3 zonas seleccionadas
• Puerta delantera derecha
• Guardafango delantero derecho
• Parachoque delantero

Necesidad
Reparar + pintar

La evaluación final y cualquier precio se confirman después de revisar el vehículo.
```

The final action in standalone mode may be `Finalizar / Ver resumen` rather than pretending the request has entered Gallo's operational systems.

A future connector will replace/extend this boundary.

## 13. Visual direction

The new module should reuse Gallo's visual DNA without depending on the Landing Builder runtime:

- electric blue `#1741FF` as primary interaction color;
- yellow `#FFD400` as selective accent, not constant decoration;
- white/light editorial surfaces;
- dark/high-contrast text;
- premium automotive imagery;
- large vehicle object;
- restrained depth, parallax and transition choreography;
- no generic bootstrap/radio-button visual language.

The experience should feel calm, precise and automotive rather than gamified.

## 14. Motion language

Motion has three jobs only:

1. communicate state change;
2. preserve spatial continuity between steps;
3. add premium depth without obstructing selection.

Recommended motion vocabulary:

- panel hover/focus: 120–180ms;
- select/deselect: 180–260ms;
- step transition: 280–420ms;
- vehicle/body change: crossfade + subtle depth shift;
- selection tray: spring/slide with low amplitude.

Respect `prefers-reduced-motion`.

## 15. Responsive design

### Desktop

Two-column workspace when useful:

```text
visual vehicle          contextual controls / selection tray
```

### Tablet

Vehicle remains dominant; controls move below or into a compact side sheet.

### Mobile

The interaction cannot be a desktop image map scaled down.

Preferred behavior:

- full-width vehicle viewport;
- pinch/zoom only if necessary and implemented accessibly;
- larger touch targets;
- bottom selection tray;
- semantic list alternative;
- sticky Continue action;
- no hover dependency.

## 16. Accessibility baseline

Every visible panel must have a semantic selectable control equivalent.

Required:

- keyboard navigation;
- programmatic panel names;
- visible focus;
- selection announced to assistive technologies;
- non-color-only selection state;
- minimum touch target sizing;
- reduced-motion mode;
- text alternative/list mode for all selectable zones.

## 17. Integration-neutral output seam

The standalone module may construct, validate and expose the following conceptual payload without sending it to CRM/Workshop yet:

```text
PaintRequestDraft
├── schemaVersion
├── vehicleBodyType
├── selectionMode: whole | partial
├── selectedPanels[]
├── paintIntent
├── colorIntent?
├── vehicle
│   ├── brand?
│   ├── model?
│   └── plate?
├── contact
│   ├── name
│   ├── phone
│   └── email?
├── notes?
└── mediaReferences[]
```

This is a module output contract, not an operational entity.

## 18. Explicitly deferred

- Gallo Workshop routing;
- CRM/customer resolution;
- ManagedEntity resolution;
- Appointment creation;
- Workshop Case creation;
- WorkOrder creation;
- quote/pricing engine;
- discounts/promotions;
- insurer flow;
- true 3D renderer;
- color simulation fidelity claims;
- Landing Builder embedding.

## 19. DESIGN gate

Experience Design v0.1 is ready to feed the Interaction/State Contract and Frame Plan.

No ARCH/BUILD decision should bypass these experience rules.