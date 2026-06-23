# Documentación Frontend - Fase Visual

## ¿Qué es esta carpeta?
Esta carpeta contiene el registro técnico y auditable de todos los cambios realizados durante la fase de "Aesthetic Polish" (Refactorización Visual) del panel de administración (Dashboard). Actúa como un registro histórico para entender las decisiones de diseño y arquitectura UI que se tomaron sin comprometer la lógica de negocio.

## ¿Qué cubre la fase visual?
El objetivo principal de esta fase fue elevar la calidad estética del frontend para que se perciba como un SaaS operativo premium (oscuro, profesional, demo-ready), mitigando el riesgo técnico al **no modificar** ninguna llamada al backend, lógica de React profunda, flujos de SweetAlert2 complejos, ni contratos de datos existentes.

## Estado Actual
**DEMO-READY 🟢**
La aplicación compila sin errores, los módulos principales han sido revestidos visualmente y los flujos críticos de la empresa siguen operando íntegramente.

## Stack Frontend Detectado
- Next.js (App Router, versión 16.2.6 detectada previamente)
- React
- Tailwind CSS v4
- Lucide React (Íconos)
- SweetAlert2 (Modales y Alertas)
- Recharts (Gráficos)
- Framer Motion

## Principios Visuales Aplicados
1. **Dark SaaS Premium**: Sobrio y profesional, evitando el aspecto "neon gamer" excesivo.
2. **Cirugía No Invasiva**: Modificar envoltorios y layouts (`App Shell`) en lugar de reescribir `<tbody>` o flujos internos complejos.
3. **Consistencia Global**: Utilización de componentes base (`Card`, `PageHeader`, `Button`) y overrides CSS globales (`!important` para SweetAlert2) en lugar de estilos inline redundantes.

## Lista Resumida de PRs
1. **PR-VIS-01** — App Shell premium
2. **PR-VIS-02** — Design System mínimo
3. **PR-VIS-03** — Dashboard demo-ready
4. **PR-VIS-04** — Kanban operativo premium
5. **PR-VIS-05** — OperationalCard premium
6. **PR-VIS-06** — Agenda/Citas premium
7. **PR-VIS-07** — Catálogo de Servicios premium
8. **PR-VIS-08** — Equipo/Personal premium
9. **PR-VIS-09** — Clientes premium fase 1
10. **PR-VIS-10** — SweetAlert/Form polish global
11. **QA-VIS-01** — Revisión visual final post-polish

## Cómo usar esta documentación
Lee el archivo `visual-polish-changelog.md` para un resumen ejecutivo de la iteración. Si requieres detalles técnicos exactos sobre por qué se modificó un archivo en particular o qué partes de un monolito no deben tocarse, consulta el archivo individual de cada PR.
