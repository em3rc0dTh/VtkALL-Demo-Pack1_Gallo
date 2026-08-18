# Gallo Autos — B0.PRESENTATION · SectionInstance Composer Audit

**Date:** 2026-08-18  
**Repository:** `thradexIT/VtkALL-Demo-Pack1_Gallo`  
**Branch:** `develop`  
**PR:** `#3`  
**Status:** `SOURCE IMPLEMENTED / RUNTIME ACCEPTANCE OPEN`

## Purpose

Turn the Gallo Landing Builder from a fixed eight-scene editor into a controlled section-composition system where an operator can:

```text
Add component
→ choose template
→ edit text/media/layout/motion
→ choose navigation visibility
→ move it to any position in the section sequence
→ duplicate repeatable components
→ save draft
→ publish
```

without weakening the frozen authority boundary:

```text
BusinessProfile  → business public truth
CatalogOffering  → service truth
LandingPage      → presentation/composition truth
```

## P4 — SectionInstance identity

A repeatable Landing component now carries presentation identity under `block.data.instance`:

```text
schemaVersion

id                  ← LandingBlock stable unique identity
templateKey
semanticFamily
anchor              ← unique URL/hash identity
navLabel
showInNavigation
repeatable
motion
depth
```

Why `data.instance`:

The current Landing block contract intentionally keeps `layout` narrow and `data` extensible. Storing SectionInstance metadata under `data.instance` preserves compatibility with existing Pack0/Pack1 content while making the new contract explicit.

### Canonical singleton anchors

The original Gallo semantic scenes remain singleton and retain stable route anchors:

```text
gallo_workshop_hero     → inicio
gallo_partners_scene    → confianza
gallo_services_scene    → servicios
gallo_diagnostic_scene  → diagnostico
gallo_process_scene     → proceso
gallo_experience_scene  → nosotros
gallo_evidence_scene    → evidencia
gallo_contact_scene     → contacto
```

These anchors are locked by frontend normalization and reserved by backend validation.

This preserves existing semantic CTA contracts such as:

```text
Hero → servicios
Hero → contacto
```

### Backend enforcement

`landing.validation.ts` now rejects:

```text
duplicate LandingBlock IDs
duplicate repeatable SectionInstance anchors
repeatable section claiming a canonical Gallo anchor
duplicate Gallo singleton semantic variants
singleton with non-canonical explicit anchor
singleton marked repeatable
invalid/non-kebab anchors
invalid motion/depth enum values
```

The invariant is therefore enforced below the Builder UI as well as inside it.

## P5 — Repeatable renderer

`GalloWorkshopExperienceV7` introduces instance-aware rendering while preserving the eight recovered Gallo semantic scenes.

The public/preview entry path is hardened through `GalloWorkshopExperienceV8`.

### Repeatable template renderers

Implemented:

```text
repeatable-split-media
  → Texto + imagen/video + CTA opcional

repeatable-editorial
  → Texto editorial + quote

repeatable-feature-cards
  → Grid de cards/beneficios

repeatable-gallery
  → Galería de imágenes/videos + captions

repeatable-cta
  → Banner/CTA + media de fondo opcional
```

Each created instance receives a unique block ID and anchor.

### Renderer behavior

The renderer derives its active scene list from visible, ordered Landing blocks rather than from a hard-coded eight-element array.

Therefore:

```text
8 original scenes
+ repeatable A
+ repeatable B
+ repeatable C
```

becomes one ordered runtime scene rail with independent identities.

Navigation is derived from `showInNavigation` + `navLabel` + `anchor`.

### Motion

SectionInstance motion presets:

```text
none
fade
rise
slide
stagger
scale
blur-reveal
```

Canonical singleton scenes default to `none` because the main scene transition already supplies movement.

Repeatable sections default to `rise`.

This prevents unintended double-animation.

### Depth

SectionInstance depth presets:

```text
none
subtle
tilt
layered
```

Applied only to template elements explicitly marked as depth-capable.

### Reduced motion

`prefers-reduced-motion: reduce` disables non-essential instance/service animations and transforms.

### Long-content safety

Repeatable editorial/features/gallery/CTA families allow vertical overflow inside their active scene so longer operator copy does not silently clip.

## Service presentation preserved

Services continues to read business offerings only from `CatalogOffering`.

Its internal presentation remains independent from section-level motion:

```text
cards
compact
list
carousel
rail
text
featured-grid
```

with:

```text
columns
showImage
showDescription
showPrice
showDuration
service motion
service depth
```

`GalloWorkshopExperienceV8` preserves service-card motion/depth on top of the SectionInstance renderer.

No service master data is copied into LandingPage.

## Business contact action preserved

The V8 boundary derives the Contact primary action from current `BusinessProfile` truth in this preference order:

```text
WhatsApp
→ phone
→ email
→ directions
```

The Builder still does not own those business facts.

## Global theme projection preserved

Builder theme tokens:

```text
primary
accent
surface
text
```

are projected into the V8 renderer for the principal Gallo color tokens.

The signature gradient composition may retain curated Gallo treatment; theme editing is not interpreted as an unrestricted raw-CSS editor.

