# PR-VIS-05 — OperationalCard Premium

## Objetivo
Continuar el rediseño del módulo de Admisión / Diagnóstico enfocándose en la pieza más pequeña y repetitiva: la Tarjeta Operativa del Kanban. 

## Archivos involucrados
- `components/dashboard/OperationalCard.js` (u otra referencia de tarjeta dentro del Kanban)

## Cambios realizados
- **Jerarquía Tipográfica**: Se separó visualmente de forma clara el Nombre del Cliente (Principal) vs Vehículo o Patente (Secundario).
- **Indicadores Visuales**: Uso sistemático de íconos pequeños de `lucide-react` para acompañar fechas o estados de alerta.
- **Acciones y Botones**: Reemplazo de links/botones de texto plano por el componente `Button` del Design System (en su variante `outline` o `ghost` y tamaño pequeño) o alineados de manera elegante en el footer de la tarjeta.
- **Efectos de Interacción (Hover)**: Se le otorgó un estilo `hover:border-primary/50` y un sutil `transform translateY` al hacer hover, facilitando la comprensión de que la tarjeta es interactiva y arrastrable.

## Decisiones técnicas/visuales
- Evitar saturar la tarjeta de datos. El espacio es limitado; mostrar solo: Quién, Qué Vehículo, Cuándo, y la acción más importante.

## Qué NO se tocó
- No se tocaron los Eventos JSX de arrastre.
- Los Handlers de 'onClick' y funciones para abrir los modales de detalle se dejaron idénticos.
- Identificadores de datos vitales requeridos para el arrastre (Data Attributes o Keys).

## Riesgos o supuestos
- Ninguno inminente.

## Validación
- Compilación de dependencias exitosa. Tarjetas mapean correctamente.

## Siguiente paso recomendado
Avanzar con otro módulo principal del dashboard de alta visibilidad: La Agenda de Citas.
