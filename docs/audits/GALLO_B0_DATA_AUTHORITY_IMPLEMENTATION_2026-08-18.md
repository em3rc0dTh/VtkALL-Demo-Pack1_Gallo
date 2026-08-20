# Gallo B0.DATA — Authority Projection Implementation Evidence

**Date:** 2026-08-18  
**Status:** `SOURCE IMPLEMENTED / RUNTIME ACCEPTANCE OPEN`  
**Contract:** `GALLO_B0_DATA_AUTHORITY_PROJECTION_CONTRACT_2026-08-18.md`

## 1. Implemented authority path

```text
Admin → Ajustes
       ↓
BusinessProfile
       ↓
identity / logo / tagline / contact / location / hours
       ↓
Gallo public projection

Admin → Servicios
       ↓
CatalogOffering
       ↓
active + publicVisible offerings
       ↓
Gallo Services public projection

Admin → Landing
       ↓
LandingPage
       ↓
copy / layout / theme / media / order / visibility / presentation grouping
       ↓
Gallo public projection
```

No bidirectional synchronization is introduced. Authorities are read and composed at projection time.

## 2. Renderer evolution

The previous V4 renderer remains preserved.

Active wrapper now points to:

```text
GalloWorkshopExperienceV5
```

V5 projects:

- BusinessProfile logo/display identity in the header;
- BusinessProfile canonical tagline in Hero trust copy;
- BusinessProfile location/hours/contact in Contact;
- CatalogOffering service identities into the Services scene;
- LandingPage-owned section presentation around those authorities.

## 3. Gallo CatalogOffering migration

`galloCatalog.seed.ts` defines fourteen stable Gallo offerings recovered from the verified Gallo Landing source.

No price or duration is invented.

Non-reset seed behavior is intentionally conservative:

```text
missing offering → insert verified seed
existing offering → preserve operator/runtime record
```

A reset explicitly rebuilds Gallo catalog records from the seed.

## 4. Existing Landing compatibility

Older persisted Gallo Landing drafts may contain service groups without `category` because the previous Builder used static service-group descriptions.

The V5 projection helper safely recognizes the three known historical Gallo group titles and maps them to:

```text
Mecánica & mantenimiento → mecanica_mantenimiento
Diagnóstico & seguridad  → diagnostico_seguridad
Carrocería & cuidado     → carroceria_cuidado
```

Unknown/new groups without a category intentionally project zero services until an explicit category is selected. This prevents accidental display of the full catalog in every group.

## 5. Builder evolution

The previous `GalloLandingBuilderPage` remains preserved as historical implementation lineage.

The Admin Web Landing slot now mounts:

```text
GalloLandingBuilderPageV2
```

V2 preserves:

- Admin Web embedding;
- General / Statistics / Website work areas;
- undo / redo;
- desktop / tablet / mobile preview;
- section add/order/show-hide/delete;
- live iframe canvas;
- media upload;
- theme editing;
- save draft;
- publish;
- version restore.

Authority changes:

```text
Hero canonical tagline → read-only BusinessProfile authority
Contact address/hours/contact → read-only BusinessProfile authority
Services master data → read-only CatalogOffering authority
Service groups → presentation category/title/copy/media only
```

Brands/insurers remain editable verified editorial data during B0 because no operational authority has yet been adopted for those relationships.

## 6. Backend projection

Both public and admin Landing payloads now include the authority context required by their renderer:

```text
landingPage
businessProfile
catalogOfferings
```

The admin payload uses the same normalized public BusinessProfile projection and active/public catalog filter as the public path, so the Builder canvas previews the same authority boundary.

## 7. Source tests

Added:

```text
backend/src/tests/landing/gallo-data-authority.test.ts
```

and wired it into:

```text
npm run test:pack-1:landing:authority
npm run test:pack-1:landing:contract
```

The source test asserts:

- fourteen stable Gallo offerings;
- Gallo business scope;
- public/active defaults;
- no invented price/duration;
- explicit three-category projection contract;
- Hero business-owned identity mode;
- Contact does not own address/hours/phone/email;
- request intent does not imply confirmed appointment;
- BusinessProfile public projection precedence.

## 8. Execution truth

No repository-native workflow run exists for the current head at the time of this record.

Therefore:

```text
SOURCE IMPLEMENTED       ✅
TESTS AUTHORED           ✅
TESTS EXECUTED/PASSED    ⛔ NOT CLAIMED
RUNTIME AUTHORITY PROOF  ◉ OPEN
VISUAL QA                ◉ OPEN
B0 CLOSED                ⛔ NO
```

## 9. Local data activation

The source change alone does not mutate an already-running local Mongo database.

From `backend/`, the existing repository command is:

```bash
npm run seed
```

With `SEED_BUSINESS_SLUG=gallo`, only the Gallo seed path runs. With the current seed runner and the variable unset, the existing general seed plus Gallo seed run. The new Gallo seed uses non-destructive insert-on-missing behavior for its catalog unless reset mode is explicitly used.

Do not use `seed:reset` merely to activate this change on a working local database.

## 10. Runtime acceptance still required

```text
A. Ajustes
change address/hours/logo/contact
→ Landing changes
→ Builder has no competing master control

B. Servicios
change/create/deactivate a CatalogOffering
→ Landing changes
→ inactive/non-public offering disappears
→ Builder cannot mutate the service master

C. Landing Builder
change copy/layout/media/order
→ Canvas changes immediately
→ save/reload persists draft
→ publish changes public presentation
→ BusinessProfile/CatalogOffering remain unchanged

D. Publication isolation
create an unpublished Landing presentation draft
→ public presentation stays on previous published LandingPage
→ current BusinessProfile/CatalogOffering authority still projects
```

Then complete desktop/tablet/mobile, media and partner/insurer visual QA.

# Current gate

`CONTINUE B0 RUNTIME ACCEPTANCE — DO NOT MERGE/PROMOTE YET`
