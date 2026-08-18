# Gallo Autos — B0.PRESENTATION · Composition Contract

**Date:** 2026-08-18  
**Status:** `FROZEN FOR CURRENT BUILD SLICE`  
**Scope:** Gallo Landing / Landing Builder only  
**Production adoption:** not claimed

## 1. Purpose

B0.DATA separated business/service truth from Landing presentation. B0.PRESENTATION defines how the Landing Builder may visually compose those truths without becoming a second master-data system.

```text
BusinessProfile ───────┐
CatalogOffering ───────┼──→ projection input
Landing editorial data ┘
           ↓
Presentation Contract
           ↓
Layout / display / media / motion / depth / order
           ↓
Public Landing
```

## 2. Core law

> One truth, many visual expressions.

Changing a visual expression must not mutate the underlying business or service authority.

Examples:

```text
CatalogOffering[]
  ↓
Cards
```

and

```text
same CatalogOffering[]
  ↓
Carousel
```

are two projections of the same service truth.

## 3. Service presentation contract

Current controlled fields:

```text
displayMode
  cards
  compact
  list
  carousel
  rail
  text
  featured-grid

columns
  2 | 3 | 4

showImage
showDescription
showPrice
showDuration

motion
  none
  fade
  rise
  slide
  stagger
  scale
  blur-reveal

depth
  none
  subtle
  tilt
  layered
```

These values live in the Landing presentation draft. They never redefine CatalogOffering identity, activity, visibility, price, duration, category or description.

## 4. Motion / depth law

Motion and depth are controlled presets, not arbitrary executable code.

Requirements:

- no user-supplied JavaScript;
- no unsafe HTML/embed path;
- reduced-motion fallback must disable non-essential animation;
- depth must degrade safely on smaller/touch devices;
- motion/depth cannot change business semantics;
- 3D-like depth is currently CSS/presentation depth, not a claim of a full WebGL/Three.js object system.

## 5. Template Registry

The Builder now has a reusable Section Template Registry.

A template defines:

```text
template key
family
semantic renderer variant
editable editorial slots
default layout
default media behavior
default presentation preset
repeatability capability
```

Current template families include:

- Hero / Workshop
- Trust / Brands + Insurers
- Services / Cards
- Services / Carousel
- Services / List
- Diagnostic split media
- Process grid
- About / Story media
- Evidence / Case placeholder
- Contact / BusinessProfile projection

### Service templates as presets

If the Services semantic section already exists, Services templates act as visual presets. They do not create a duplicate service authority or duplicate CatalogOffering data.

## 6. Current repeatability boundary

The existing renderer still has semantic scene identity assumptions inherited from the eight-scene B0 story.

Therefore arbitrary duplicate/repeatable sections are **not claimed complete** in this slice.

Current rule:

```text
one active instance per semantic scene
```

except that visual presets may be swapped on the existing Services scene.

The next renderer refactor must introduce independent section-instance identity so multiple instances can coexist safely without duplicate navigation/hash/scene identity.

Target:

```text
SectionInstance
  id             unique
  templateKey
  semanticFamily
  dataBinding
  content
  layout
  presentation
  motion
  visibility/order
```

## 7. Implementation state

Implemented in source:

```text
frontend/lib/landing/galloPresentationRegistry.js
frontend/components/landing/GalloLandingBuilderPageV3.jsx
frontend/components/landing/GalloWorkshopExperienceV6.jsx
frontend/components/screens/LandingBuilderScreen.jsx → Builder V3
frontend/components/landing/GalloWorkshopExperience.jsx → Renderer V6
backend/src/services/landing/galloLandingV3.seed.ts → default service presentation
```

The previous Builder V2 and renderer V5 remain preserved as lineage.

## 8. Acceptance required

Runtime proof must demonstrate:

1. switch Services Cards → Carousel without changing CatalogOffering records;
2. switch Carousel → List and preserve the same active/public offerings;
3. show/hide description changes only presentation;
4. show/hide price respects real CatalogOffering price data and invents none;
5. show duration only surfaces existing durationMinutes;
6. motion presets visibly differ in live preview;
7. reduced-motion disables non-essential service animations;
8. depth presets do not break tablet/mobile layout;
9. save/reload preserves presentation settings;
10. publish projects the chosen presentation publicly;
11. new unpublished presentation changes do not leak to public Landing.

## 9. Explicitly not closed here

- arbitrary repeated sections;
- fully general drag-and-drop freeform canvas;
- WebGL / Three.js scene editor;
- Agent/Hermes;
- Pinta tu coche;
- production adoption.

## 10. Gate state

`P1 SERVICE DISPLAY VARIANTS — SOURCE IMPLEMENTED`  
`P2 MOTION / DEPTH REGISTRY — SOURCE IMPLEMENTED`  
`P3 SAFE TEMPLATE REGISTRY / PICKER — SOURCE IMPLEMENTED`  
`P4 REPEATABLE SECTION INSTANCE MODEL — NEXT`  
`RUNTIME / VISUAL ACCEPTANCE — OPEN`
