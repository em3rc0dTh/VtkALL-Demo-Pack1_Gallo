# Gallo Autos — B0 Landing / Builder Source Hardening Audit

**Date:** 2026-08-17  
**Scope:** `B0 — Gallo Landing / Builder Acceptance & Verification`  
**Repository:** `thradexIT/VtkALL-Demo-Pack1_Gallo`  
**Branch:** `develop`  
**Audited code head before this documentation commit:** `e4ee1bf5f1e34f490623341c8b5e606bb91b2de2`  
**Baseline before this round:** `fc29e94404a7441bc438c296c939b92e1e712981`  
**Result:** `SOURCE HARDENED / ACCEPTANCE STILL OPEN`

---

## 1. Scope law

This round stayed inside the already-authorized B0 slice:

```text
Gallo Workshop public landing
Gallo Landing Builder
landing draft/publish/version persistence
landing acceptance tests
```

Explicitly untouched:

```text
Pinta tu coche
Gallo Agent / Hermes
CRM operational implementation
broad Workshop Core implementation
Rent A Car domain
workforce domains
```

The code delta from the B0 starting pointer was isolated to Landing/Builder code, landing persistence service and landing tests.

---

## 2. Findings corrected

### B0-F01 — Gallo admin could read mock but write API

Previous development behavior could resolve:

```text
getAdminLandingPage(gallo) → mock payload
saveDraft / publish        → real API / MongoDB
```

That makes `save → reload persistence` an invalid acceptance loop because a successful API write can reload stale mock data.

Correction:

```text
Gallo admin read  → authoritative API
Gallo admin write → authoritative API
```

Non-Gallo mock behavior remains available where already supported.

### B0-F02 — Builder controls were not fully projected

The prior renderer did not faithfully surface all already-declared Gallo controls.

V4 now provides:

```text
visible Hero primary CTA
visible Hero secondary CTA
Evidence in public navigation
stable active scene identity across reorder/hide
image/video media projection for supported visual slots
media hide behavior
alignment projection
contact CTA projection
```

`GalloWorkshopExperience.jsx` now routes Gallo through the dedicated V4 projection while preserving V3 source as prior iteration/history.

### B0-F03 — video upload capability could produce non-renderable public media

The backend upload contract already accepts:

```text
JPEG
PNG
WebP
GIF
MP4
WebM
OGG
```

The prior Gallo visual slots used image rendering semantics.

V4 introduces a shared `VisualMedia` boundary:

```text
.mp4 / .webm / .ogg → <video autoplay muted loop playsInline>
other supported media → <img>
```

This is source-level conformance only. Actual browser playback remains runtime evidence.

### B0-F04 — partner mark CSS depended on historical DOM depth

The existing brand/insurance mark implementation was recovered from the prior `eeebfbd...` work. It uses Google favicon identity as a pilot visual source.

The insurance overrides and one-screen fit selectors depended on historical wrapper depth and could stop applying after renderer refactors.

Correction:

```text
brand lane mappings preserved
insurance lane overrides rebound to current semantic Partners scene structure
short-laptop viewport fit rebound to current structure
```

This restores source-level mark projection and addresses the prior cut-under path.

Production hardening is still open:

> curated local managed brand/insurer assets should replace external favicon dependency before final production polish sign-off.

### B0-F05 — landing contract test was stale after adding Gallo

Current seed registry contains:

```text
demo_test
turagua
gallo
```

but the contract test still asserted `landingSeeds.length === 2`.

That was a guaranteed acceptance failure once CI executed.

Correction:

The contract test now asserts all three seeds and adds Gallo B0 contract checks for:

```text
8 scenes
expected semantic variants
deterministic order
viewport scene contract
Hero CTA/media presence
brand + insurer lists
contact no-auto-confirmation note
Agent/Hermes not silently enabled
```

### B0-F06 — Gallo persistence was absent from the persistence integration gate

