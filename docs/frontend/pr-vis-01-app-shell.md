# PR-VIS-01 — App Shell Premium

## Objetivo
Reemplazar el layout base del panel de control por un contenedor general de la aplicación (App Shell) que ofrezca un entorno visual Dark SaaS Premium, sin afectar la funcionalidad de la navegación interna ni la lógica de pestañas.

## Archivos involucrados
- `app/admin/dashboard/page.js`
- `app/globals.css`

## Cambios realizados
- **Sidebar Rediseñado**: Se aplicó una capa translúcida (glassmorphism) al menú lateral. Se ordenaron los íconos de navegación (`lucide-react`) con mejor espaciado y contraste (estados activos/inactivos).
- **Topbar Consolidado**: Se creó una barra superior flotante minimalista que alberga el perfil de usuario y métricas básicas/acciones rápidas.
- **Contenedor Principal (`main`)**: Se estandarizó el padding y el fondo (`--dark-bg`), eliminando bordes innecesarios o saltos abruptos.
- **Reducción de Glow**: Se rebajaron variables CSS que generaban efectos "neon gamer" innecesarios, orientándose a un gris oscuro corporativo.

## Decisiones técnicas/visuales
- Se mantuvo el enfoque de Single Page Application (SPA) artificial que el archivo ya poseía (uso de estados como `activeTab` para renderizar componentes dinámicamente) para evitar romper enlaces o perder historial interno. 

## Qué NO se tocó
- No se reescribió la lógica de autenticación o verificación de sesión.
- No se tocaron las variables de estado que controlan la pestaña activa (`setActiveTab`).
- No se modificó ningún archivo dentro de `components/dashboard/`.

## Riesgos o supuestos
- Ninguno inminente. El App Shell actúa como un Wrapper puro.

## Validación
- Se verificó que el cambio entre todas las pestañas funciona correctamente.
- Se verificó que el modo responsivo móvil adapta la sidebar (hamburguesa o menú inferior, según corresponda) sin solapar contenido crítico.

## Siguiente paso recomendado
Consolidar un Design System para que el interior de las pestañas (`components/dashboard/*`) siga la misma línea trazada por el App Shell.