## P6 — Builder V4

The Admin Web `Landing` slot now mounts `GalloLandingBuilderPageV4`.

### Template library

The library combines:

```text
singleton semantic templates
+ service presentation presets
+ repeatable component templates
```

Singleton templates cannot be duplicated while already present.

Repeatable templates may be created multiple times.

### Component operations

Each section row supports:

```text
select
move up
move down
show/hide
duplicate — repeatable only
delete
```

The editor also exposes a numeric position selector so a component can be moved directly to any position in the ordered section sequence.

### Editable SectionInstance controls

```text
navigation label
anchor — repeatable sections
position
motion
depth
show in navigation
alignment
media mode
density
frame presentation
```

Canonical singleton anchors are normalized back to their frozen canonical values even if a raw edit is attempted.

### Editable repeatable slots

`Texto + media`

```text
eyebrow
title
body
image/video
CTA label
CTA target anchor
```

`Editorial`

```text
eyebrow
title
body
highlight quote
```

`Cards / Beneficios`

```text
eyebrow
title
subtitle
repeatable card title/body entries
```

`Galería`

```text
eyebrow
title
subtitle
repeatable media items
caption per item
```

`CTA / Banner`

```text
eyebrow
title
subtitle
CTA label
CTA target anchor
background image/video
```

## Contract tests authored

Landing test suite now includes:

```text
landing-contract.test.ts
  duplicate ID rejection
  duplicate explicit anchor rejection
  invalid anchor rejection
  duplicate singleton semantic scene rejection

gallo-section-instance.test.ts
  valid repeatable component
  canonical anchor reservation
  singleton canonical anchor enforcement
  singleton repeatable rejection
  duplicate repeatable anchor rejection
```

`backend/package.json` includes `gallo-section-instance.test.ts` in `test:pack-1:landing:authority`.

These tests are **AUTHORED**. They are not recorded as PASS until executed by a real runner.

## What "place it wherever I want" means in B0

Implemented meaning:

> Any repeatable section can be positioned anywhere in the ordered Landing section sequence.

Not claimed:

> Free XY pixel-coordinate placement, overlapping arbitrary elements, absolute canvas authoring, or Figma/Webflow-style unconstrained layout.

That is a different editor model and remains deferred.

## Explicitly deferred

```text
freeform XY canvas
arbitrary DOM/CSS injection
custom JavaScript blocks
WebGL/Three.js scene authoring
raw HTML/embed blocks
Pinta tu coche
Agent/Hermes authority expansion
CRM / Workshop Core expansion
insurer operational authority
public Workshop Knowledge projection
production adoption claim
```

## Runtime acceptance gate

Source closure is not B0 acceptance.

The runtime must prove all of the following.

### A — Authority

```text
Ajustes change
→ Landing projection changes
→ Builder cannot overwrite BusinessProfile

Servicios change
→ Landing projection changes
→ Builder cannot overwrite CatalogOffering
```

### B — Service presentation

```text
Cards ↔ Carousel ↔ List ↔ Rail ↔ Text ↔ Featured
same CatalogOffering records
only presentation changes
```

### C — Repeatable composition

```text
add Texto + media
add another Texto + media
add Cards / Beneficios
→ all receive independent IDs/anchors

edit text/media/layout/motion
→ live Canvas changes

move custom component between any existing sections
→ scene order changes

duplicate repeatable component
→ duplicate gets new ID/anchor

try duplicate singleton Hero/Services/Contact
→ blocked
```

### D — Navigation

```text
enable custom section in navigation
→ correct nav label/hash
→ correct section target

hide section
→ section + navigation projection disappear safely
```

### E — Draft / publish

```text
save
→ reload Builder
→ composition persists

before Publish
→ public remains previous Landing presentation

Publish
→ public matches Builder

new unpublished draft
→ public presentation remains prior version
```

### F — Responsive / visual

```text
Desktop
Tablet
Mobile
no horizontal overflow
repeatable long copy remains reachable
carousel/rail remains usable
media image/video remains usable
reduced-motion behavior is safe
partner/insurer lanes remain visually correct
```

### G — Executable proof

```text
frontend lint
frontend build
backend build
npm run test:pack-1:landing:contract
npm run test:pack-1:landing:integration
npm run test:pack-1:landing:public-frames
```

## Current verdict

```text
P1 — Service display variants             ✅ SOURCE IMPLEMENTED
P2 — Motion/depth presets                 ✅ SOURCE IMPLEMENTED
P3 — Safe template registry               ✅ SOURCE IMPLEMENTED
P4 — SectionInstance identity             ✅ SOURCE IMPLEMENTED
P5 — Repeatable section renderer          ✅ SOURCE IMPLEMENTED
P6 — Builder repeatable composition       ✅ SOURCE IMPLEMENTED
P7 — Runtime / responsive acceptance      ◉ READY TO START
P8 — Final B0 closure                     ⛔ NOT YET
```

# `READY FOR CONTROLLED RUNTIME TEST — DO NOT MERGE / PROMOTE YET`