The persistence integration previously proved draft/publish/restore/reconnect semantics only for Turagua.

A Gallo scenario now proves at test-contract level:

```text
edit Hero title
set managed media URL
reorder Partners before Hero
hide Evidence
draft does not leak to public before publish
publish applies edited projection
published state survives Mongo reconnect
```

The test has been authored but cannot yet be claimed executed in this environment.

### B0-F07 — published version history could regress on seeded v3 content

`galloLandingSeedRecord` declares:

```text
publishedVersion = 3
```

but generic `seedLandingPages()` previously created history snapshot version `1` unconditionally.

`publishLandingPage()` selected the next version from `LandingPageVersion`, creating a possible fresh-database regression:

```text
page says v3
history latest says v1
next publish → v2
```

Correction:

The generic Landing service now:

```text
creates the seed history at declared publishedVersion
reconciles missing current-published snapshots for existing pages
preserves current published snapshot before publish/restore sequencing
computes next version from max(history version, page.publishedVersion) + 1
```

This makes version progression monotonic and generalizes the preservation principle already present in the Gallo V3 migration.

---

## 3. Renderer / Builder truth after this round

```text
Gallo V4 renderer                 ✅ IMPLEMENTED
Gallo wrapper routes to V4        ✅ IMPLEMENTED
Preview marker identifies V4      ✅ IMPLEMENTED
Gallo admin API read/write seam    ✅ SOURCE-CORRECTED
Hero CTA projection                ✅ IMPLEMENTED
Evidence navigation                ✅ IMPLEMENTED
reorder/hide active-scene safety   ✅ IMPLEMENTED
image/video media component        ✅ IMPLEMENTED
partner mark selectors             ✅ SOURCE-CORRECTED
Gallo contract test coverage       ✅ UPDATED
Gallo persistence test coverage    ✅ UPDATED
monotonic landing version history  ✅ SOURCE-CORRECTED
```

These statuses describe source code only.

---

## 4. Evidence still missing

The following remain open because no executable runner was available in this session:

```text
frontend eslint execution
frontend production build
backend TypeScript build
landing contract test execution
landing persistence integration execution
full Pack 0 acceptance chain
```

GitHub Actions remains blocked at execution-instantiation level:

```text
workflow defined / active     YES
pull_request trigger           YES
push develop trigger           YES
workflow_dispatch              YES
runs/checks observed           NONE
```

No missing run is classified as test success or test failure.

Vercel was inspected as an alternate compile environment, but the connected account contains no project linked to this Gallo/VtkALL repository. No unrelated project was repurposed or deployed.

---

## 5. Runtime / visual acceptance remains open

Still required:

```text
edit → live preview
save → reload persistence
reorder/show-hide → navigation parity
image upload → persistence
video upload → playback where claimed
publish → public parity
desktop visual QA
tablet visual QA
mobile visual QA
brand/insurance visual QA
```

B0 is **not accepted** until actual runtime evidence proves these.

---

## 6. Authority audit

No correction in this round changes the frozen domain authority model.

```text
Landing Builder = presentation authoring
Landing published projection = public presentation
BusinessProfile = business identity/context authority
Landing Builder ≠ CRM
Landing Builder ≠ Workshop Core
Landing Builder ≠ appointment confirmation authority
Landing Builder ≠ Orchestrator
```

The Gallo contact presentation remains a projection/snapshot boundary; operational identity remains external to the Builder.

---

## 7. Gate decision

# `B0 SOURCE HARDENING — CHECK`

```text
Source defects identified        ✅
Source defects corrected         ✅
Scope boundary respected         ✅
Acceptance tests strengthened    ✅
Runtime tests executed           ❌ BLOCKED / NOT CLAIMED
Visual acceptance completed      ❌ NOT CLAIMED
Merge/promotion approved         ❌ NO
Production adoption              ❌ NO
```

The correct next state is:

```text
CONTINUE B0 VERIFICATION
```

not scope expansion and not merge.
