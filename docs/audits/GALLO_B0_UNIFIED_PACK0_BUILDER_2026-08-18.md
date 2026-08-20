# Gallo B0 — Unified Pack0 Landing Builder correction

**Date:** 2026-08-18  
**Scope:** B0 — Gallo Landing / Builder Acceptance & Verification  
**Status:** SOURCE CORRECTED / RUNTIME ACCEPTANCE STILL REQUIRED

## Problem

The active Gallo implementation temporarily diverged into two builder concepts:

1. the mature Pack0 Landing Builder workbench, historically carrying Turagua-specific labels/assumptions; and
2. a separate Gallo-specific builder page.

That split was incorrect for the intended Gallo product. The desired product contract is one Landing Builder surface that controls the Gallo public landing.

## Correction

`/admin/landing` now resolves to one Gallo workbench and that workbench owns the mutable `gallo/home` draft/publish flow.

The active Gallo workbench preserves the useful Pack0 editing mechanics:

- Datos Generales / Estadísticas / Sitio Web
- appearance controls
- undo / redo
- desktop / tablet / mobile preview
- section reorder
- show / hide
- add / delete supported Gallo scenes
- live iframe preview
- save draft
- publish
- version visibility / restore-to-draft

The editor vocabulary is now Gallo-specific. The active workbench no longer presents Turagua visual variants as if they were valid Gallo design choices.

## Gallo scene contract

The active editor understands the current eight semantic scenes:

1. `gallo_workshop_hero`
2. `gallo_partners_scene`
3. `gallo_services_scene`
4. `gallo_diagnostic_scene`
5. `gallo_process_scene`
6. `gallo_experience_scene`
7. `gallo_evidence_scene`
8. `gallo_contact_scene`

## Authority

```text
/admin/landing
    ↓
Gallo Pack0 workbench
    ↓
PATCH gallo/home draft
    ↓
MongoDB draft
    ↓ publish
MongoDB published
    ↓
public gallo/home API
    ↓
Gallo public renderer
```

The public Gallo read path is API-authoritative even when legacy/demo contexts use mock mode.

## Scope protection

This correction does **not** expand B0 into Agent/Hermes or `Pinta tu coche`.

The legacy Iris/Agent editor is not part of the active Gallo B0 workbench. Agent authority remains a separate later slice.

## Acceptance still required

Source correction does not prove runtime acceptance. B0 still requires runtime evidence for:

- edit → live preview
- save → reload persistence
- publish → public parity
- draft-without-publish isolation
- reorder/show-hide parity
- media persistence/playback
- desktop/tablet/mobile visual QA
- partner/insurer visual QA

Do not merge/promote solely because the source now expresses the intended builder architecture.
