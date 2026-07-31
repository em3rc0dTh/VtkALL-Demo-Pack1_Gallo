# Pack 1 Legacy Landing Inventory

Source tag: `legacy-pack1-pre-pack0`

Target branch: `integration/pack1-on-pack0-landing`

Pack 0 source remote: `pack0-source/main`

This inventory was created before replacing the Pack 1 worktree with the Demo_Pack_0 foundation. Decisions use:

- `COPY`: move asset or artifact with no behavioral dependency.
- `ADAPT`: keep visual/editorial value and adapt to Pack 0 contracts.
- `REWRITE`: rebuild behavior on Pack 0 architecture.
- `DISCARD`: do not migrate.
- `DEFER`: valuable but outside this landing phase.

| Source file or area | Responsibility | Dependencies | Data consumed | Risks | Classification | Proposed destination | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/app/page.js` | Legacy public landing composition and block switch | `frontend/lib/api.js`, `Navbar`, landing components, `ChatAsistente`, browser localStorage | `taller`, `servicios`, `constructor_bloques`, `tema_global` | Direct fetch through monolithic API, localStorage config fallback, legacy chat runtime, block identity mixed with array index fallback | ADAPT | `frontend/app/page.js`, `frontend/components/landing/LandingRenderer.jsx` | Preserve page flow and visual ordering ideas, but render from Pack 0 landing document and repositories. |
| `frontend/components/landing/Hero.js` | Hero visual, CTA, promos, motion | Framer Motion, `taller`, `conf`, public assets, chat callback | title, subtitle, media, promos, CTA text | Hardcoded Turagua/pastel fallback copy, direct visual variables, oversized/fragile config shape | ADAPT | `frontend/components/landing/blocks/HeroBlock.jsx` | Strong visual reference; behavior must be driven by `hero` block props and BusinessProfile. |
| `frontend/components/landing/Servicios.js` | Public services/catalog cards and catalog overlay | Legacy service shape, `taller`, local default services, chat callback | service list, prices, durations, category filters | Duplicates catalog facts, defaults include vertical-specific data, direct scheduling CTA assumptions | ADAPT | `frontend/components/landing/blocks/CatalogBlock.jsx` | Keep card styling and catalog UX; source facts from Pack 0 `CatalogOffering` repository. |
| `frontend/components/landing/StatsBar.js` | Editorial metrics strip | `taller`, `conf` | stat values and labels | Can imply operational KPIs if connected to admin data | ADAPT | `frontend/components/landing/blocks/StatsBlock.jsx` | Keep as editorial/declarative stats only. |
| `frontend/components/landing/SobreNosotros.js` | About section | `taller`, `conf`, image assets | business story, experience, attributes | Hardcoded automotive wording possible | ADAPT | `frontend/components/landing/blocks/AboutBlock.jsx` | Preserve visual value; feed from structured props and BusinessProfile. |
| `frontend/components/landing/Galeria.js` | Gallery section | public images, `taller` | image URLs, captions | Orphan/heavy assets, missing alt text | ADAPT | `frontend/components/landing/blocks/GalleryBlock.jsx`, `frontend/public/brands/turagua/` | Migrate only used Turagua images with required alt text. |
| `frontend/components/landing/Testimonios.js` | Testimonials | local defaults, `conf` | testimonial names, body, context | Editorial content may be fabricated if not marked/configured | ADAPT | `frontend/components/landing/blocks/TestimonialsBlock.jsx` | Keep as editable editorial content. |
| `frontend/components/landing/CTA.js` | Generic CTA section | chat callback, `conf` | CTA title, body, button text | Could imply direct booking action | ADAPT | `frontend/components/landing/blocks/CallToActionBlock.jsx` | CTA should only open agent or scroll. |
| `frontend/components/landing/Contacto.js` | Contact and hours | `taller`, `conf` | phone, WhatsApp label, email, address, hours | Must not integrate OpenWA in this phase | ADAPT | `frontend/components/landing/blocks/ContactBlock.jsx` | Keep contact layout; output only visible contact data. |
| `frontend/components/landing/Footer.js` | Footer content | Static links and contact copy | links, contact labels | Hardcoded brand/content | ADAPT | `frontend/components/landing/blocks/FooterBlock.jsx` | Convert to generic footer block. |
| `frontend/components/landing/CarSpeedStrip.js` | Decorative auto visual strip | CSS/assets | editorial automotive visual | Could be too Turagua-specific for generic renderer | ADAPT | Turagua seed/block styling | Use only through Turagua landing seed or block props. |
| `frontend/components/landing/CarBrands.js` | Brand logos/strip | static brand list | brand names/logos | Trademark/editorial assumptions | DEFER | Later Turagua visual block | Nice-to-have, not core P0 landing. |
| `frontend/components/landing/InteractiveCarHUD.js` | Decorative interactive visual | React state/CSS | visual-only | May distract from canonical landing scope | DEFER | Later visual enhancement | Keep concept, not required for first landing platform. |
| `frontend/components/landing/PitStopAnimation.js` | Decorative animation | CSS/JS animation | visual-only | Heavy/fragile visual code | DEFER | Later visual enhancement | Not needed for draft/publish platform. |
| `frontend/components/landing/ProblemaModal.js` | Symptom modal and speech recognition | Browser speech APIs, upload/legacy flow | customer problem text/media | Direct agent/tool behavior, microphone permission, possible unsafe flow | DISCARD | N/A | Outside landing builder; agent intake belongs to Pack 0 Hermes/Temporal. |
| `frontend/components/landing/BookingFlow.js` | Direct public booking flow | `frontend/lib/api.js`, legacy services, availability, uploads | customer and scheduling data | Direct reservation flow bypasses Pack 0 boundaries | DISCARD | N/A | Use Pack 0 agent/scheduling only. |
| `frontend/components/landing/ChatAsistente.js` | Legacy public chat runtime | Legacy API, direct services/availability, local state | messages, phone/history, service data | Must not migrate: legacy agent, direct model/tools, direct reservation assumptions | DISCARD | N/A | Pack 0 `DemoTestAgentChat` is authoritative. |
| `frontend/components/landing/EmbedBlock.js` | Public arbitrary embed renderer | block config | embed/html-ish data | Unsafe iframe/HTML pattern | DISCARD | Replaced by `StructuredContentBlock.jsx` | Replace with structured content; no arbitrary JS/iframe. |
| `frontend/components/landing/FreeCanvas.js` | Public freeform canvas | block config | arbitrary canvas/config | Unsafe or overly broad content model | DISCARD | Replaced by `StructuredContentBlock.jsx` | Structured content only. |
| `frontend/components/dashboard/TabConstructor.js` | Legacy landing builder UX | `frontend/lib/api.js`, SweetAlert, `EmbedBlockEditor`, local preview implementations | `tema_global`, `constructor_bloques`, `taller` promos | Monolithic component, duplicate preview renderer, small text, unsafe EmbedBlock, no draft/published separation | REWRITE | `frontend/components/landing-builder/*` | Keep builder layout/UX ideas: toolbar, block list, preview, inspector. Rebuild on Pack 0 repository and registry. |
| `frontend/components/dashboard/EmbedBlockEditor.js` | Editor for arbitrary embeds | legacy block config | embed/code settings | Unsafe content model | DISCARD | N/A | Replaced by structured content editor. |
| `frontend/components/dashboard/FreeCanvasEditor.js` | Editor for free canvas | legacy block config | arbitrary canvas settings | Unsafe/unsupported content model | DISCARD | N/A | Replaced by structured content editor. |
| `frontend/components/dashboard/TabConfiguracion.js` | General admin config with constructor tab | `TabConstructor`, legacy config API, uploads | taller config, gallery, hero, promos | Mixes business config, uploads, landing, legacy admin | ADAPT | `frontend/app/admin/landing/page.js`, builder shell | Only recover navigation/context ideas; no full config tab. |
| `frontend/components/dashboard/TabServicios.js` | Legacy service admin | `frontend/lib/api.js` | servicios | CRUD admin outside scope | DEFER | Later admin/catalog work | Catalog must come from Pack 0 for landing. |
| `frontend/components/dashboard/TabDashboard.js` | Admin dashboard overview | legacy APIs | KPIs | Outside landing scope | DEFER | Later admin work | Not part of P0 landing. |
| `frontend/components/dashboard/TabMensajes.js` | Legacy messaging admin | legacy APIs | conversations/messages | Agent/OpenWA/RBAC outside scope | DEFER | Later support console | Not part of landing. |
| `frontend/components/dashboard/TabClientes.js` | Legacy customers admin | legacy APIs | customers, interactions | CRUD admin outside scope | DEFER | Later admin work | Not part of landing. |
| `frontend/components/dashboard/TabCitas.js` | Legacy appointments admin | legacy APIs | appointments | Legacy booking semantics | DISCARD | N/A | Use Pack 0 appointment model later. |
| `frontend/components/dashboard/TabEvaluaciones.js` | Legacy assessment flow | legacy APIs/uploads | assessments/files | Outside scope | DEFER | Later assessment module | Not part of landing. |
| `frontend/components/dashboard/TabEjecuciones.js` | Legacy execution/work order flow | legacy APIs | work orders | Outside scope | DEFER | Later work-order module | Not part of landing. |
| `frontend/components/dashboard/TabTeam.js` | Legacy team management | legacy APIs | teams, availability | Outside landing; Pack 0 owns teams/capacity | DEFER | Later admin/team work | Not part of landing. |
| `frontend/components/screens/` | Expected legacy screen folder | N/A | N/A | Folder absent in inspected Pack 1 tree | DISCARD | N/A | No source files found. |
| `frontend/lib/api.js` | Monolithic frontend API client | raw `fetch`, local API env | all legacy resources | Direct fetch from components, legacy envelopes, broad API surface | DISCARD | N/A | Use Pack 0 `apiClient`, repositories and contracts. |
| `frontend/public/images/turagua.jpg` | Turagua image asset | public path | hero/brand image | Need confirm actual usage and alt | COPY | `frontend/public/brands/turagua/` | Candidate visual asset for Turagua seed. |
| `frontend/public/images/sobre_nosotros.png` | About image asset | public path | about image | Need alt text | COPY | `frontend/public/brands/turagua/` | Candidate about image. |
| `frontend/public/images/hero_car.png` | Hero car image | public path | hero image | Need alt text | COPY | `frontend/public/brands/turagua/` | Candidate hero fallback. |
| `frontend/public/images/Mecanicos-certificados.png` | Services/about asset | public path | image | Need alt text | COPY | `frontend/public/brands/turagua/` | Candidate credibility visual. |
| `frontend/public/images/galeria_*.png` | Turagua gallery assets | public path | gallery images | Must migrate only used images with alt | COPY | `frontend/public/brands/turagua/gallery/` | Useful gallery set. |
| `frontend/public/images/Gallo-Autos-Logo.png` | Legacy/other brand logo | public path | brand logo | Explicitly named contamination in brief | DISCARD | N/A | Do not migrate. |
| `frontend/public/images/bateylate.png` | BateYLate asset | public path | Pack 2/pastry content | Explicit contamination | DISCARD | N/A | Do not migrate. |
| `frontend/public/videos/turagua-*.mp4` | Turagua video assets | public path | hero/background video | Heavy assets; must verify usage | DEFER | Later asset pass | Do not copy until proven necessary. |
| `frontend/public/videos/bateylate*.mp4` | BateYLate videos | public path | Pack 2 content | Explicit contamination | DISCARD | N/A | Do not migrate. |
| `backend/models/Taller.js` | Legacy business config persistence | Mongoose | `tema_global`, `constructor_bloques`, business config | Stores landing config mixed with business profile; no draft/publish versions | REWRITE | `backend/src/models/LandingPage.model.ts`, `LandingPageVersion.model.ts` | Transform concepts only; do not keep model. |
| `backend/routes/configuracion.js` | Legacy config read/write | Express, `Taller` | config fields including landing blocks/theme | Writes directly to live config; no versioning | REWRITE | `backend/src/controllers/landing.controller.ts`, `routes/landing.routes.ts` | Rebuild on Pack 0 API/error envelope/admin token. |
| `backend/routes/upload.js` | Legacy upload route | file upload/storage | uploaded files | Public upload out of scope; secret/security review needed | DISCARD | N/A | Do not migrate in landing phase. |
| `backend/seed.js` | Legacy seed content | Mongoose models | services, taller config, blocks, mixed verticals | Mixed BateYLate/Turagua/default contamination, no Pack 0 contracts | REWRITE | `backend/src/services/landing/landing.seed.ts` | Extract Turagua editorial ideas only; seed through Pack 0 service. |
| `backend/index.js` | Legacy bootstrap and default config | Express/Mongoose routes | default `tema_global`, `constructor_bloques`, services | Monolithic bootstrap and mixed seed behavior | DISCARD | N/A | Pack 0 server/app owns bootstrap. |

## Source concepts to preserve

- Public landing should remain visual, warm and automotive for `turagua`.
- Builder should preserve the three-zone mental model: block tree, central preview, inspector/properties.
- Preview modes should remain desktop/mobile and expand to desktop/tablet/mobile.
- Theme concepts should become explicit landing theme tokens, not global DOM mutation by legacy config.
- Hero, catalog/services, stats, about, gallery, testimonials, contact, CTA and footer are useful as blocks.
- Chat entrypoint should preserve visual CTA behavior but call only Pack 0 `DemoTestAgentChat`.

## Source concepts to reject

- Live editing of the public page without draft/publish.
- Direct component calls to monolithic API.
- Arbitrary HTML, arbitrary iframe, free canvas, unsafe embed behavior.
- Legacy conversational runtime and direct booking flows.
- BateYLate, pastry, Gallo Autos and other non-Turagua contamination.
- Physical migration of secrets or environment files.

## Initial asset candidates

Copy only after the Pack 0 foundation checkpoint:

- `frontend/public/images/turagua.jpg`
- `frontend/public/images/hero_car.png`
- `frontend/public/images/sobre_nosotros.png`
- `frontend/public/images/Mecanicos-certificados.png`
- `frontend/public/images/galeria_taller.png`
- `frontend/public/images/galeria_planchado.png`
- `frontend/public/images/galeria_pintura.png`
- `frontend/public/images/galeria_flota.png`
- `frontend/public/images/galeria_diagnostico.png`
- `frontend/public/images/galeria_detailing.png`

Deferred pending weight/usage review:

- `frontend/public/videos/turagua-prado.mp4`
- `frontend/public/videos/turagua-prado-1.mp4`
- `frontend/public/videos/turagua-car.mp4`
- `frontend/public/videos/turagua-car-1.mp4`

## Baseline captured

- Pack 1 legacy `main` SHA: `291a8b5f81058882521b4d6ab5fe4f4d450aed97`
- Pack 1 preservation tag: `legacy-pack1-pre-pack0`
- Pack 0 source SHA: `2154bf037bf325d2202b054a64bb5bf973f4b305`
- Working branch: `integration/pack1-on-pack0-landing`
