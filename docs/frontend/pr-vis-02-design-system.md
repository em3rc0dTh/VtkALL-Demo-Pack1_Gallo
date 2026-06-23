# PR-VIS-02 — Design System Mínimo

## Objetivo
Estandarizar piezas visuales repetitivas en componentes modulares de React. Esto asegura consistencia, evita reescribir docenas de clases Tailwind por cada vista y acelera los refactors visuales futuros.

## Archivos involucrados
**Nuevos o consolidados en `components/ui/`:**
- `Button.js`: Botón base con variantes (`primary`, `secondary`, `outline`, `danger`, `ghost`).
- `Card.js`: Set de componentes compuestos (`Card`, `CardHeader`, `CardTitle`, `CardContent`) basados en la estructura estándar de librerías como Radix/shadcn.
- `PageHeader.js`: Cabecera global para estandarizar Título, Descripción y llamadas a la acción superiores.
- `Input.js`: Envases estándar para formularios nativos.
- `EmptyState.js`: Diseño base para cuando las tablas/listas no tienen datos.

**Modificados:**
- `EstadoBadge.js`: Estandarización de colores semánticos (verde/éxito, amarillo/precaución, rojo/error, gris/neutro).
- `LoadingSpinner.js`: Loader corporativo limpio, sin glow exagerado.
- `app/globals.css`: Inyección de clases de soporte para los componentes si fue necesario.

## Cambios realizados
- Se configuraron props consistentes (ej. `variant`, `size`, `className` para overrides, soporte para íconos de `lucide-react` vía `icon={IconComponent}`).
- Se adoptó el patrón de composición (exportar subcomponentes en el mismo archivo para Card).

## Decisiones técnicas/visuales
- Se optó por construir los componentes utilizando **Tailwind Merge (`twMerge`)** o concatenación nativa de Tailwind para permitir sobrescribir estilos de forma predecible (`className="..."`).
- **Cards** se configuraron con fondos transparentes oscuros y bordes suaves de 1px (`border-gray-800`) para adherirse a la estética SaaS premium.

## Qué NO se tocó
- No se intervinieron todavía componentes que utilicen lógicas complejas de estado local u hoocks en tiempo de ejecución.
- No se tocaron los formularios legados construidos a través de HTML inyectado en `SweetAlert2`.

## Riesgos o supuestos
- Riesgo de que desarrolladores futuros no usen estos componentes e inyecten HTML duro. Es crucial establecer la política de uso de `components/ui/*`.

## Validación
- Componentes exportados de forma correcta sin generar errores de compilación `(React is not defined, etc)`.

## Siguiente paso recomendado
Aplicar el Design System directamente a la vista inicial (Dashboard/Resumen).
