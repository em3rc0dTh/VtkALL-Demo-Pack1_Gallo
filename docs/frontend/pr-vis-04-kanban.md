# PR-VIS-04 — Kanban Operativo Premium

## Objetivo
Refinar visualmente el tablero tipo Kanban para el flujo de Evaluaciones (Admisión y Diagnóstico), manteniendo la sensación táctil y de arrastre pero mejorando la claridad corporativa.

## Archivos involucrados
- `components/dashboard/TabEvaluaciones.js`

## Cambios realizados
- **PageHeader**: Se estandarizó la cabecera, dándole título y contexto explícito ("Admisión y Diagnóstico").
- **Métricas Rápidas**: Tarjetas superiores inyectadas para mostrar conteos por estado ("Leads", "Diagnóstico", "Por Evaluar"). (NOTA: Durante QA-VIS-01 se arregló un pequeño bug de sintaxis de JSX en esta misma zona).
- **Envoltorios de Columnas Premium**: Las columnas grises planas se cambiaron a bloques semitransparentes con bordes `.border-gray-800` y títulos de columna elegantes con *badges* numéricos que muestran la carga de la columna.

## Decisiones técnicas/visuales
- Se decidió **mantener el Kanban estrictamente intacto a nivel funcional**. Había dudas iniciales sobre si reemplazarlo por una tabla, pero el Kanban representa valor de producto (Flujo vivo). Por ello, se invirtió esfuerzo en el CSS.

## Qué NO se tocó
- Los Handlers de Drag & Drop (`onDragStart`, `onDragOver`, `onDrop`).
- El mapping de componentes internos `OperationalCard`.
- La lógica de recálculo y fetching de estados hacia la API.
- SweetAlert2 forms de admisión.

## Riesgos o supuestos
- Al tener varias columnas, el uso en móvil o en pantallas muy pequeñas dependerá fuertemente del Scroll Horizontal. Se confía en que los usuarios de este panel utilicen resoluciones de escritorio o tablet anchas por defecto.

## Validación
- Build completado. El Drag and Drop continúa funcional según el DOM (los ID de target y de drag no fueron tocados).

## Siguiente paso recomendado
Mejorar directamente la tarjeta individual (`OperationalCard.js`) que hace vida dentro del Kanban.
