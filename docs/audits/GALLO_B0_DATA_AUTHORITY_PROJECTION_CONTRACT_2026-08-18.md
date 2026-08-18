# Gallo B0.DATA — Landing Data Authority & Projection Contract

**Date:** 2026-08-18  
**Status:** `FROZEN FOR IMPLEMENTATION`  
**Scope:** Gallo Landing / Admin Web / Services / BusinessProfile only  
**Out of scope:** Pinta tu coche, Agent/Hermes authority expansion, CRM/Workshop Core expansion.

## Decision

The public Gallo Landing is a projection composed from independent authorities:

```text
BusinessProfile ───────┐
CatalogOffering ───────┼──→ Public Gallo Landing
LandingPage ───────────┘
```

The Landing Builder owns presentation only. It must not become a second source of truth for business identity/contact/location/hours or service master data.

## Ownership

### BusinessProfile owns

- business display name
- logo
- canonical tagline
- phone / WhatsApp / email
- location/address
- commercial hours

### CatalogOffering owns

- service identity/name
- service description
- category
- price label when known
- duration when known
- active state
- public visibility
- service display order

### LandingPage owns

- section order and visibility
- public explanatory copy
- layout/alignment/density
- section and group media
- theme
- presentation grouping metadata
- brands/insurers as verified editorial data until a proper authority exists

## Gallo service migration

The currently verified Gallo Landing source contains these offerings, which may be migrated to `CatalogOffering` without inventing prices or durations:

### Mecánica & mantenimiento

- Mecánica general
- Mantenimiento preventivo
- Afinamiento
- Cambio de aceite

### Diagnóstico & seguridad

- Scanner
- Sistema eléctrico
- Frenos
- Suspensión
- Refrigeración
- Alineación y balanceo

### Carrocería & cuidado

- Planchado
- Pintura
- Detailing
- Autolavado

## Projection rules

Business-owned values must be read from `BusinessProfile` by the public renderer. The Builder may show them read-only and direct the operator to `Ajustes`.

Service data must be read from active/public Gallo `CatalogOffering` records. The Landing services scene may group/select/order presentation, but may not edit a second copy of service name/description/price/duration/active/publicVisible.

Brands and insurers remain Landing editorial data during B0. `ManagedEntity` must not be abused as a brand or insurer catalog.

The public process scene is explanatory; it is not a live projection of individual Case/Appointment/Decision records.

Raw customer/workshop evidence must never flow directly into the public Landing. Future evidence requires an approved public-safe knowledge projection.

`request/contact intent != confirmed appointment` remains mandatory.

## Implementation order

```text
B0.DATA-01 BusinessProfile → renderer
B0.DATA-02 Gallo CatalogOffering seed/migration
B0.DATA-03 CatalogOffering → services renderer
B0.DATA-04 remove duplicate Builder master controls
B0.DATA-05 runtime authority acceptance
```

## Acceptance

```text
Ajustes changes address/hours/logo/contact
  → Landing reflects BusinessProfile
  → Builder cannot override those values

Servicios changes CatalogOffering
  → Landing reflects active/public catalog
  → Builder cannot mutate service master

Landing Builder changes layout/media/order/copy
  → Landing presentation changes after publish
  → BusinessProfile/CatalogOffering remain unchanged
```

Negative assertions:

- inactive/non-public offerings never render publicly
- no raw customer/Case/Attachment/TimelineEvent data is exposed
- unpublished Landing presentation stays private
- no automatic appointment-confirmation claim is introduced

# Gate

`B0.DATA AUTHORITY CONTRACT — FROZEN FOR IMPLEMENTATION`
