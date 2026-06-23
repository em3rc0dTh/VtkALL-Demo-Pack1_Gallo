# Notas de Arquitectura Frontend

## Arquitectura Visual Actual
El proyecto opera sobre Next.js (App Router) centralizado fundamentalmente en un concepto de SPA artificial para el panel de administración. El enrutador (`app/admin/dashboard/page.js`) se encarga de servir el "App Shell" y gestionar dinámicamente un estado que inyecta la vista o "pestaña" correspondiente proveniente de `components/dashboard/`.

### Estética y Branding
El sistema ha migrado enteramente a un esquema de **SaaS Dark Premium**:
- Uso de paletas grises corporativas, fondos acrílicos (Glassmorphism) y contrastes vibrantes puntuales.
- Sustitución de estilos crudos repetidos (y glowing agresivo) por un balance sobrio.

## Design System Minimalista
Bajo `components/ui/` se han cimentado las primitivas de diseño escalable de la empresa:
1. `Card.js` (Estructura en bloques lógicos).
2. `PageHeader.js` (Cabeceras de contextos estandarizados).
3. `Button.js` (Control maestro de botones y variantes semánticas).
4. `LoadingSpinner.js`, `EmptyState.js`, `EstadoBadge.js` (Estados de UI y microinteracciones).

## Estrategia de Refactor Seguro ("Cirugía No Invasiva")
La regla cardinal de la fase visual fue la abstención estricta frente a modificaciones lógicas profundas. Todos los Pull Requests de esta serie evitaron deliberadamente reescribir hooks de llamadas HTTP, `useEffect` masivos o modales complejos manejados por `SweetAlert2`, decantándose por envolver estéticamente dichos elementos o forzar su estilo a través de sobreescrituras CSS globales (`app/globals.css`), resguardando con garantías la integridad operativa del producto.

## Monolitos Detectados
Se ha clasificado un punto central de extremo riesgo (Hotspot técnico):
- **`TabClientes.js`**: Componente mastodóntico con altísimo grado de acoplamiento. Centraliza la visión en tabla, filtros locales de front, decenas de manejadores asíncronos para SweetAlert2 y lógicas de fusión de datos complejos.

## Deuda Técnica Pendiente
- Abuso generalizado de `SweetAlert2` como inyector de DOM para formularios extensos (Formularios multi-campo, combos relacionales, selectores). Estos formularios pierden los beneficios naturales de React (como Validadores basados en schemas o re-rendereos atómicos).
- Concentración de estados React masivos en capas superiores de cada "Tab" en vez de usar hooks especializados o Context API / Zustand.

## Próxima Fase Recomendada
Una vez aprobado el MVP en producción o Demostración a clientes:
1. **Refactorización de Modales**: Plan maestro de migración UI progresiva desde Swal2 hacia componentes Dialog/Modals nativos de React para proveer formularios escalables de creación/edición.
2. **Fragmentación Lógica**: Reducción drástica del tamaño de archivos en `TabClientes.js` aislando secciones independientes bajo un directorio `features/clientes/`.
