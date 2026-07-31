# Pack1 Legacy Landing Inventory

Baseline before adoption:

- Pack1 legacy main SHA: `291a8b5f81058882521b4d6ab5fe4f4d450aed97`
- Legacy tag: `legacy-pack1-pre-pack0`
- Pack0 source SHA: `2154bf037bf325d2202b054a64bb5bf973f4b305`
- Integration branch: `integration/pack1-on-pack0-landing`
- Pack0 source remote: `pack0-source` -> `C:\Users\eduar\Desktop\ai-integrations\demo_test`

## Classification

| Legacy source | Classification | Decision |
| --- | --- | --- |
| `frontend/app/page.js` | REWRITE | Preserve public landing intent, rebuild on Pack0 contracts and data access. |
| `frontend/components/landing/Hero.js` | ADAPT | Keep hierarchy and automotive commercial signal; implement as `hero` block data. |
| `frontend/components/landing/Servicios.js` | ADAPT | Replace hardcoded service cards with Pack0 `CatalogOffering` data through `catalog` block. |
| `frontend/components/landing/StatsBar.js` | ADAPT | Move metrics into `stats` block seed/config. |
| `frontend/components/landing/SobreNosotros.js` | ADAPT | Move institutional copy into `about`/`structured_content` blocks. |
| `frontend/components/landing/Galeria.js` | ADAPT | Recreate as safe `gallery` block; no arbitrary embed or raw HTML. |
| `frontend/components/landing/Testimonios.js` | ADAPT | Recreate as `testimonials` block. |
| `frontend/components/landing/CTA.js` | ADAPT | Recreate as `call_to_action` and `agent_call_to_action` blocks. |
| `frontend/components/landing/Contacto.js` | ADAPT | Recreate as `contact` block. |
| `frontend/components/landing/Footer.js` | ADAPT | Recreate as `footer` block. |
| `frontend/components/landing/ChatAsistente.js` | DISCARD | Legacy assistant stack is replaced by Pack0 `DemoTestAgentChat` and Hermes/Temporal runtime. |
| `frontend/components/landing/BookingFlow.js` | DISCARD | Direct booking flow is out of scope; Pack0 agent and scheduling contracts own this path. |
| `frontend/components/landing/FreeCanvas.js` | DISCARD | Unsafe arbitrary canvas surface is not restored. |
| `frontend/components/landing/EmbedBlock.js` | DISCARD | Raw embed/HTML surface is not restored. |
| `frontend/components/dashboard/TabConstructor.js` | REWRITE | Legacy builder stored landing config in `BusinessProfile.landing`; new builder uses `LandingPage` and `LandingPageVersion`. |
| `frontend/components/dashboard/FreeCanvasEditor.js` | DISCARD | Editor for unsafe canvas is excluded. |
| `frontend/components/dashboard/EmbedBlockEditor.js` | DISCARD | Editor for arbitrary embed is excluded. |
| `backend/models/Taller.js` | DISCARD | Legacy monolith model is replaced by Pack0 `BusinessProfile`, `CatalogOffering`, and landing models. |
| `backend/routes/configuracion.js` | DISCARD | Legacy config route is replaced by Pack0 `/api/v1/admin/landing-pages/...`. |
| `backend/routes/upload.js` and `backend/upload_utils/` | DEFER | Upload/media management requires a separate safe asset pipeline. |
| `openwa/`, `temporal-suite/`, Twilio/OpenWA scripts | DISCARD | The adopted foundation already contains Pack0 Hermes/Temporal runtime; legacy channel stacks are not reintroduced. |
| BateYLate/Gallo Autos assets or copy | DISCARD | Non-Turagua demo contamination is excluded. |

## Resulting Landing Surface

The Pack1 landing is rebuilt around a first-class registry with these allowed block types:

`hero`, `catalog`, `stats`, `about`, `gallery`, `testimonials`, `promotion`, `call_to_action`, `contact`, `agent_call_to_action`, `structured_content`, `footer`.

The public route reads only published snapshots, while `/admin/landing` edits drafts and can publish or restore versions through the Pack0 admin write token.
