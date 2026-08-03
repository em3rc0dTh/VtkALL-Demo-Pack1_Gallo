# Auditoría del Estado Actual del Frontend (Fase F0)

## 1. Comandos de Inicialización y Construcción
- **npm ci**: Fallido. Se encontró un error `EBUSY` en Windows al intentar remover dependencias previas (`framer-motion` bloqueado), lo cual es común cuando hay procesos del sistema o del editor inspeccionando la carpeta `node_modules`.
- **npm run build**: No se pudo ejecutar dado que `npm ci` falló (el binario de `next` no estaba disponible).
- **npm run lint**: No se pudo ejecutar por la misma razón.

*Acción recomendada*: Limpiar la caché, cerrar terminales o procesos que bloqueen archivos en `node_modules` y ejecutar `npm install` o `npm ci` nuevamente.

## 2. Rutas y Responsive
- **Rutas verificadas**: La estructura actual en `frontend/app` presenta las páginas principales:
  - `/` (Landing)
  - `/agendar`
  - `/admin/login` (Pendiente de refactor)
  - `/mission-control` y derivaciones (`/[patente]`)
- **Responsive**: La aplicación está construida usando Tailwind CSS con una sólida base responsive (clases `md:`, `lg:`, etc.), visible especialmente en el componente de Constructor y Layouts de Dashboard.

## 3. Identificación de Mocks y Datos Estáticos
Se encontró una dependencia absoluta de datos estáticos ("mocks") integrados en los componentes de interfaz, principalmente en `WireframeScreens.jsx` y `TabClientes.js` / `TabCitas.js`:
- `orders` (TUR-2026-0001, etc.)
- `services`
- `queue` (Admisión)
- `admissionChecks`
- `findings`
- `history`
- Eventos simulados como `vtkall:wireframe-action` con popups artificiales.

## 4. Botones y Comportamiento Real
Se han identificado múltiples botones sin funcionalidad real (simulada vía wireframes):
- Formularios de guardado.
- Botones de "Agendar evaluación", "Reasignar", "Refresh".
- Botones en el "Constructor Screen" como "Guardar", "Preview", "Publicar".
- Gran parte de los botones operacionales ejecutan `window.location.href` forzando navegaciones completas (ej. a `/agendar`) o simplemente muestran el mensaje `accion simulada en wireframe`.

## 5. Arquitectura Actual y Monolito
El principal cuello de botella es `WireframeScreens.jsx`, un archivo de más de 1,200 líneas que agrupa de manera monolítica:
- Landing Wireframe
- Constructor Screen
- Dashboard Summary
- Orders Screen
- Admission Screen
- Execution Screen
- Clients Screen
- Services Screen

## 6. Dependencias Visuales Registradas
- `lucide-react` (Iconografía principal)
- `@radix-ui/react-dialog`
- `framer-motion`
- `recharts`
- `sweetalert2`
- `tailwindcss` (v4)

## 7. Matriz de Estado

| Pantalla | Datos actuales | Entidades v3 | Endpoint futuro | Estado |
| --------- | -------------- | -------------------------- | ----------------- | ------ |
| Landing | mock | CatalogOffering | GET catalog | mock |
| Agendar | mock | Customer/Case/Availability | varios | mock |
| Dashboard | mock | Case/Appointment/WorkTeam | dashboard queries | mock |
| Órdenes | mock | Case/Quote/WorkOrder | Case Detail | mock |
| Admisión | mock | WorkOrder/Attachment | WorkOrder APIs | mock |
| Ejecución | mock | WorkOrderTask/TimelineEvent | WorkOrder APIs | mock |

## 8. Siguientes Pasos (Fase F1)
Tal y como define el plan, el siguiente paso inmediato es la **Descomposición del monolito** de `WireframeScreens.jsx` hacia la nueva estructura modular en `frontend/app` y `frontend/components/` sin alterar el diseño ni las interacciones actuales.
