# PR-VIS-08 — Equipo / Personal Premium

## Objetivo
Optimizar la visualización de los trabajadores, mecánicos y asesores, organizándolos en un diseño corporativo claro y dividido por equipos de especialidad.

## Archivos involucrados
- `components/dashboard/TabTeam.js`

## Cambios realizados
- **Diagnóstico del archivo**: Un componente de 600+ líneas que contenía la lógica de horarios y turnos de manera profunda.
- **Estructura Split-View**: Se transformó la interfaz a un modelo de maestro-detalle o filtros laterales. En la columna izquierda, tarjetas oscuras interactivas de grupos/equipos. En el contenedor derecho, una cuadrícula con `Card` de personal.
- Uso del `PageHeader` y de 4 tarjetas superiores de métricas (Total Personal, Equipos, Técnicos asignados, Personal sin equipo).
- Avatares consistentes y disposición elegante de datos básicos (Rol y Contrato).

## Decisiones técnicas/visuales
- Las métricas creadas se diseñaron con cálculos de lógica inofensiva (ej. mapear cuántos tienen `team === null`) en el momento de renderizado, en vez de obligar a cambios a nivel del backend.
- Se mantuvo el filtro izquierdo porque era muy robusto para este uso.

## Qué NO se tocó
- No se tocaron las llamadas de edición o alta de personal.
- La lógica de horarios y disponibilidad (manejo complejo de arrays de días) quedó completamente intacta, incluyendo los íconos/modales que la activan.

## Riesgos o supuestos
- La vista asume que existe una distinción en el payload entre trabajadores que pertenecen a un `equipo` y trabajadores `libres`. El layout funciona adecuadamente bajo ambas premisas.

## Validación
- Todo el JSX validado sin romper jerarquía de `Grid` o dependencias de Tailwind CSS.

## Siguiente paso recomendado
Entrar a la Fase 1 del monolito de Clientes.
