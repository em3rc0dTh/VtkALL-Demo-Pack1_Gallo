Claro. Aquí tienes los wireframes en ASCII, editables directamente.

# VtkALL Frontend Wireframes ASCII v0.1

Baja fidelidad editable para revisión rápida.

Alcance:

* Landing pública
* Landing responsive
* Constructor Landing tipo WordPress
* Admin Shell
* Resumen Operativo
* Órdenes de Taller
* Admisión y Diagnóstico
* Bahías y Ejecución
* Cartera de Clientes
* Catálogo de Servicios
* Centro de Mensajes
* Personal y Equipos
* Ajustes Generales
* demo_test Pack 0 Console
* Detalle de steps demo_test
* Mapa de ejecución

---

# WF-00 | Portada

```text
+--------------------------------------------------------------------------------+
|                                                                                |
|                 VtkALL Frontend Surgery Wireframes v0.1                        |
|                                                                                |
|                 Landing + Admin + Constructor + demo_test                      |
|                                                                                |
|--------------------------------------------------------------------------------|
|                                                                                |
|  Objetivo                                                                       |
|  - Convertir el diseño funcional acordado en wireframes de baja fidelidad.      |
|  - Mantener consistencia con el frontend actual.                                |
|  - No crear un producto nuevo sin necesidad.                                    |
|  - Servir como base editable antes de pasar a Figma / Antigravity.              |
|                                                                                |
|--------------------------------------------------------------------------------|
|                                                                                |
|  Alcance                                                                        |
|  [x] Landing pública                                                           |
|  [x] Constructor Landing tipo WordPress                                         |
|  [x] Admin dashboard completo                                                   |
|  [x] demo_test Pack 0 Console                                                   |
|                                                                                |
|--------------------------------------------------------------------------------|
|                                                                                |
|  Reglas base                                                                    |
|  - Legibilidad primero.                                                         |
|  - No horizontal scroll.                                                        |
|  - Vertical scroll solo en paneles internos.                                    |
|  - Semántica operacional clara.                                                 |
|  - Responsive desde tablet hasta monitor 20–22".                                |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

# WF-01 | Sistema visual y reglas de interacción

```text
+--------------------------------------------------------------------------------+
| SISTEMA VISUAL BASE                                                            |
+--------------------------------------------------------------------------------+
|                                                                                |
| Layout base                                                                    |
|                                                                                |
| +----------------------+-----------------------------------------------------+ |
| | SIDEBAR              | HEADER SUPERIOR                                     | |
| |                      +-----------------------------------------------------+ |
| | Navegación           |                                                     | |
| | persistente          | ÁREA DE TRABAJO                                     | |
| |                      |                                                     | |
| | Usuario              | Cards / paneles / listas / formularios              | |
| | Logout               |                                                     | |
| +----------------------+-----------------------------------------------------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
| COMPONENTES BASE                                                               |
+--------------------------------------------------------------------------------+
|                                                                                |
| [PageHeader]                                                                   |
| - Título                                                                        |
| - Descripción corta                                                             |
| - Acciones contextuales                                                         |
| - Estado operativo                                                              |
|                                                                                |
| [Card]                                                                         |
| - Header                                                                        |
| - Content                                                                       |
| - Footer opcional                                                               |
| - Variantes: default / warning / error / success / compact                      |
|                                                                                |
| [Button]                                                                       |
| - Primary                                                                       |
| - Outline                                                                       |
| - Ghost                                                                         |
| - Danger                                                                        |
| - Loading                                                                       |
| - Disabled                                                                      |
|                                                                                |
| [EstadoBadge]                                                                  |
| - Texto + color                                                                 |
| - Nunca depender solo del color                                                 |
|                                                                                |
| [BackendErrorPanel]                                                            |
| - error.code                                                                    |
| - error.message                                                                 |
| - error.details                                                                 |
| - copiar error                                                                  |
|                                                                                |
| [RawResponsePanel]                                                             |
| - JSON colapsable                                                               |
| - copiar respuesta                                                              |
| - timestamp                                                                     |
|                                                                                |
+--------------------------------------------------------------------------------+
| REGLAS NO NEGOCIABLES                                                          |
+--------------------------------------------------------------------------------+
|                                                                                |
| - Texto operativo mínimo 14–16px en implementación.                             |
| - Labels legibles.                                                              |
| - Contraste alto.                                                               |
| - No horizontal scroll.                                                         |
| - Header, filtros y acción primaria permanecen visibles.                        |
| - Acciones dependen del estado del caso.                                        |
| - Formularios con labels, hints, validación, loading, success y error.          |
| - Tablet: sidebar colapsa.                                                      |
| - Laptop: split view estable.                                                   |
| - Monitor 20–22": más densidad útil, no espacios decorativos vacíos.            |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

# WF-02 | Landing pública desktop

```text
+--------------------------------------------------------------------------------+
| TURAGUA RACING                         Servicios  Nosotros  Galería  Contacto  |
+--------------------------------------------------------------------------------+
|                                                                                |
| HERO                                                                           |
|                                                                                |
| +---------------------------------------------------+------------------------+ |
| | Badge / confianza                                |                        | |
| |                                                   |                        | |
| | Título principal                                 |   Visual / foto         | |
| | Cuidado automotriz especializado                 |   automotriz            | |
| |                                                   |                        | |
| | Subtítulo corto                                  |                        | |
| | Diagnóstico, mantenimiento y atención confiable.  |                        | |
| |                                                   |                        | |
| | [Agendar evaluación] [Ver servicios]             |                        | |
| +---------------------------------------------------+------------------------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
| CATÁLOGO DE SERVICIOS                                                          |
+--------------------------------------------------------------------------------+
|                                                                                |
| +--------------------+ +--------------------+        +-------------------+     |
| | Servicio 1          | | Servicio 2          |      |                   |      |
| | Descripción corta   | | Descripción corta   |      |     COMO          |     |
| | Desde S/ --         | | Requiere evaluación |      |     SELECCIONAR   |      |
| | [Consultar]         | | [Consultar]         |      |     TU BOX        |      |
| +--------------------+ +--------------------+        |                   |      |
|                                                      |                   |       |
| +--------------------+ +--------------------+        |                   |        |
| | Servicio 3          | | Servicio 4          |      |                   |        |
| | Descripción corta   | | Descripción corta   |      |                   |        |
| | Desde S/ --         | | Requiere cotización |      |                   |        |
| | [Consultar]         | | [Consultar]         |      |                   |        |
| +--------------------+ +--------------------+        +-------------------+      |
|                                                                                |
+--------------------------------------------------------------------------------+
| SOBRE NOSOTROS                                                                 |
+--------------------------------------------------------------------------------+
| +--------------------------------------+-------------------------------------+ |
| | Texto de confianza                   | Métricas / puntos destacados        | |
| | Historia breve del taller            | - Experiencia                       | |
| | Diferenciales                        | - Atención                          | |
| |                                      | - Especialidad                      | |
| +--------------------------------------+-------------------------------------+ |
+--------------------------------------------------------------------------------+
| GALERÍA                                                                        |
+--------------------------------------------------------------------------------+
| [Foto 1] [Foto 2] [Foto 3] [Foto 4]                                             |
+--------------------------------------------------------------------------------+
| TESTIMONIOS #Podría quitarse                                                    |
+--------------------------------------------------------------------------------+
| [Testimonio 1]              [Testimonio 2]              [Testimonio 3]          |
+--------------------------------------------------------------------------------+
| CTA FINAL                                                                      |
+--------------------------------------------------------------------------------+
| ¿Quieres evaluar tu vehículo?                         [Agendar evaluación]     |
+--------------------------------------------------------------------------------+
| CONTACTO                                                                       |
+--------------------------------------------------------------------------------+
| Dirección | WhatsApp | Horarios | Mapa / embed                                  |
+--------------------------------------------------------------------------------+
|                                                            [Iris chat flotante] |
+--------------------------------------------------------------------------------+
```

Notas:

```text
- Navbar sticky.
- CTA principal visible desde el hero.
- Chat Iris no debe tapar CTAs ni formularios.
- Catálogo debe mostrar precio/política, duración y CTA.
- Las secciones inferiores vienen del constructor de landing.
```

---

# WF-03 | Landing pública tablet / mobile

```text
TABLET
+------------------------------------------------+
| TURAGUA RACING                         [Menú] |
+------------------------------------------------+
| HERO                                           |
| Título principal                              |
| Subtítulo                                     |
| [Agendar evaluación] [Servicios]              |
|                                                |
| [Visual controlado]                           |
+------------------------------------------------+
| SERVICIOS                                      |
| +--------------------------------------------+ |
| | Servicio 1                                 | |
| | Descripción / precio / duración            | |
| | [Consultar]                                | |
| +--------------------------------------------+ |
| +--------------------------------------------+ |
| | Servicio 2                                 | |
| | Descripción / precio / duración            | |
| | [Consultar]                                | |
| +--------------------------------------------+ |
| +--------------------------------------------+ |
| | Servicio 3                                 | |
| | Descripción / precio / duración            | |
| | [Consultar]                                | |
| +--------------------------------------------+ |
|                                                |
| [Iris flotante con safe area]                  |
+------------------------------------------------+
```

```text
MOBILE
+-------------------------------+
| TURAGUA                [Menú] |
+-------------------------------+
| HERO                          |
| Título                        |
| Subtítulo                     |
| [Agendar]                     |
| [Ver servicios]               |
+-------------------------------+
| Servicio 1                    |
| Texto corto                   |
| [Consultar]                   |
+-------------------------------+
| Servicio 2                    |
| Texto corto                   |
| [Consultar]                   |
+-------------------------------+
| Servicio 3                    |
| Texto corto                   |
| [Consultar]                   |
+-------------------------------+
| Contacto                      |
| WhatsApp / Dirección          |
+-------------------------------+
|             [Iris]            |
+-------------------------------+
```

Checklist:

```text
- Sin scroll horizontal.
- Menú colapsado.
- CTA principal arriba del fold.
- Servicios en columna.
- Chat no cubre botones.
- Textos no menores a 14px.
```

---

# WF-04 | Constructor Landing tipo WordPress

```text
+--------------------------------------------------------------------------------+
| Constructor Landing - Turagua             BORRADOR                             |
|                                                [Guardar] [Preview] [Publicar]  |
+-------------------------+--------------------------------+---------------------+
| ÁRBOL DE BLOQUES        | PREVIEW RESPONSIVE             | PROPIEDADES         |
|                         |                                |                     |
| +---------------------+ | [Desktop] [Tablet] [Mobile]    | Bloque: Hero        |
| | Hero           ON   | |                                |                     |
| | Servicios      ON   | | +----------------------------+ | Título principal    |
| | Sobre Nosotros ON   | | | HERO PREVIEW                | | [Cuidado autom...] |
| | Galería        ON   | | | Título + CTA + visual       | |                     |
| | Testimonios    ON   | | +----------------------------+ | Subtítulo           |
| | CTA            ON   | |                                | [Diagnóstico...]    |
| | Contacto       ON   | | +-------+ +-------+ +-------+  |                     |
| | ChatAsistente  ON   | | | Serv. | | Serv. | | Serv. |  | Texto CTA           |
| +---------------------+ | +-------+ +-------+ +-------+  | [Agendar evaluación]|
|                         |                                |                     |
| [ + Agregar bloque ]    | +----------------------------+ | Link CTA            |
|                         | | CTA / Contacto              | | [/agendar]          |
|                         | +----------------------------+ |                     |
|                         |                                | Imagen / Fondo      |
|                         |                                | [Subir archivo]     |
|                         |                                |                     |
|                         |                                | Mensaje chat        |
|                         |                                | [Hola, soy Iris...] |
|                         |                                |                     |
|                         |                                | [Guardar bloque]    |
|                         |                                | [Desactivar]        |
+-------------------------+--------------------------------+---------------------+
```

Estados:

```text
- BORRADOR
- GUARDADO
- PUBLICADO
- CAMBIOS SIN GUARDAR
- ERROR DE VALIDACIÓN
```

Acciones por bloque:

```text
- Seleccionar
- Activar / desactivar
- Duplicar
- Eliminar
- Mover arriba
- Mover abajo
```

Validaciones antes de publicar:

```text
- Hero debe tener título.
- CTA debe tener texto y destino.
- Contacto debe tener al menos un canal.
- Imágenes deben tener alt text.
- Embed no debe romper layout.
```

---
# WF-05 FUE CONSUMIDO POR EL 06
---
# WF-06 v0.3 | Admin - Resumen Operativo sin scroll

## Objetivo de la pantalla

Esta pantalla debe servir para que el dueño/jefe de taller pueda decidir rápidamente:

* a quién confirmar;
* qué turno ofrecer si entra una llamada;
* qué mecánico o bahía tiene espacio;
* qué urgencia atender primero;
* qué tipo de servicio se está pidiendo más.

La pantalla no debe depender de scroll vertical ni horizontal.

La pantalla debe ser entendible en menos de 5 segundos.

---

# Layout validado

```text id="x7ndd1"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Resumen Operativo                         OPERATIVO      |
|----------------------|---------------------------------------------------------|
| > Resumen Operativo  | RESUMEN OPERATIVO                                      |
|   Órdenes de Taller  | Hoy, cupos disponibles y carga del taller               |
|   Admisión y Diagn.  |                         [Nueva cita] [Agenda] [Refresh] |
|   Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           | Vista: [Hoy] [Mañana] [Semana]        Fecha: 07 Jul 2026|
|   Servicios          |---------------------------------------------------------|
|   Mensajes           |                                                         |
|   Personal y Equipos | +------------+ +------------+ +------------+ +---------+ |
|   Ajustes            | | CITAS HOY  | | CONFIRM.   | | PENDIENT.  | | RIESGO  | |
|                      | |     8      | |     5      | |     2      | |   1     | |
|----------------------| | 3 próximas | | asistencia | | llamar    | | sin resp|
| Admin Web            | +------------+ +------------+ +------------+ +---------+ |
| rol: owner           |                                                         |
| [Cerrar sesión]      | +-----------------------------+ +---------------------+ |
|                      | | CUPOS PARA OFRECER HOY      | | ACCIONES URGENTES   | |
|                      | |                             | |                     | |
|                      | | 10:30  Frontdesk  30m       | | ALTA                | |
|                      | | Evaluación rápida            | | 2 citas sin confirmar|
|                      | | [Crear cita]                | | [Revisar]           | |
|                      | |-----------------------------| |---------------------| |
|                      | | 12:00  Bahía 2    60m       | | MEDIA               | |
|                      | | Diagnóstico general          | | 1 cotización pend.  | |
|                      | | [Crear cita]                | | [Ver]               | |
|                      | |-----------------------------| |---------------------| |
|                      | | 15:30  Carlos     90m       | | BAJA                | |
|                      | | Frenos / suspensión          | | Mensaje fallido     | |
|                      | | [Crear cita]                | | [Revisar]           | |
|                      | +-----------------------------+ +---------------------+ |
|                      |                                                         |
|                      | +-----------------------------+ +---------------------+ |
|                      | | CARGA MECÁNICOS / BAHÍAS    | | DEMANDA RECIENTE    | |
|                      | |                             | | Últimos 7 días      | |
|                      | | Luis     90%  sin huecos    | |                     | |
|                      | | Carlos   55%  2 huecos      | | Frenos          12  | |
|                      | | Ana      70%  1 hueco       | | Diagnóstico gral 9  | |
|                      | |                             | | Pre-compra       6  | |
|                      | | Bahía 1  85%  libre 16:00   | | Mantenimiento    5  | |
|                      | | Bahía 2  40%  libre 12:00   | |                     | |
|                      | | Bahía 3   0%  disponible    | | [Ver catálogo]      | |
|                      | +-----------------------------+ +---------------------+ |
|                      |                                                         |
|                      | +-----------------------------------------------------+ |
|                      | | AGENDA COMPACTA                                     | |
|                      | | 09:00 Carlos · ABC-123 · Frenos · Confirmada [Ver]  | |
|                      | | 10:30 María  · XYZ-789 · Diagnóstico · Pend. [Conf.]| |
|                      | | 12:00 Cupo libre · Bahía 2 · 60m              [Crear]|
|                      | +-----------------------------------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Corrección clave respecto a v0.2

La versión anterior era rica, pero demasiado vertical.

La versión v0.3 comprime la pantalla en cinco bloques visibles:

```text id="g9y7fz"
1. Estado de citas.
2. Cupos vendibles.
3. Acciones urgentes.
4. Carga del taller.
5. Demanda reciente + agenda compacta.
```

No requiere scroll.

No obliga al usuario a buscar.

No muestra métricas decorativas.

---

# Lectura en 5 segundos

En menos de 5 segundos el dueño debe entender:

```text id="7uafos"
Tengo 8 citas.
5 están confirmadas.
2 requieren llamada.
1 está en riesgo.
Tengo 3 cupos que puedo vender hoy.
Carlos y Bahía 2 tienen espacio.
Luis está lleno.
Lo que más piden es frenos.
La próxima acción urgente es confirmar citas.
```

Si el usuario entiende eso, la pantalla cumple.

---

# Tabs superiores

Para evitar scroll y mantener profundidad, la pantalla puede tener tabs.

```text id="ixpafu"
[Hoy] [Mañana] [Semana]
```

## Tab Hoy

Propósito:

```text id="x9id48"
Operación inmediata del día.
```

Debe mostrar:

* citas de hoy;
* confirmadas;
* pendientes;
* riesgo;
* cupos vendibles;
* carga mecánicos/bahías;
* acciones urgentes;
* agenda compacta.

## Tab Mañana

Propósito:

```text id="x52d4q"
Preparar la operación del siguiente día.
```

Debe mostrar la misma estructura, pero con:

* citas de mañana;
* cupos disponibles mañana;
* mecánicos/bahías comprometidos;
* citas aún no confirmadas;
* demanda prevista.

## Tab Semana

Propósito:

```text id="tgb0z3"
Ver tendencia y planificación.
```

Debe cambiar algunos bloques:

* citas por día;
* ocupación promedio por mecánico/bahía;
* demanda por tipo de evaluación;
* días con más huecos;
* días saturados.

No debe mostrar una agenda detallada de toda la semana dentro de esta pantalla.

---

# Estructura exacta de componentes

## 1. Header

```text id="f0buzt"
RESUMEN OPERATIVO
Hoy, cupos disponibles y carga del taller
[Nueva cita] [Agenda] [Refresh]
```

### Botón: Nueva cita

Uso:

* crear cita manual rápidamente;
* ideal cuando entra una llamada.

### Botón: Agenda

Uso:

* abrir agenda completa;
* no reemplaza el dashboard.

### Botón: Refresh

Uso:

* actualizar disponibilidad, citas y alertas.

---

## 2. Selector de vista

```text id="9q7gi6"
Vista: [Hoy] [Mañana] [Semana]
Fecha: 07 Jul 2026
```

Regla:

* Hoy debe ser default.
* Mañana permite planificar.
* Semana permite analizar ocupación y demanda.
* No agregar más tabs en esta primera versión.

---

## 3. Cards de estado de citas

```text id="ic4o4i"
+------------+ +------------+ +------------+ +---------+
| CITAS HOY  | | CONFIRM.   | | PENDIENT.  | | RIESGO  |
|     8      | |     5      | |     2      | |   1     |
| 3 próximas | | asistencia | | llamar     | | sin resp|
+------------+ +------------+ +------------+ +---------+
```

### Qué muestra

* total de citas;
* citas confirmadas;
* pendientes de confirmar;
* citas en riesgo.

### Qué permite decidir

* llamar primero a pendientes;
* liberar o proteger cupos;
* preparar recepción.

### Acción al hacer click

```text id="n2gvbx"
Citas hoy -> agenda filtrada de hoy.
Confirmadas -> agenda confirmada.
Pendientes -> lista de llamadas pendientes.
Riesgo -> casos sin respuesta.
```

---

## 4. Panel: Cupos para ofrecer hoy

```text id="za2l2z"
+-----------------------------+
| CUPOS PARA OFRECER HOY      |
|                             |
| 10:30  Frontdesk  30m       |
| Evaluación rápida            |
| [Crear cita]                |
|-----------------------------|
| 12:00  Bahía 2    60m       |
| Diagnóstico general          |
| [Crear cita]                |
|-----------------------------|
| 15:30  Carlos     90m       |
| Frenos / suspensión          |
| [Crear cita]                |
+-----------------------------+
```

### Regla de contenido

Mostrar máximo tres cupos.

Criterio para elegirlos:

```text id="hl3jd7"
1. Más próximo.
2. Más vendible.
3. Mayor duración útil.
4. Mejor match con demanda reciente.
```

### No mostrar

* veinte slots;
* grillas complejas;
* disponibilidad minuto a minuto;
* cupos sin utilidad comercial.

### Botón: Crear cita

Debe abrir un modal o flujo rápido con:

```text id="k4kic7"
Cliente
Teléfono
Servicio / evaluación
Slot seleccionado
Confirmación
```

---

## 5. Panel: Acciones urgentes

```text id="31xpc4"
+---------------------+
| ACCIONES URGENTES   |
|                     |
| ALTA                |
| 2 citas sin confirmar|
| [Revisar]           |
|---------------------|
| MEDIA               |
| 1 cotización pend.  |
| [Ver]               |
|---------------------|
| BAJA                |
| Mensaje fallido     |
| [Revisar]           |
+---------------------+
```

### Regla de contenido

Mostrar máximo tres urgencias.

Prioridad:

```text id="mp82hl"
1. Afecta atención de hoy.
2. Afecta venta/cotización.
3. Afecta comunicación.
```

### No mostrar

* actividad reciente genérica;
* eventos informativos;
* timelines largos.

---

## 6. Panel: Carga mecánicos / bahías

```text id="zar51x"
+-----------------------------+
| CARGA MECÁNICOS / BAHÍAS    |
|                             |
| Luis     90%  sin huecos    |
| Carlos   55%  2 huecos      |
| Ana      70%  1 hueco       |
|                             |
| Bahía 1  85%  libre 16:00   |
| Bahía 2  40%  libre 12:00   |
| Bahía 3   0%  disponible    |
+-----------------------------+
```

### Por qué unir mecánicos y bahías

Para evitar un dashboard demasiado alto.

El dueño necesita una lectura rápida de capacidad, no dos reportes separados.

### Señales visuales en implementación

* 0–60%: disponible.
* 61–85%: ocupado razonable.
* 86–100%: saturado.
* Texto visible: “2 huecos”, “sin huecos”, “disponible”.

### Acción implícita

Click en mecánico o bahía abre agenda filtrada.

---

## 7. Panel: Demanda reciente

```text id="vpmg76"
+---------------------+
| DEMANDA RECIENTE    |
| Últimos 7 días      |
|                     |
| Frenos          12  |
| Diagnóstico gral 9  |
| Pre-compra       6  |
| Mantenimiento    5  |
|                     |
| [Ver catálogo]      |
+---------------------+
```

### Qué permite decidir

* qué anunciar;
* qué servicio destacar;
* qué stock revisar;
* qué técnico preparar;
* qué combo/promoción considerar.

### Regla

Este bloque es tendencia útil, no analítica profunda.

No debe mostrar gráficos complejos en la vista Hoy.

---

## 8. Agenda compacta

```text id="y8k47a"
+-----------------------------------------------------+
| AGENDA COMPACTA                                     |
| 09:00 Carlos · ABC-123 · Frenos · Confirmada [Ver]  |
| 10:30 María  · XYZ-789 · Diagnóstico · Pend. [Conf.]|
| 12:00 Cupo libre · Bahía 2 · 60m              [Crear]|
+-----------------------------------------------------+
```

### Regla

Mostrar máximo tres líneas:

```text id="7e89hs"
1. Próxima cita.
2. Siguiente cita con atención pendiente.
3. Próximo cupo libre.
```

No mostrar toda la agenda aquí.

Para eso está el botón:

```text id="jfjj7g"
[Agenda]
```

---

# Modal sugerido: Crear cita rápida

Cuando el usuario hace click en “Crear cita” desde un cupo:

```text id="5oh51g"
+---------------------------------------------+
| Crear cita rápida                           |
+---------------------------------------------+
| Slot seleccionado                           |
| 12:00 - 13:00 · Bahía 2 · Diagnóstico       |
|                                             |
| Cliente                                     |
| [Nombre]                                    |
|                                             |
| Teléfono                                    |
| [+51...]                                    |
|                                             |
| Tipo de evaluación                          |
| [Diagnóstico general v]                     |
|                                             |
| Notas                                       |
| [textarea]                                  |
|                                             |
| [Cancelar] [Crear cita]                     |
+---------------------------------------------+
```

Regla:

* El slot viene preseleccionado.
* El usuario no debe volver a buscar disponibilidad.
* Backend debe validar disponibilidad final.

---

# Variante tab Semana

El tab Semana no debe usar el mismo layout exacto.

Debe quedar así:

```text id="les2el"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Resumen Operativo                         OPERATIVO      |
|----------------------|---------------------------------------------------------|
| > Resumen Operativo  | RESUMEN OPERATIVO                                      |
|                      | Semana, ocupación y demanda                             |
|                      |                         [Nueva cita] [Agenda] [Refresh] |
|                      |---------------------------------------------------------|
|                      | Vista: [Hoy] [Mañana] [Semana]                          |
|                      |---------------------------------------------------------|
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      | | CITAS SEM. | | OCUPACIÓN  | | DÍA LIBRE  | | DÍA FULL| |
|                      | |    42      | |    72%     | |  Jueves   | | Viernes | |
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      |                                                         |
|                      | +-----------------------------+ +---------------------+ |
|                      | | OCUPACIÓN POR DÍA          | | DEMANDA SEMANAL     | |
|                      | | Lun 80%                    | | Frenos          12  | |
|                      | | Mar 75%                    | | Diagnóstico gral 9  | |
|                      | | Mié 60%                    | | Pre-compra       6  | |
|                      | | Jue 40%                    | | Mant. preventivo 5  | |
|                      | | Vie 95%                    | |                     | |
|                      | +-----------------------------+ +---------------------+ |
|                      |                                                         |
|                      | +-----------------------------+ +---------------------+ |
|                      | | HUECOS RECOMENDADOS        | | ALERTAS SEMANALES   | |
|                      | | Jueves 10:00 - 12:00       | | Viernes saturado    | |
|                      | | Miércoles 15:00 - 17:00    | | 3 citas sin conf.   | |
|                      | | [Crear cita]               | | [Revisar]           | |
|                      | +-----------------------------+ +---------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Qué se elimina del Resumen Operativo principal

Para cumplir “sin scroll” y “5 segundos”, se eliminan de la vista principal:

```text id="ja5rdv"
- Timeline global largo.
- Actividad reciente genérica.
- Embudo operativo completo.
- Ingresos estimados como KPI principal.
- Gráficos grandes.
- Tablas completas.
- Listados de más de 3–4 elementos.
```

Estas cosas pueden vivir en:

```text id="gn5h1e"
- Agenda completa.
- Órdenes de Taller.
- Bahías y Ejecución.
- Reporte semanal futuro.
- Panel de analítica futuro.
```

---

# Criterio de validación del wireframe v0.3

La pantalla es válida si el dueño puede responder sin buscar:

```text id="81z2d8"
1. ¿Cuántas citas tengo hoy?
2. ¿Cuántas faltan confirmar?
3. ¿Qué cupo puedo ofrecer si me llaman ahora?
4. ¿Quién está lleno?
5. ¿Quién tiene huecos?
6. ¿Qué bahía está libre?
7. ¿Qué urgencia atiendo primero?
8. ¿Qué servicio me están pidiendo más?
```

Si necesita hacer scroll, la pantalla falla.

Si necesita abrir otra pantalla para saber si puede ofrecer un turno, la pantalla falla.

Si no entiende el estado en 5 segundos, la pantalla falla.

---

# Recomendación final

Este wireframe v0.3 reemplaza al anterior para Resumen Operativo.

El diseño queda centrado en:

```text id="25tqru"
Citas
Confirmación
Cupos vendibles
Carga de recursos
Urgencias reales
Demanda reciente
Agenda mínima
```

No queda centrado en métricas decorativas.

No queda centrado en reportes largos.

No queda centrado en actividad histórica.

Es una pantalla de operación diaria para dueño de taller.

---

# WF-07 v0.2 | Admin - Órdenes de Taller como jefe de taller

## Objetivo de la pantalla

La pantalla Órdenes de Taller debe funcionar como la consola principal para decidir y controlar una orden.

No debe ser una página larga.

No debe obligar al jefe de taller a buscar información crítica.

Debe responder en menos de 5 segundos:

* cuál es la orden;
* quién es el cliente;
* qué vehículo es;
* en qué etapa está;
* cuánto dinero hay cotizado/aprobado;
* qué falta para avanzar;
* quién está a cargo;
* si hay bloqueo;
* cuál es la próxima acción.

---

# Decisión sobre WF-07 original

El WF-07 original no vuela completo, pero sí se corrige.

Se conserva:

```text id="cphjx0"
- Sidebar.
- Header.
- Filtros superiores.
- Listado de órdenes a la izquierda.
- Detalle de orden a la derecha.
- Tabs por etapa.
```

Se elimina o corrige:

```text id="nas68r"
- Scroll interno largo como solución principal.
- Tabs con demasiada información sin priorizar.
- Detalle de orden demasiado genérico.
- Timeline breve ocupando espacio principal.
- Acciones visibles sin depender del estado.
- Mezcla visual entre resumen, admisión, diagnóstico, cotización y ejecución.
```

---

# Regla madre de WF-07

```text id="ncc1og"
La lista sirve para elegir.
El panel derecho sirve para decidir.
Los tabs sirven para profundizar sin hacer scroll.
```

---

# Layout validado sin scroll global

```text id="nx8nm6"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Órdenes de Taller                         OPERATIVO      |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | ÓRDENES DE TALLER                                      |
| > Órdenes de Taller  | Control de orden, autorización, ejecución y cierre      |
|   Admisión y Diagn.  |                         [Crear orden] [Agenda] [Refresh]|
|   Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           | Estado [Todos v] Buscar [cliente/placa/orden] Fecha     |
|   Servicios          | Etapa [Todas v] Responsable [Todos v] [Filtrar] [Limpiar]|
|   Mensajes           |---------------------------------------------------------|
|   Personal y Equipos |                                                         |
|   Ajustes            | +--------------------------+--------------------------+ |
|                      | | LISTA DE ÓRDENES         | ORDEN SELECCIONADA       | |
|----------------------| |                          |                          | |
| Admin Web            | | +----------------------+ | TUR-2026-0001            | |
| rol: owner           | | | Carlos Ramírez      | | Toyota Yaris ABC-123    | |
| [Cerrar sesión]      | | | ABC-123 · Frenos    | | Cliente: Carlos         | |
|                      | | | En cotización       | | Estado: Espera decisión | |
|                      | | | S/ 850 cotizado     | | Próxima acción:         | |
|                      | | | Falta aprobación    | | Registrar aprobación    | |
|                      | | +----------------------+ | [Registrar decisión]    | |
|                      | |                          | [Copiar cotización]     | |
|                      | | +----------------------+ | [Más acciones]          | |
|                      | | | María Torres       | |--------------------------| |
|                      | | | XYZ-789 · Diagn.   | | RESUMEN DE DECISIÓN     | |
|                      | | | En diagnóstico     | |                          | |
|                      | | | Técnico: Luis      | | Cotizado: S/ 850        | |
|                      | | | Vence: --          | | Aprobado: S/ 0          | |
|                      | | +----------------------+ | Pendiente: S/ 850       | |
|                      | |                          | Validez: vence mañana   | |
|                      | | +----------------------+ | Técnico: sin asignar    | |
|                      | | | Orden              | | Bahía: sin asignar      | |
|                      | | | Cliente / placa    | | Bloqueos: ninguno      | |
|                      | | | Estado / alerta    | | Evidencia OK: faltante  | |
|                      | | +----------------------+ |--------------------------| |
|                      | |                          | [Resumen] [Admisión]    | |
|                      | | Página 1 de N            | [Diagnóstico] [Cotización]|
|                      | | [<] [>]                 | [Decisión] [Ejecución]  | |
|                      | |                          | [Historial]             | |
|                      | +--------------------------+--------------------------+ |
|                      | | TAB ACTIVO: COTIZACIÓN                              | |
|                      | |-----------------------------------------------------| |
|                      | | Estado: Preparada · Versión v2 · Vence: 08 Jul 18:00| |
|                      | |                                                     | |
|                      | | Mano de obra     S/ 300    [2 líneas] [Ver/Editar]  | |
|                      | | Repuestos        S/ 420    [3 líneas] [Ver/Editar]  | |
|                      | | Terceros         S/ 130    [1 línea ] [Ver/Editar]  | |
|                      | |                                                     | |
|                      | | Total cotizado   S/ 850                             | |
|                      | | Total aprobado   S/ 0                               | |
|                      | | Pendiente aprob. S/ 850                             | |
|                      | |                                                     | |
|                      | | [Nueva versión] [Enviar/Marcar enviada] [Copiar]    | |
|                      | +-----------------------------------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Lectura en 5 segundos

El jefe debe entender inmediatamente:

```text id="nwg3bs"
Orden TUR-2026-0001.
Cliente Carlos Ramírez.
Vehículo Toyota Yaris ABC-123.
Está esperando decisión.
Hay S/ 850 cotizados.
No hay nada aprobado.
La cotización vence mañana.
No hay evidencia de OK.
La próxima acción es registrar aprobación o rechazo.
```

Si esto no se entiende sin abrir otro panel, la pantalla falla.

---

# Estructura definitiva de la pantalla

## 1. Header

```text id="ymn1wk"
ÓRDENES DE TALLER
Control de orden, autorización, ejecución y cierre
[Crear orden] [Agenda] [Refresh]
```

### Botón: Crear orden

Uso:

* nueva orden manual;
* puede venir desde llamada, WhatsApp o recepción.

### Botón: Agenda

Uso:

* ver disponibilidad completa;
* no reemplaza la consola de orden.

### Botón: Refresh

Uso:

* actualizar estado, pagos, aprobaciones, timeline y ejecución.

---

## 2. Filtros superiores compactos

```text id="7w41dr"
Estado [Todos v]
Buscar [cliente / placa / número de orden]
Fecha [Hoy / semana / rango]
Etapa [Todas v]
Responsable [Todos v]
[Filtrar] [Limpiar]
```

### Estados sugeridos

```text id="92o5dl"
Todos
Recibido
Admisión pendiente
En diagnóstico
Cotización preparada
Esperando decisión
Aprobado parcial
Aprobado total
En ejecución
Bloqueado
Control de calidad
Listo para entrega
Entregado
Cancelado
```

### Regla

Los filtros no deben ocupar más de una fila en desktop.

En tablet, se puede usar botón:

```text id="0fbqrp"
[Filtros]
```

que abre modal o drawer.

---

# 3. Lista de órdenes

## Objetivo

Elegir rápidamente una orden.

No debe ser una tabla compleja.

Cada card debe mostrar:

```text id="cgzzwo"
Cliente
Placa / vehículo
Servicio o problema principal
Estado
Monto cotizado o aprobado
Alerta principal
Responsable o etapa
```

## Card ejemplo

```text id="nxrv6r"
+------------------------------+
| Carlos Ramírez               |
| ABC-123 · Toyota Yaris       |
| Frenos / ruido al frenar     |
| Estado: Espera decisión      |
| Cotizado: S/ 850             |
| Falta aprobación             |
+------------------------------+
```

## Badges útiles

```text id="b7gi4n"
Vence hoy
Sin técnico
Bloqueado
OK parcial
Listo QC
Sin evidencia
```

## Paginación

Para evitar scroll largo:

```text id="9k87p5"
Página 1 de N
[<] [>]
```

Máximo visible recomendado:

```text id="tiej35"
5 órdenes en desktop estándar.
```

Si hay más, paginar o usar búsqueda.

---

# 4. Header de orden seleccionada

Debe ser fijo dentro del panel derecho.

```text id="f8x0vp"
TUR-2026-0001
Toyota Yaris ABC-123
Cliente: Carlos Ramírez
Estado: Espera decisión

Próxima acción: Registrar aprobación
[Registrar decisión] [Copiar cotización] [Más acciones]
```

## Acción primaria por estado

```text id="9ekm95"
Recibido                 -> Completar admisión
Admisión pendiente       -> Guardar admisión
En diagnóstico           -> Emitir diagnóstico
Cotización preparada     -> Enviar / marcar enviada
Esperando decisión       -> Registrar decisión
Aprobado parcial         -> Crear ejecución parcial
Aprobado total           -> Crear orden de trabajo
En ejecución             -> Actualizar avance
Bloqueado                -> Resolver bloqueo
Control de calidad       -> Completar QC
Listo para entrega       -> Registrar entrega
Entregado                -> Ver historial
Cancelado                -> Ver historial
```

---

# 5. Resumen de decisión

Este bloque es obligatorio y debe estar siempre visible.

```text id="h9f4s1"
+--------------------------+
| RESUMEN DE DECISIÓN      |
|                          |
| Cotizado: S/ 850         |
| Aprobado: S/ 0           |
| Pendiente: S/ 850        |
| Validez: vence mañana    |
| Técnico: sin asignar     |
| Bahía: sin asignar       |
| Bloqueos: ninguno        |
| Evidencia OK: faltante   |
+--------------------------+
```

## Campos obligatorios

```text id="e81i7s"
Cotizado
Aprobado
Pendiente
Validez
Técnico
Bahía
Bloqueos
Evidencia de aprobación
```

## Por qué este bloque existe

Porque el jefe no debe entrar a Cotización, Decisión y Ejecución solo para saber si puede avanzar.

---

# 6. Tabs del detalle

Tabs definitivos:

```text id="y87r7v"
[Resumen]
[Admisión]
[Diagnóstico]
[Cotización]
[Decisión]
[Ejecución]
[Historial]
```

Regla:

* Solo un tab visible a la vez.
* Cada tab debe caber en la zona inferior sin scroll global.
* Si hay más contenido, usar:

  * “Ver detalle”;
  * modal;
  * paginación;
  * acordeón compacto;
  * drawer lateral.

---

# TAB 1: Resumen

## Objetivo

Dar una ficha compacta de la orden.

```text id="1gd36v"
+-----------------------------------------------------+
| TAB ACTIVO: RESUMEN                                 |
|-----------------------------------------------------|
| Cliente: Carlos Ramírez      Tel: +51 999 888 777   |
| Vehículo: Toyota Yaris       Placa: ABC-123         |
| Servicio: Frenos             Origen: WhatsApp       |
| Problema: Ruido al frenar al bajar velocidad        |
| Fecha ingreso: 07 Jul 09:00  Responsable: Luis      |
| Estado: Espera decisión      Próxima acción: OK     |
|                                                     |
| [Editar datos] [Ver cliente] [Ver vehículo]         |
+-----------------------------------------------------+
```

## No debe mostrar

* Todo el historial.
* Todos los campos técnicos.
* Evidencia completa.
* Formularios largos.

---

# TAB 2: Admisión

## Objetivo

Ver si la recepción está completa.

```text id="wca2ol"
+-----------------------------------------------------+
| TAB ACTIVO: ADMISIÓN                                |
|-----------------------------------------------------|
| Estado admisión: Completa                           |
|                                                     |
| Checklist                                           |
| [x] Kilometraje registrado     85,000 km            |
| [x] Fotos iniciales            4 archivos           |
| [x] Daños visibles             registrado           |
| [ ] Autorización revisión      pendiente            |
|                                                     |
| Datos rápidos                                      |
| Combustible: 1/2              Accesorios: sí        |
| Observación: golpe menor en parachoques             |
|                                                     |
| [Completar autorización] [Adjuntar evidencia]       |
+-----------------------------------------------------+
```

## Decisión que permite

```text id="8ifihl"
¿Puedo pasar a diagnóstico o falta algo de recepción?
```

---

# TAB 3: Diagnóstico

## Objetivo

Ver si existe diagnóstico técnico accionable.

```text id="8cwfx1"
+-----------------------------------------------------+
| TAB ACTIVO: DIAGNÓSTICO                             |
|-----------------------------------------------------|
| Estado diagnóstico: Emitido                         |
| Técnico: Luis                Severidad: Media       |
|                                                     |
| Hallazgo principal                                  |
| Desgaste en pastillas delanteras y vibración leve.  |
|                                                     |
| Recomendación                                      |
| Cambio de pastillas + revisión de discos.           |
|                                                     |
| Evidencia: 3 fotos                                  |
|                                                     |
| [Editar diagnóstico] [Preparar cotización]          |
+-----------------------------------------------------+
```

## Si no hay diagnóstico

```text id="3i6ig6"
Estado diagnóstico: Pendiente
Próxima acción: Emitir diagnóstico
[Emitir diagnóstico]
```

---

# TAB 4: Cotización

Tus sugerencias entran aquí.

## Objetivo

Ver dinero, líneas, validez y versiones.

Debe permitir responder:

```text id="gx76io"
¿Qué se está cobrando?
¿Qué parte es mano de obra?
Qué parte es repuesto?
¿Qué parte es tercero?
¿Qué tipo de repuesto se está usando?
¿Cuándo vence?
¿Es versión nueva o recotización?
```

## Wireframe

```text id="evi1tb"
+-----------------------------------------------------+
| TAB ACTIVO: COTIZACIÓN                              |
|-----------------------------------------------------|
| Estado: Preparada       Versión: v2                 |
| Validez: vence 08 Jul 18:00                         |
| Motivo versión: cliente pidió alternativa genérica   |
|                                                     |
| +----------------+----------+----------+-----------+ |
| | Grupo          | Líneas   | Total    | Estado    | |
| +----------------+----------+----------+-----------+ |
| | Mano de obra   |   2      | S/ 300   | Cotizado  | |
| | Repuestos      |   3      | S/ 420   | Cotizado  | |
| | Terceros       |   1      | S/ 130   | Cotizado  | |
| +----------------+----------+----------+-----------+ |
|                                                     |
| Total cotizado: S/ 850                              |
| Total aprobado: S/ 0                                |
| Pendiente aprobación: S/ 850                        |
|                                                     |
| Repuestos: 1 original · 2 genéricos · 0 usados      |
|                                                     |
| [Ver líneas] [Nueva versión] [Copiar cotización]    |
| [Marcar enviada]                                   |
+-----------------------------------------------------+
```

## Modal / drawer: Ver líneas

Para no usar scroll en la pantalla principal.

```text id="4y6kc8"
+---------------------------------------------------------+
| Líneas de cotización - v2                               |
+---------------------------------------------------------+
| Mano de obra                                             |
| - Cambio pastillas delanteras       S/ 180              |
| - Revisión de discos                S/ 120              |
|                                                         |
| Repuestos                                               |
| - Pastillas delanteras   Genérico   Cant 1   S/ 220     |
| - Líquido frenos         Original   Cant 1   S/ 120     |
| - Insumo limpieza        Genérico   Cant 1   S/ 80      |
|                                                         |
| Terceros                                                 |
| - Rectificado externo               S/ 130              |
|                                                         |
| [Cerrar] [Editar líneas]                                |
+---------------------------------------------------------+
```

## Tipo de repuesto

Cada línea de repuesto debe tener:

```text id="bm8wxl"
Original
Genérico
Usado
Reacondicionado, opcional futuro
```

## Validez con vencimiento automático

Campos:

```text id="0iitxc"
Válida hasta
Estado de vencimiento
Acción al vencer
```

Estados:

```text id="p412kd"
Vigente
Vence hoy
Vencida
Re-cotizada
```

## Historial de versiones

Debe existir, pero no ocupar la vista principal.

Botón:

```text id="czeez1"
[Ver versiones]
```

Modal:

```text id="r8x7jw"
v1 · S/ 920 · vencida · repuesto original
v2 · S/ 850 · vigente · alternativa genérica
v3 · futuro
```

---

# TAB 5: Decisión

Tus sugerencias son críticas aquí.

## Objetivo

Registrar qué aprobó el cliente, quién lo autorizó y con qué evidencia.

No debe ser solo “sí/no”.

Debe permitir aprobación parcial por línea o grupo.

## Wireframe

```text id="jzdb4q"
+-----------------------------------------------------+
| TAB ACTIVO: DECISIÓN                                |
|-----------------------------------------------------|
| Estado decisión: Pendiente                          |
| Aprobado: S/ 0 / S/ 850                             |
| Evidencia de OK: Faltante                           |
|                                                     |
| Aprobación por grupo                                |
| [ ] Mano de obra     S/ 300                         |
| [ ] Repuestos        S/ 420                         |
| [ ] Terceros         S/ 130                         |
|                                                     |
| Autorizó                                             |
| Nombre: [____________________]                       |
| Canal:  [WhatsApp v]                                 |
| Fecha:  [auto / editable]                            |
|                                                     |
| Evidencia                                             |
| [Adjuntar captura / audio / firma]                   |
|                                                     |
| [Aprobar seleccionado] [Rechazar] [Guardar pendiente]|
+-----------------------------------------------------+
```

## Aprobación parcial por línea

En la vista principal se aprueba por grupo para no saturar.

Para aprobación por línea:

```text id="ptwlq8"
[Detalle por línea]
```

Abre modal:

```text id="w2l38w"
+---------------------------------------------------------+
| Aprobación por línea                                    |
+---------------------------------------------------------+
| [x] Cambio pastillas delanteras       S/ 180            |
| [x] Revisión de discos                S/ 120            |
| [ ] Pastillas delanteras genéricas    S/ 220            |
| [ ] Líquido de frenos original        S/ 120            |
| [ ] Rectificado externo               S/ 130            |
|                                                         |
| Total seleccionado: S/ 300                              |
| [Aplicar selección]                                     |
+---------------------------------------------------------+
```

## Evidencia del OK

Tipos aceptados:

```text id="m5mz6c"
Captura
Audio
Firma
Nota manual
Email
WhatsApp exportado
```

Regla:

```text id="23lm0z"
No se debe permitir pasar a ejecución sin registrar quién autorizó.
Si la aprobación es manual, debe existir evidencia o nota obligatoria.
```

---

# TAB 6: Ejecución

Tus sugerencias entran aquí.

## Objetivo

Controlar que lo aprobado se ejecute correctamente.

Debe responder:

```text id="tpgpjn"
¿Quién lo está haciendo?
¿En qué bahía?
¿Qué tareas faltan?
¿Qué repuestos se usaron?
¿Está bloqueado?
¿Pasó control de calidad?
```

## Wireframe

```text id="92fo07"
+-----------------------------------------------------+
| TAB ACTIVO: EJECUCIÓN                               |
|-----------------------------------------------------|
| Estado ejecución: En progreso                       |
| Técnico: Luis             Bahía: 2                  |
| Inicio: 10:30             ETA: 13:00                |
|                                                     |
| Checklist técnico                                  |
| [x] Retirar ruedas                                  |
| [x] Cambiar pastillas                               |
| [ ] Revisar discos                                  |
| [ ] Prueba de frenado                               |
|                                                     |
| Repuestos usados                                    |
| Pastillas genéricas · Cant 1 · descuenta inventario |
| Líquido frenos original · Cant 1 · pendiente uso    |
|                                                     |
| Bloqueo: ninguno                                    |
| QC final: pendiente                                 |
|                                                     |
| [Actualizar tareas] [Reportar bloqueo] [Control QC] |
+-----------------------------------------------------+
```

## Bloqueos

Si hay bloqueo:

```text id="zpcqzo"
Bloqueo: Repuesto no disponible
Motivo: pastillas originales sin stock
Desde: 11:20
Responsable: almacén
[Resolver bloqueo]
```

Motivos sugeridos:

```text id="kgc54e"
Repuesto no disponible
Cliente no autoriza
Falta técnico
Falta bahía
Trabajo externo pendiente
Herramienta no disponible
Problema adicional detectado
```

## Control de calidad final

Debe ser obligatorio antes de “Listo”.

Checklist QC:

```text id="5i1fuk"
[ ] Trabajo realizado coincide con lo aprobado
[ ] Prueba funcional completada
[ ] Evidencia final adjunta
[ ] Vehículo limpio / listo
[ ] Técnico responsable confirma
```

Botón:

```text id="pzaj5w"
[Marcar listo para entrega]
```

Regla:

```text id="jshwkv"
No se puede marcar listo si QC final está pendiente.
```

## Repuestos usados e inventario

La pantalla debe mostrar si el repuesto:

```text id="x907pl"
Reservado
Usado
Devuelto
Pendiente
Sin stock
```

Acción:

```text id="bi9kqf"
[Registrar uso]
```

Regla:

```text id="o3ik1r"
Registrar repuesto usado debe preparar descuento de inventario.
Si inventario aún no existe, dejar como evento operativo registrado.
```

---

# TAB 7: Historial

Tu sugerencia entra completa.

## Objetivo

Auditoría total: quién hizo qué y cuándo.

No debe ser el foco principal de decisión diaria, pero debe existir completo.

## Wireframe compacto

```text id="a20voi"
+-----------------------------------------------------+
| TAB ACTIVO: HISTORIAL                               |
|-----------------------------------------------------|
| Timeline completo                                   |
|                                                     |
| 12:05  Luis       checklist.updated                 |
|       Marcó "Cambiar pastillas" como completado     |
|                                                     |
| 11:20  Sistema    inventory.reserved                |
|       Pastillas genéricas reservadas                |
|                                                     |
| 10:40  Admin      quote.approved.partial            |
|       Mano de obra aprobada por WhatsApp            |
|                                                     |
| 10:10  Admin      quote.version.created             |
|       v2 creada con repuestos genéricos             |
|                                                     |
| [Ver más eventos] [Filtrar] [Exportar futuro]       |
+-----------------------------------------------------+
```

## Para no usar scroll

Mostrar últimos 4 eventos.

Botón:

```text id="8s62wj"
[Ver más eventos]
```

abre modal o pantalla dedicada.

## Cada evento debe tener

```text id="nzzx7d"
Timestamp
Actor
Event type
Descripción
Entidad afectada
Metadata expandible
```

---

# Estados que debe soportar la orden

```text id="59n4n5"
received
admission_pending
diagnosis_in_progress
diagnosis_ready
quote_draft
quote_prepared
quote_sent
waiting_customer_decision
partially_approved
approved
execution_pending
in_execution
blocked
quality_control
ready_for_delivery
delivered
cancelled
```

Labels en UI:

```text id="mli05p"
Recibido
Admisión pendiente
En diagnóstico
Diagnóstico listo
Cotización borrador
Cotización preparada
Cotización enviada
Esperando decisión
Aprobado parcial
Aprobado total
Pendiente de ejecución
En ejecución
Bloqueado
Control de calidad
Listo para entrega
Entregado
Cancelado
```

---

# Acciones por estado

```text id="lxptne"
Recibido
- Completar admisión
- Cancelar orden

Admisión pendiente
- Guardar admisión
- Adjuntar evidencia
- Pasar a diagnóstico

En diagnóstico
- Guardar diagnóstico
- Emitir diagnóstico

Diagnóstico listo
- Preparar cotización

Cotización preparada
- Ver líneas
- Nueva versión
- Marcar enviada
- Copiar cotización

Esperando decisión
- Registrar aprobación
- Registrar rechazo
- Adjuntar evidencia

Aprobado parcial
- Crear ejecución parcial
- Re-cotizar pendiente

Aprobado total
- Crear orden de trabajo
- Asignar técnico/bahía

En ejecución
- Actualizar tareas
- Registrar repuestos usados
- Reportar bloqueo
- Enviar a QC

Bloqueado
- Resolver bloqueo
- Registrar nota
- Reasignar

Control de calidad
- Completar checklist QC
- Marcar listo para entrega

Listo para entrega
- Registrar entrega
- Adjuntar conformidad

Entregado
- Ver historial
```

---

# Qué no debe estar en esta pantalla principal

Para cumplir sin scroll y decisión en 5 segundos, no debe mostrarse todo al mismo tiempo.

Se excluye de la vista principal:

```text id="1yuld4"
- Tabla completa de todas las líneas de cotización.
- Timeline completo con decenas de eventos.
- Formulario completo de admisión.
- Formulario técnico largo.
- Galería completa de evidencias.
- Inventario detallado.
- Reporte financiero.
- Chat completo con cliente.
```

Todo eso puede abrirse en:

```text id="9q1x6b"
Modal
Drawer
Pantalla dedicada
Botón Ver detalle
```

---

# Validación de 5 segundos

WF-07 v0.2 es válido si el jefe puede responder sin hacer scroll:

```text id="37j98b"
1. ¿Qué orden estoy viendo?
2. ¿Quién es el cliente?
3. ¿Qué vehículo es?
4. ¿Cuál es el estado?
5. ¿Qué falta para avanzar?
6. ¿Cuánto está cotizado?
7. ¿Cuánto está aprobado?
8. ¿La cotización está vencida?
9. ¿Quién autorizó?
10. ¿Hay evidencia?
11. ¿Quién ejecuta?
12. ¿Qué bahía está asignada?
13. ¿Hay bloqueo?
14. ¿Cuál es la próxima acción?
```

Si no puede responder esas preguntas, la pantalla falla.

---

# Recomendación final

WF-07 debe quedar como una consola de orden, no como una página administrativa.

La pantalla debe priorizar:

```text id="i0h7uc"
Estado
Dinero
Autorización
Ejecución
Bloqueos
Próxima acción
Historial auditable
```

Tus sugerencias quedan incorporadas así:

```text id="s0bxyd"
Cotización:
- líneas separadas mano de obra / repuestos / terceros;
- tipo de repuesto original / genérico / usado;
- validez con vencimiento;
- historial de versiones.

Decisión:
- aprobación parcial por grupo o línea;
- registro de quién autorizó;
- evidencia del OK.

Ejecución:
- checklist por técnico;
- bahía asignada;
- bloqueos con motivo;
- QC final;
- repuestos usados e inventario.

Historial:
- timeline completo con timestamp, actor y evento.
```

La versión WF-07 original queda reemplazada por **WF-07 v0.2**.

---

# WF-08 v0.2 | Admin - Admisión y Diagnóstico como jefe de taller

## Objetivo de la pantalla

Esta pantalla debe funcionar como la estación de recepción técnica del taller.

Debe responder en menos de 5 segundos:

* qué autos están esperando admisión;
* qué autos están en diagnóstico;
* cuáles están urgentes o varados;
* cuáles están retrasados;
* qué falta para completar la admisión;
* qué falta para emitir diagnóstico;
* quién es responsable;
* si hay evidencia suficiente;
* si el diagnóstico puede pasar a cotización.

La pantalla no debe tener scroll global.

La pantalla no debe mezclar admisión con cotización.

La pantalla no debe permitir emitir diagnóstico si la admisión está incompleta.

---

# Regla madre

```text id="tr2cwk"
Admisión no es diagnóstico.
Diagnóstico no es cotización.
No se puede emitir diagnóstico sin admisión completa.
No se debe emitir diagnóstico crítico sin evidencia.
```

---

# Layout validado sin scroll

```text id="a0mojk"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Admisión y Diagnóstico                    OPERATIVO      |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | ADMISIÓN Y DIAGNÓSTICO                                  |
|   Órdenes de Taller  | Recepción, evidencia y diagnóstico técnico              |
| > Admisión y Diagn.  |                   [Nueva admisión] [Reasignar] [Refresh]|
|   Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           | [Hoy (8)] [Sin admisión (3)] [En diagnóstico (4)]       |
|   Servicios          | [Pend. foto (2)] [Urgente/varado (1)] [Retraso (2)]     |
|   Mensajes           |---------------------------------------------------------|
|   Personal y Equipos |                                                         |
|   Ajustes            | +--------------------------+--------------------------+ |
|                      | | COLA DE ATENCIÓN         | ESTACIÓN DE TRABAJO      | |
|----------------------| |                          |                          | |
| Admin Web            | | +----------------------+ | ORDEN TUR-2026-0008      | |
| rol: owner           | | | 09:00 cita / 09:12 real| | Toyota Yaris ABC-123    | |
| [Cerrar sesión]      | | | Carlos · ABC-123      | | Cliente: recurrente     | |
|                      | | | Frenos · URGENTE      | | Responsable: Luis       | |
|                      | | | Espera hace 45 min    | | Etapa: admisión         | |
|                      | | | Resp: sin asignar     | | Falta: 2 fotos + firma  | |
|                      | | +----------------------+ | [Reasignar responsable] |
|                      | |                          |--------------------------| |
|                      | | +----------------------+ | [Admisión] [Diagnóstico]|
|                      | | | 10:00 cita / -- real  | | [Historial vehículo]    |
|                      | | | María · XYZ-789       | |--------------------------| |
|                      | | | Diagnóstico general   | | TAB ACTIVO: ADMISIÓN    | |
|                      | | | En diagnóstico        | |                          | |
|                      | | | Resp: Ana             | | Cliente                 | |
|                      | | +----------------------+ | Carlos Ramírez          | |
|                      | |                          | Recurrente · 3 visitas  | |
|                      | | +----------------------+ |                          | |
|                      | | | Sin cita / llegó 11:05| | Vehículo                | |
|                      | | | José · KIA-456        | | Toyota Yaris 2020       | |
|                      | | | VARADO                | | ABC-123 · 85,000 km     | |
|                      | | | Espera hace 20 min    | |                          | |
|                      | | | Resp: Frontdesk       | | Checklist admisión      | |
|                      | | +----------------------+ | [x] Kilometraje         | |
|                      | |                          | [x] Combustible         | |
|                      | | Página 1 de N            | [ ] Fotos mínimas 2/4   | |
|                      | | [<] [>]                 | [x] Aceite visible      | |
|                      | |                          | [ ] Luces testigo       | |
|                      | |                          | [x] Daños previos       | |
|                      | |                          | [ ] Objetos de valor    | |
|                      | |                          | [x] Documentos          | |
|                      | |                          | [ ] Firma cliente       | |
|                      | |                          |                          | |
|                      | |                          | Fotos: [1] [2] [+]      | |
|                      | |                          |                          | |
|                      | |                          | [Guardar admisión]      | |
|                      | |                          | [Completar y diagnost.] | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Lectura en 5 segundos

El jefe debe poder entender inmediatamente:

```text id="f6mx42"
Hay 8 atenciones hoy.
3 no tienen admisión completa.
4 están en diagnóstico.
2 están atrasadas.
1 es urgente/varado.
La orden seleccionada es de Carlos.
El cliente es recurrente.
El vehículo es Toyota Yaris ABC-123.
Responsable actual: Luis.
Faltan 2 fotos y firma para completar admisión.
No se puede pasar formalmente a diagnóstico todavía.
```

Si eso no se entiende sin buscar, la pantalla falla.

---

# Secciones definitivas

## 1. Header

```text id="rnylmx"
ADMISIÓN Y DIAGNÓSTICO
Recepción, evidencia y diagnóstico técnico
[Nueva admisión] [Reasignar] [Refresh]
```

### Botón: Nueva admisión

Uso:

* registrar vehículo que llega sin cita;
* registrar walk-in;
* registrar emergencia/varado.

### Botón: Reasignar

Uso:

* cambiar responsable del caso seleccionado;
* útil cuando quien recibe no es quien diagnostica.

### Botón: Refresh

Uso:

* actualizar cola, estados, tiempos y responsables.

---

## 2. Tabs/filtros de cola

```text id="zrap21"
[Hoy (8)]
[Sin admisión (3)]
[En diagnóstico (4)]
[Pend. foto (2)]
[Urgente/varado (1)]
[Retraso (2)]
```

## Reglas

* Cada tab debe tener contador.
* Máximo seis tabs visibles.
* No usar filtros largos arriba.
* Cada tab representa una decisión operativa.

## Qué decide cada tab

```text id="9kvxqg"
Hoy:
Ver toda la carga de recepción/diagnóstico del día.

Sin admisión:
Qué autos no pueden pasar todavía a diagnóstico formal.

En diagnóstico:
Qué autos están siendo evaluados.

Pend. foto:
Qué casos tienen evidencia incompleta.

Urgente/varado:
Qué debe priorizarse por impacto operativo o cliente detenido.

Retraso:
Qué admisión o diagnóstico excedió SLA.
```

---

# 3. Cola de atención

## Objetivo

Ver qué autos requieren trabajo de recepción o diagnóstico.

Cada tarjeta debe mostrar:

```text id="kvkd95"
Hora de cita
Hora de llegada real
Cliente
Placa
Vehículo o servicio solicitado
Prioridad
Etapa actual
Responsable
Tiempo esperando
Alerta principal
```

## Card ejemplo

```text id="pzml25"
+------------------------------+
| 09:00 cita / 09:12 real      |
| Carlos Ramírez · ABC-123     |
| Frenos · URGENTE             |
| Espera hace 45 min           |
| Resp: sin asignar            |
+------------------------------+
```

## Iconos o señales de prioridad

```text id="vpfu3e"
Rojo: urgente / varado
Ámbar: retraso
Azul: en diagnóstico
Gris: esperando admisión
Verde: listo para cotizar
```

No depender solo del color. Siempre debe haber texto.

## Sin scroll

Para evitar scroll:

```text id="vkuc0u"
Máximo 3 tarjetas visibles.
Paginación: [<] [>]
Búsqueda o tab para reducir carga.
```

---

# 4. Estación de trabajo

## Objetivo

Mostrar el caso seleccionado y permitir avanzar al siguiente paso.

Estructura fija:

```text id="4lxhbf"
Header de orden
Indicador de faltantes
Tabs internos:
[Admisión] [Diagnóstico] [Historial vehículo]
Zona activa del tab
Acciones principales
```

---

# 5. Header de orden seleccionada

```text id="b6eyh0"
ORDEN TUR-2026-0008
Toyota Yaris ABC-123
Cliente: Carlos Ramírez · recurrente
Responsable: Luis
Etapa: admisión
Falta: 2 fotos + firma
[Reasignar responsable]
```

## Campos obligatorios

```text id="gbtyu3"
Número de orden
Cliente
Tipo cliente: nuevo / recurrente
Vehículo
Placa
Responsable
Etapa actual
Qué falta
```

## Regla

El indicador “Qué falta” es obligatorio.

Ejemplos:

```text id="64e5ai"
Falta: 2 fotos + firma
Falta: autorización para desarme
Falta: evidencia del hallazgo crítico
Falta: segunda opinión
Listo para emitir diagnóstico
```

---

# 6. Tabs internos de estación

```text id="fltsjs"
[Admisión] [Diagnóstico] [Historial vehículo]
```

No pondría Cotización aquí.

Cotización vive en Órdenes de Taller.

---

# TAB 1: Admisión

## Objetivo

Confirmar que el vehículo fue recibido con evidencia suficiente.

```text id="3s0s4o"
+-----------------------------------------------------+
| TAB ACTIVO: ADMISIÓN                                |
|-----------------------------------------------------|
| Cliente                                             |
| Carlos Ramírez · Recurrente · 3 visitas             |
|                                                     |
| Vehículo                                            |
| Toyota Yaris 2020 · ABC-123 · 85,000 km             |
|                                                     |
| Checklist admisión                                  |
| [x] Kilometraje registrado                           |
| [x] Nivel combustible                                |
| [ ] Fotos mínimas                 2/4                |
| [x] Nivel de aceite visible                          |
| [ ] Luces testigo registradas                        |
| [x] Daños previos / rayones                          |
| [ ] Objetos de valor registrados                     |
| [x] Documentos / llave extra                         |
| [ ] Firma / aceptación cliente                       |
|                                                     |
| Galería rápida                                      |
| [Foto 1] [Foto 2] [+ Foto]                           |
|                                                     |
| [Guardar admisión] [Completar y pasar a diagnóstico] |
+-----------------------------------------------------+
```

## Checklist recomendado

```text id="ckixib"
Kilometraje
Nivel de combustible
Fotos mínimas
Nivel de aceite visible
Luces testigo
Rayones o daños previos
Objetos de valor
Documentos entregados
Llave extra
Firma / aceptación digital
```

## Firma o aceptación digital

Debe estar antes de completar admisión.

Tipos:

```text id="5csuzv"
Firma en pantalla
Check de aceptación con nombre del cliente
Captura/documento adjunto
Audio o nota, si el proceso lo permite
```

## Regla

```text id="ddhgue"
No se puede marcar admisión completa si faltan campos obligatorios mínimos.
```

Mínimos sugeridos:

```text id="c45gx9"
Kilometraje
Fotos mínimas
Daños previos
Objetos de valor
Firma / aceptación
```

---

# TAB 2: Diagnóstico

## Objetivo

Registrar hallazgos técnicos con evidencia y severidad.

Debe permitir múltiples áreas.

```text id="h6m2zr"
+-----------------------------------------------------+
| TAB ACTIVO: DIAGNÓSTICO                             |
|-----------------------------------------------------|
| Estado: En diagnóstico       Responsable: Luis      |
| Admisión: completa           Evidencia: suficiente  |
|                                                     |
| Hallazgos                                           |
| 1. Frenos        Severidad: ALTA                    |
|    Pastillas delanteras desgastadas                 |
|    Evidencia: 2 fotos                               |
|    ETA reparación: 2h                               |
|    Autoriz. desarme: no requiere                    |
|                                                     |
| 2. Suspensión    Severidad: MEDIA                   |
|    Ruido en lado derecho                            |
|    Evidencia: faltante                              |
|    ETA reparación: por confirmar                    |
|    Autoriz. desarme: requiere                       |
|                                                     |
| [Agregar hallazgo] [Solicitar segunda opinión]      |
| [Guardar borrador] [Emitir diagnóstico]             |
+-----------------------------------------------------+
```

## Cada hallazgo debe tener

```text id="x9b20k"
Área
Severidad
Descripción
Evidencia foto/video
Tiempo estimado de reparación
Requiere autorización para desarme adicional
Recomendación
```

## Áreas múltiples

Áreas sugeridas:

```text id="uzkxkx"
Frenos
Suspensión
Motor
Transmisión
Eléctrico
Dirección
Aire acondicionado
Llantas
Carrocería
Diagnóstico general
```

## Severidad

Debe tener texto y color:

```text id="7bd605"
Crítica / rojo
Alta / rojo
Media / ámbar
Baja / verde
Informativa / gris
```

## Evidencia ligada al hallazgo

La evidencia no debe ser solo “fotos del caso”.

Debe poder asociarse a:

```text id="116kba"
Hallazgo 1
Hallazgo 2
Admisión
Daños previos
Control de calidad futuro
```

---

# 7. Regla de bloqueo al emitir diagnóstico

Antes de emitir diagnóstico, validar:

```text id="ubkf5d"
Admisión completa
Responsable asignado
Al menos un hallazgo
Hallazgos críticos con evidencia
Si requiere desarme, autorización registrada
```

Si falta algo, mostrar advertencia:

```text id="lj0tvz"
No se puede emitir diagnóstico

Faltan:
- Firma de admisión
- Evidencia del hallazgo crítico en frenos

[Volver y completar]
```

---

# 8. Solicitar segunda opinión

## Uso

Para hallazgos complejos o de alto riesgo.

Botón:

```text id="62cgl7"
[Solicitar segunda opinión]
```

Modal:

```text id="l9kofs"
+------------------------------------------------+
| Solicitar segunda opinión                      |
+------------------------------------------------+
| Hallazgo                                       |
| [Frenos - severidad alta v]                    |
|                                                |
| Mecánico sugerido                              |
| [Ana v]                                        |
|                                                |
| Motivo                                         |
| [Ruido no concluyente / validar discos]        |
|                                                |
| [Cancelar] [Solicitar]                         |
+------------------------------------------------+
```

Estados posibles:

```text id="va3la8"
No solicitada
Solicitada
En revisión
Validada
Observada
```

---

# TAB 3: Historial vehículo

## Objetivo

Ayudar a diagnosticar mejor si el cliente es recurrente.

Debe mostrar historial resumido, no timeline infinito.

```text id="3rz7c9"
+-----------------------------------------------------+
| TAB ACTIVO: HISTORIAL VEHÍCULO                      |
|-----------------------------------------------------|
| Toyota Yaris ABC-123                                |
| Cliente recurrente · 3 visitas previas              |
|                                                     |
| 12 May 2026 · Frenos                                |
| Cambio pastillas traseras · Técnico: Ana            |
|                                                     |
| 18 Mar 2026 · Diagnóstico general                   |
| Vibración leve reportada · sin reparación           |
|                                                     |
| 02 Ene 2026 · Mantenimiento                         |
| Aceite + filtros                                    |
|                                                     |
| [Ver historial completo]                            |
+-----------------------------------------------------+
```

## Regla

Mostrar máximo tres eventos previos.

Botón:

```text id="byvy8x"
[Ver historial completo]
```

abre detalle en Órdenes de Taller o modal.

---

# Acciones principales por estado

```text id="rdl6mc"
Sin admisión
- Guardar admisión
- Adjuntar fotos
- Registrar firma
- Completar y pasar a diagnóstico

Admisión incompleta
- Completar faltantes
- Reasignar responsable

En diagnóstico
- Agregar hallazgo
- Guardar borrador
- Solicitar segunda opinión
- Emitir diagnóstico

Diagnóstico con hallazgo crítico sin evidencia
- Adjuntar evidencia
- No permitir emisión final

Requiere desarme
- Registrar autorización
- Guardar borrador
- No emitir como diagnóstico final sin autorización

Diagnóstico listo
- Emitir diagnóstico
- Preparar cotización en Órdenes de Taller
```

---

# Qué NO debe estar aquí

Para mantener foco y no usar scroll, esta pantalla no debe incluir:

```text id="jr1vxu"
Cotización completa
Aprobación del cliente
Ejecución de tareas
Inventario
Control de calidad final
Entrega
Mensajes completos
Timeline completo del caso
```

Eso vive en:

```text id="bqmsbf"
Órdenes de Taller
Bahías y Ejecución
Centro de Mensajes
Historial completo
```

---

# Validación de 5 segundos

La pantalla es válida si el jefe puede responder sin scroll:

```text id="wwdtj3"
1. ¿Cuántos autos están en cola hoy?
2. ¿Cuántos no tienen admisión completa?
3. ¿Cuántos están en diagnóstico?
4. ¿Hay urgentes o varados?
5. ¿Hay retrasados?
6. ¿Qué auto estoy viendo?
7. ¿Quién es responsable?
8. ¿Qué falta para avanzar?
9. ¿La admisión está completa?
10. ¿Hay evidencia suficiente?
11. ¿Hay hallazgos críticos?
12. ¿Puedo emitir diagnóstico o el sistema debe bloquearlo?
```

Si la respuesta no es inmediata, el wireframe falla.

---

# Conclusión

Este WF-08 v0.2 reemplaza al wireframe anterior de Admisión y Diagnóstico.

Queda centrado en:

```text id="p8prf6"
Cola de recepción
Prioridad
Retrasos
Responsable
Admisión completa
Evidencia
Diagnóstico técnico
Segunda opinión
Bloqueos antes de emitir
Historial breve del vehículo
```

No se mezcla con cotización.

No se mezcla con ejecución.

No usa scroll global.

Permite decidir rápido qué auto atender, qué falta y si se puede avanzar.

---

# WF-09 v0.3 | Bahías y Ejecución con semántica no ambigua

## Reglas obligatorias

Esta pantalla debe cumplir cinco reglas:

```text id="2n5gna"
1. No debe tener scroll global.
2. Debe permitir decidir algo en menos de 5 segundos.
3. Debe mostrar bahía física en cada tarjeta.
4. Debe mostrar tiempo en estado en cada tarjeta.
5. Ningún texto operativo debe ser ambiguo.
```

---

# Headers corregidos de kanban

## Versión descartada

```text id="yp4h3e"
COLA
EN PROGRESO
BLOQUEADO
LISTO
```

Problema:

```text id="9juqih"
Son cortos, pero ambiguos.
No dicen cola de qué, progreso de qué, bloqueado por qué ni listo para qué.
```

---

# Versión recomendada

```text id="pxz5l9"
POR ASIGNAR A BAHÍA
TRABAJO EN BAHÍA
DETENIDO / REQUIERE ACCIÓN
LISTO PARA QC / ENTREGA
```

## Significado

### POR ASIGNAR A BAHÍA

Incluye trabajos aprobados que todavía no tienen ubicación física de ejecución.

Decisión que permite:

```text id="i4wxnh"
Asignar bahía y técnico.
```

### TRABAJO EN BAHÍA

Incluye trabajos en ejecución física.

Decisión que permite:

```text id="ipg3v4"
Ver qué está demorando, completar tareas o reportar bloqueo.
```

### DETENIDO / REQUIERE ACCIÓN

Incluye trabajos que no avanzan por un bloqueo categorizado.

Decisión que permite:

```text id="dwi7sz"
Saber a quién llamar o qué resolver.
```

### LISTO PARA QC / ENTREGA

Incluye trabajos terminados o casi terminados, separados por si falta control de calidad o entrega.

Decisión que permite:

```text id="cy67vp"
Completar QC o entregar al cliente.
```

---

# Layout corregido

```text id="6nysxm"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Bahías y Ejecución                       OPERATIVO       |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | BAHÍAS Y EJECUCIÓN                                     |
|   Órdenes de Taller  | Ubicación física, avance, bloqueos y entrega            |
|   Admisión y Diagn.  |       [Ver solo atrasados] [Vista por bahía] [Refresh]  |
| > Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           | Filtro: [Todos] [Solo atrasados] [Solo detenidos]       |
|   Servicios          | Técnico [Todos v] Bahía [Todas v]                       |
|   Mensajes           |---------------------------------------------------------|
|   Personal y Equipos | +-------------+ +-------------+ +-------------+ +------+ |
|   Ajustes            | | SIN BAHÍA   | | EN BAHÍA    | | DETENIDOS   | | QC/ENT| |
|                      | |     4       | |     5       | |     2       | |  3   | |
|----------------------| | 1 atrasado  | | 2 atrasados | | 2 críticos  | |1 espera|
| Admin Web            | +-------------+ +-------------+ +-------------+ +------+ |
| rol: owner           |                                                         |
| [Cerrar sesión]      | +----------------+ +----------------+ +--------------+ +--------------+ |
|                      | | POR ASIGNAR    | | TRABAJO       | | DETENIDO /   | | LISTO PARA  | |
|                      | | A BAHÍA        | | EN BAHÍA      | | REQUIERE     | | QC / ENTREGA| |
|                      | | 4 trabajos     | | 5 trabajos    | | ACCIÓN       | | 3 trabajos  | |
|                      | |----------------| |---------------| |--------------| |-------------| |
|                      | | ROJO           | | ROJO          | | ROJO         | | ÁMBAR       | |
|                      | | TUR-008        | | TUR-003       | | TUR-011      | | TUR-005     | |
|                      | | Bahía: sin asig| | Bahía 2       | | Bahía 1      | | Bahía 3     | |
|                      | | Carlos ABC-123 | | María XYZ-789 | | José KIA-456 | | QC pendiente| |
|                      | | Frenos         | | Suspensión    | | Motor        | | Listo hace  |
|                      | | Espera 1h20m   | | En bahía 2h40m| | Detenido 3h10| | 45m         | |
|                      | | Técnico: --    | | Técnico: Ana  | | Espera rep.  | | [Completar] | |
|                      | | [Asignar]      | | [Ver]         | | [Resolver]  | |             | |
|                      | |----------------| |---------------| |--------------| |-------------| |
|                      | | ÁMBAR          | | ÁMBAR         | | ÁMBAR        | | VERDE       | |
|                      | | TUR-014        | | TUR-010       | | TUR-020      | | TUR-009     | |
|                      | | Bahía: sin asig| | Bahía 3       | | Bahía 2      | | Bahía 1     | |
|                      | | Lucía FGH-222  | | Pedro DDD-111 | | Ana AAA-555  | | QC completo |
|                      | | Mant. prevent. | | Frenos        | | Espera cliente| | Listo entrega|
|                      | | Espera 35m     | | En bahía 1h15m| | Detenido 55m | | hace 10m    | |
|                      | | [Asignar]      | | [Ver]         | | [Resolver]  | | [Entregar]  | |
|                      | |----------------| |---------------| |--------------| |-------------| |
|                      | | VERDE          | | VERDE         | |              | | VERDE       | |
|                      | | TUR-018        | | TUR-016       | |              | | TUR-022     | |
|                      | | Bahía: sin asig| | Bahía 1       | |              | | Bahía 2     | |
|                      | | Diego PQR-900  | | Rosa MMM-888  | |              | | QC completo |
|                      | | Espera 10m     | | En bahía 25m  | |              | | Listo entrega|
|                      | | [Asignar]      | | [Ver]         | |              | | [Entregar]  | |
|                      | +----------------+ +----------------+ +--------------+ +--------------+ |
+----------------------+---------------------------------------------------------+
```

---

# KPIs superiores corregidos

## Antes

```text id="wjdyg6"
COLA
PROGRESO
BLOQUEOS
LISTOS
```

## Después

```text id="56h0gx"
SIN BAHÍA
EN BAHÍA
DETENIDOS
QC / ENTREGA
```

### Significado

```text id="jr0kyl"
SIN BAHÍA:
Trabajos aprobados que aún no tienen ubicación física.

EN BAHÍA:
Trabajos que están físicamente en ejecución.

DETENIDOS:
Trabajos que no avanzan y necesitan intervención.

QC / ENTREGA:
Trabajos terminados que requieren control final o entrega.
```

---

# Textos de botones corregidos

## Antes

```text id="v0ywjp"
[Ver atrasados]
[Vista bahías]
[Refresh]
```

## Después

```text id="lb8gz5"
[Ver solo atrasados]
[Vista por bahía]
[Actualizar tablero]
```

## Antes

```text id="mvmdt4"
[Ver]
[Resolver]
[Entregar]
```

## Después recomendado según columna

```text id="ldem4s"
Por asignar a bahía:
[Asignar bahía/técnico]

Trabajo en bahía:
[Ver tareas]

Detenido / requiere acción:
[Resolver bloqueo]

Listo para QC / entrega:
[Completar QC]
[Registrar entrega]
```

Regla:

```text id="a6y904"
El botón debe decir la acción exacta, no un verbo genérico si hay espacio.
```

---

# Textos de tarjeta corregidos

## Tarjeta por asignar

```text id="z6iqni"
ROJO
TUR-008
Bahía: sin asignar
Carlos · ABC-123
Trabajo: Frenos
Espera asignación: 1h20m
Técnico: sin asignar
[Asignar bahía/técnico]
```

## Tarjeta en bahía

```text id="8ui4i2"
ROJO
TUR-003
Bahía 2
María · XYZ-789
Trabajo: Suspensión
En bahía: 2h40m
Técnico: Ana
ETA vencido: 30m
[Ver tareas]
```

## Tarjeta detenida

```text id="c1i0a0"
ROJO
TUR-011
Bahía 1
José · KIA-456
Trabajo: Motor
Detenido: 3h10m
Bloqueo: Espera repuesto
Responsable: almacén
[Resolver bloqueo]
```

## Tarjeta lista

```text id="l6ub06"
ÁMBAR
TUR-005
Bahía 3
Cliente · Placa
QC pendiente
Listo hace: 45m
[Completar QC]
```

o:

```text id="mlugw3"
VERDE
TUR-009
Bahía 1
Cliente · Placa
QC completo
Listo para entrega: 10m
[Registrar entrega]
```

---

# Regla de ambigüedad cero

Quedan prohibidos como headers principales si no tienen contexto:

```text id="az3aya"
Cola
Progreso
Bloqueado
Listo
Actividad
Pendiente
Estado
Detalle
Ver
Acción
Motivo
```

Se permiten solo si van acompañados de contexto explícito.

Ejemplos válidos:

```text id="w6rxko"
Cola de admisión
Progreso de diagnóstico
Bloqueo: espera repuesto
Listo para entrega
Pendiente de confirmación
Estado de cotización
Ver tareas
Motivo de bloqueo categorizado
```

---

# Regla de 5 segundos actualizada

La pantalla está lista solo si en 5 segundos el jefe sabe:

```text id="p9e8q2"
1. Qué trabajos aún no tienen bahía.
2. Qué trabajos están físicamente en bahía.
3. Qué trabajos están detenidos.
4. Qué trabajos están en QC o entrega.
5. Qué bahía ocupa cada trabajo.
6. Qué lleva más tiempo.
7. Qué está atrasado.
8. Qué bloqueo requiere acción.
9. Qué botón exacto debe presionar.
```

---

# Regla sin scroll actualizada

```text id="f7u27e"
Máximo 3 tarjetas visibles por columna.
Más trabajos se manejan con:
- filtro;
- paginación por columna;
- compact mode;
- búsqueda;
- vista por bahía.
```

No se usa scroll global.

No se usa horizontal scroll.

No se usa panel fijo de detalle.

---

# Versión final recomendada de columnas

```text id="waxaad"
1. POR ASIGNAR A BAHÍA
2. TRABAJO EN BAHÍA
3. DETENIDO / REQUIERE ACCIÓN
4. LISTO PARA QC / ENTREGA
```

Esta versión reemplaza definitivamente:

```text id="sw57rj"
COLA
EN PROGRESO
BLOQUEADO
LISTO
```

---
# WF-10 v0.3 | Ajuste de tarjeta de cliente accionable

## Cambio incorporado

WF-10 v0.2 se mantiene, pero se corrige la tarjeta del listado de clientes.

La tarjeta ya no debe limitarse a:

```text id="v0rbfv"
Última visita
Vehículos
Casos abiertos
```

Ahora debe mostrar:

```text id="53qii8"
Estado de atención
Caso abierto principal
Mensaje pendiente
Saldo pendiente
Próximo mantenimiento sugerido
Tiempo sin contacto
Acciones rápidas
```

---

# Tarjeta de cliente corregida

```text id="pd2hct"
+------------------------------+
| ROJO                         |
| Carlos Ramírez               |
| +51 999 888 777              |
| ABC-123 · Toyota Yaris       |
| Caso abierto: Espera aprobación|
| Mensaje pendiente · hace 35m |
| Saldo: S/ 320 pendiente      |
| Próx. mant.: frenos · 30 días|
| Sin contacto: 24 días        |
| [WhatsApp] [Ver orden]       |
+------------------------------+
```

---

# Variante sin caso abierto

```text id="1zdiab"
+------------------------------+
| ÁMBAR                        |
| María Torres                 |
| +51 988 777 666              |
| XYZ-789 · Kia Rio            |
| Sin caso abierto             |
| Sin saldo pendiente          |
| Próx. mant.: aceite · 15 días|
| Sin contacto: 62 días        |
| [WhatsApp] [Crear orden]     |
+------------------------------+
```

---

# Variante sin urgencia

```text id="x3e7n1"
+------------------------------+
| VERDE                        |
| José Pérez                   |
| +51 977 555 333              |
| KIA-456 · Sportage           |
| Sin casos abiertos           |
| Sin mensajes pendientes      |
| Sin saldo pendiente          |
| Próx. mant.: no sugerido     |
| Sin contacto: 8 días         |
| [WhatsApp] [Llamar]          |
+------------------------------+
```

---

# Reglas de la tarjeta

## 1. Última visita no basta

No usar solo:

```text id="ld7l2o"
Última visita: 12 Jun
```

Debe acompañarse por al menos uno de estos datos accionables:

```text id="whzvco"
Próximo mantenimiento sugerido
Sin contacto hace X días
Caso abierto actual
Mensaje pendiente
Saldo pendiente
```

---

## 2. Próximo mantenimiento sugerido

Ejemplos:

```text id="h61w2a"
Próx. mant.: aceite · 15 días
Próx. mant.: frenos · 30 días
Próx. mant.: revisión general · 500 km
Próx. mant.: no sugerido
```

Este dato puede venir de:

```text id="837vgy"
- historial de servicios;
- kilometraje;
- fecha de última visita;
- tipo de servicio realizado;
- regla simple configurable;
- recomendación manual del taller.
```

---

## 3. Sin contacto hace X días

Ejemplos:

```text id="qpk0e5"
Sin contacto: 24 días
Sin contacto: 62 días
Último contacto: hoy
Último contacto: ayer
```

Esto ayuda a campañas de reactivación.

Reglas sugeridas:

```text id="kzsl21"
0-30 días: normal.
31-60 días: oportunidad de seguimiento.
61+ días: cliente frío / reactivación.
```

---

## 4. Acciones rápidas visibles

Cada tarjeta debe tener máximo dos acciones rápidas.

Acciones posibles:

```text id="ktzau7"
[WhatsApp]
[Llamar]
[Ver orden]
[Crear orden]
[Registrar pago]
```

Prioridad de acciones:

```text id="wg4fig"
Si hay mensaje pendiente:
[WhatsApp] [Ver orden]

Si hay saldo pendiente:
[WhatsApp] [Registrar pago]

Si hay caso abierto:
[WhatsApp] [Ver orden]

Si no hay caso abierto:
[WhatsApp] [Crear orden]

Si no hay teléfono/WhatsApp:
[Editar cliente] [Crear orden]
```

---

## 5. No saturar la tarjeta

Aunque la tarjeta tenga más inteligencia, no debe convertirse en ficha completa.

Máximo recomendado:

```text id="muhs7l"
1 línea de identidad
1 línea de contacto
1 línea de vehículo
1 línea de estado actual
1 línea de atención financiera/mensaje
1 línea de mantenimiento/contacto
1 línea de acciones
```

---

# Tarjeta compacta alternativa

Si el espacio queda muy justo:

```text id="c6kcto"
+------------------------------+
| ROJO · Carlos Ramírez        |
| ABC-123 · Toyota Yaris       |
| Espera aprobación · S/320    |
| Msg pend. 35m · Mant. 30d    |
| [WhatsApp] [Ver orden]       |
+------------------------------+
```

Esta versión sacrifica detalle, pero mantiene decisión.

---

# Regla de 5 segundos actualizada para WF-10

La tarjeta debe permitir responder sin abrir detalle:

```text id="3yvv4h"
1. ¿Este cliente requiere atención?
2. ¿Por qué requiere atención?
3. ¿Tiene caso abierto?
4. ¿Tiene mensaje pendiente?
5. ¿Tiene saldo pendiente?
6. ¿Tiene oportunidad de mantenimiento?
7. ¿Lo contacto por WhatsApp, llamada o abro orden?
```

Si la tarjeta solo dice “última visita”, falla.

Si la tarjeta obliga a entrar al detalle para contactar, falla.

---

# Conclusión

WF-10 queda actualizado a **WF-10 v0.3**.

Cambio principal:

```text id="pmw75o"
La tarjeta de cliente ahora es accionable, no solo informativa.
```

Debe mostrar:

```text id="isff8e"
Atención actual
Mensaje
Saldo
Mantenimiento sugerido
Tiempo sin contacto
Acción rápida
```

Esto convierte la cartera en una herramienta de seguimiento comercial y operativo, no solo una base de datos.

---

# WF-11 v0.2 | Admin - Catálogo de Servicios como jefe de taller

## Objetivo de la pantalla

La pantalla Catálogo de Servicios debe permitir ver y corregir rápidamente la oferta del taller.

Debe responder en menos de 5 segundos:

* cuántos servicios existen;
* cuántos están visibles al público;
* cuántos están ocultos;
* cuántos están incompletos;
* qué servicios no tienen precio;
* qué servicios no tienen duración;
* qué servicios requieren evaluación;
* qué servicios no tienen flujo operativo claro;
* qué servicio debo editar primero.

No debe tener scroll global.

No debe tener scroll interno en el grid/listado.

No debe usar textos ambiguos.

No debe mostrar todas las secciones del editor apiladas.

---

# Regla madre

```text id="5si59i"
El catálogo no es solo una lista de servicios.
Es el tablero de control de lo que el taller promete vender y puede operar.
```

---

# Decisión sobre WF-11 original

Se conserva:

```text id="6x96ag"
- Sidebar.
- Header.
- Búsqueda y filtros.
- Listado/grid de servicios.
- Editor de servicio.
- Tabs: Identidad, Visibilidad, Precio, Operación, IA/Chat.
```

Se elimina:

```text id="8kyl3a"
- Scroll interno en listado/grid.
- Tarjetas con campos inconsistentes.
- "Landing: ON" como texto plano.
- "Desde S/ --" sin alerta visual.
- Editor con varias secciones apiladas.
- Botón "Ordenar" ambiguo.
```

Se agrega:

```text id="83hbz5"
- Resumen superior de catálogo.
- Paginación o "ver más".
- Formato estándar para todas las tarjetas.
- Badge de publicación.
- Badge de incompleto.
- Señal automática si falta precio o duración.
- Estado activo/inactivo visible.
- Tabs reales en el editor: una tab activa a la vez.
- Botones semánticos claros.
```

---

# Layout validado sin scroll

```text id="f37y2f"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Servicios                                 OPERATIVO      |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | CATÁLOGO DE SERVICIOS                                  |
|   Órdenes de Taller  | Oferta publicada, precios, duración y reglas operativas|
|   Admisión y Diagn.  |       [Crear servicio] [Reordenar landing] [Actualizar]|
|   Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           | Buscar [servicio] Categoría [Todas v] Estado [Activos v]|
| > Servicios          | Filtro: [Todos] [Publicados] [Ocultos] [Incompletos]   |
|   Mensajes           | Equipo [Todos v]                                       |
|   Personal y Equipos |---------------------------------------------------------|
|   Ajustes            | +------------+ +------------+ +------------+ +---------+ |
|                      | | TOTAL      | | PUBLICADOS | | OCULTOS    | | INCOMP. | |
|----------------------| |    18      | |    12      | |     6      | |    4    | |
| Admin Web            | | catálogo  | | landing ON | | no público | | revisar | |
| rol: owner           | +------------+ +------------+ +------------+ +---------+ |
| [Cerrar sesión]      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | GRID DE SERVICIOS        | SERVICIO SELECCIONADO   | |
|                      | | 18 servicios · pág. 1/3  |                          | |
|                      | |                          | Revisión de frenos      | |
|                      | | +----------------------+ | Estado: Activo          | |
|                      | | | ÁMBAR · INCOMPLETO   | | Publicación: publicado  | |
|                      | | | Revisión de frenos   | | Próxima acción:         | |
|                      | | | Precio: falta definir| | Definir precio base     | |
|                      | | | Duración: 60 min     | | [Guardar cambios]       | |
|                      | | | Equipo: Mecánica     | | [Ver en landing]        | |
|                      | | | Publicado ●          | | [Desactivar servicio]   | |
|                      | | | Activo               | |--------------------------| |
|                      | | | [Editar] [Ver landing]| RESUMEN DEL SERVICIO    | |
|                      | | +----------------------+ |                          | |
|                      | |                          | Precio: falta definir   | |
|                      | | +----------------------+ | Duración: 60 min        | |
|                      | | | VERDE · COMPLETO    | | Equipo: Mecánica        | |
|                      | | | Cambio de aceite    | | Requiere evaluación: no |
|                      | | | Precio: desde S/ 120 | | Flujo operativo: listo  |
|                      | | | Duración: 45 min     | | IA/Chat: configurado    |
|                      | | | Equipo: Mecánica     | |                          | |
|                      | | | Publicado ●          | | [Identidad] [Visibilidad]|
|                      | | | Activo               | | [Precio] [Operación]   | |
|                      | | | [Editar] [Ver landing]| [IA/Chat]              | |
|                      | | +----------------------+ |--------------------------| |
|                      | |                          | TAB ACTIVO: PRECIO      | |
|                      | | +----------------------+ | Precio base             | |
|                      | | | ROJO · INCOMPLETO   | | [S/ --]                 | |
|                      | | | Diagnóstico general | | Mostrar como "Desde"   | |
|                      | | | Precio: falta definir| | [x] Sí                  | |
|                      | | | Duración: falta def. | |                          | |
|                      | | | Equipo: Frontdesk    | | Riesgo                  | |
|                      | | | Oculto ○             | | Servicio sin precio     | |
|                      | | | Activo               | | visible al público      | |
|                      | | | [Editar]             | |                          | |
|                      | | +----------------------+ | [Guardar precio]        | |
|                      | |                          |                          | |
|                      | | Página 1 de 3            |                          | |
|                      | | [<] [>]                  |                          | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Lectura en 5 segundos

El dueño debe poder entender inmediatamente:

```text id="semr3u"
Hay 18 servicios en catálogo.
12 están publicados.
6 están ocultos.
4 están incompletos.
Revisión de frenos está publicado pero no tiene precio.
Diagnóstico general está incompleto porque no tiene precio ni duración.
El servicio seleccionado necesita definir precio base.
```

Si debe abrir cada servicio para saber si falta precio, la pantalla falla.

Si las tarjetas no se pueden comparar, la pantalla falla.

Si hay scroll interno, la pantalla falla.

---

# Header

```text id="uxz5re"
CATÁLOGO DE SERVICIOS
Oferta publicada, precios, duración y reglas operativas
[Crear servicio] [Reordenar landing] [Actualizar]
```

## Botón: Crear servicio

Uso:

```text id="7xqgbl"
Crear un nuevo servicio comercial-operativo.
```

## Botón: Reordenar landing

Reemplaza al botón ambiguo:

```text id="oavuf6"
[Ordenar]
```

Porque “Ordenar” puede significar:

```text id="hbus4b"
- ordenar alfabéticamente;
- ordenar por precio;
- ordenar por categoría;
- reordenar manualmente en landing.
```

Si la intención es controlar el orden público, el texto correcto es:

```text id="475l5c"
[Reordenar landing]
```

Si se necesita ordenar el grid, debe ir como filtro:

```text id="z2wf10"
Ordenar por [Nombre / Categoría / Estado / Incompletos primero]
```

## Botón: Actualizar

Reemplaza:

```text id="qgrrh7"
[Refresh]
```

por una palabra clara en español.

---

# Filtros superiores

```text id="9agsaa"
Buscar [servicio]
Categoría [Todas v]
Estado [Activos v]
Filtro: [Todos] [Publicados] [Ocultos] [Incompletos]
Equipo [Todos v]
```

## Estados sugeridos

```text id="53wp5b"
Activos
Inactivos
Todos
```

## Filtros rápidos

```text id="7qgsbq"
Todos
Publicados
Ocultos
Incompletos
Sin precio
Sin duración
Requieren evaluación
```

Para no saturar, los principales visibles son:

```text id="nznfa0"
Todos
Publicados
Ocultos
Incompletos
```

Los demás pueden ir en filtro avanzado.

---

# Resumen superior

```text id="3r2c5s"
+------------+ +------------+ +------------+ +---------+
| TOTAL      | | PUBLICADOS | | OCULTOS    | | INCOMP. |
|    18      | |    12      | |     6      | |    4    |
| catálogo   | | landing ON | | no público | | revisar |
+------------+ +------------+ +------------+ +---------+
```

## Qué decide

```text id="reryy6"
Si debo revisar catálogo.
Si hay servicios ocultos.
Si hay servicios incompletos.
Si la landing está publicando servicios con riesgo.
```

## Card adicional opcional

Si hay espacio en monitor amplio:

```text id="qu9k3d"
SIN PRECIO
3 servicios
riesgo público
```

Pero en v1 basta con “INCOMP.” si el detalle aparece en tarjetas.

---

# Grid de servicios

## Regla sin scroll

```text id="4mz7ja"
No usar scroll interno.
Máximo 3 tarjetas visibles en la columna.
Usar paginación:
Página 1 de 3
[<] [>]
```

En pantallas grandes se pueden mostrar 4 o 6 tarjetas, pero sin depender de scroll.

---

# Tarjeta estándar de servicio

Todas las tarjetas deben tener los mismos campos.

```text id="m1491e"
+------------------------------+
| ÁMBAR · INCOMPLETO           |
| Revisión de frenos           |
| Precio: falta definir        |
| Duración: 60 min             |
| Equipo: Mecánica             |
| Publicado ●                  |
| Estado: Activo               |
| [Editar] [Ver landing]       |
+------------------------------+
```

## Campos obligatorios

```text id="dbm00q"
Indicador de completitud
Nombre del servicio
Precio
Duración
Equipo operativo
Publicación en landing
Estado activo/inactivo
Acciones rápidas
```

## Formato fijo

Aunque un campo esté vacío, debe aparecer:

```text id="to3azw"
Precio: falta definir
Duración: falta definir
Equipo: falta asignar
Publicado / Oculto
Activo / Inactivo
```

No permitir tarjetas con menos campos que otras.

---

# Estados visuales de tarjeta

## VERDE · COMPLETO

```text id="z3qg5r"
Servicio listo para vender y operar.
```

Requisitos mínimos:

```text id="kqcwea"
Nombre
Categoría
Precio o regla de precio
Duración
Equipo
Visibilidad definida
Flujo operativo definido
```

## ÁMBAR · INCOMPLETO

```text id="tpgt2u"
Servicio usable internamente, pero con dato comercial u operativo pendiente.
```

Ejemplos:

```text id="2ar5tu"
Sin precio, pero oculto.
Sin duración.
Requiere evaluación, pero falta regla de flujo.
Sin texto para IA/Chat.
```

## ROJO · RIESGO PÚBLICO

```text id="zf4cfz"
Servicio publicado al cliente con información crítica faltante.
```

Ejemplos:

```text id="dqlbak"
Publicado sin precio.
Publicado sin duración.
Publicado sin descripción clara.
Publicado sin flujo operativo.
```

---

# Precio faltante

El texto anterior:

```text id="q3azkw"
Desde S/ --
```

queda descartado como texto plano.

Debe mostrarse como:

```text id="prif8t"
Precio: falta definir
```

Y debe activar estado:

```text id="ukpv81"
ÁMBAR, si el servicio está oculto.
ROJO, si el servicio está publicado.
```

Ejemplo:

```text id="jqhms6"
ROJO · RIESGO PÚBLICO
Diagnóstico general
Precio: falta definir
Duración: falta definir
Equipo: Frontdesk
Publicado ●
Estado: Activo
[Editar] [Ocultar de landing]
```

---

# Publicación en landing

Reemplazar:

```text id="ix7zzq"
Landing: ON
Landing: OFF
```

por:

```text id="11v0rh"
Publicado ●
Oculto ○
```

## Regla

No depender solo del punto/color.

Debe incluir palabra:

```text id="6iqtak"
Publicado
Oculto
```

## Ejemplos

```text id="4o5pmv"
Publicado ●
Oculto ○
```

---

# Estado activo/inactivo

Debe diferenciarse de publicación.

```text id="51n7nu"
Activo:
Puede usarse internamente.

Inactivo:
No debe usarse en nuevas órdenes, aunque exista en historial.
```

## Tarjeta inactiva

```text id="ahx443"
+------------------------------+
| GRIS · INACTIVO              |
| Lavado premium               |
| Precio: S/ 80                |
| Duración: 45 min             |
| Equipo: Detailing            |
| Oculto ○                     |
| Estado: Inactivo             |
| [Reactivar] [Ver historial]  |
+------------------------------+
```

## Regla

Un servicio inactivo debe verse claramente:

```text id="dllnkg"
- etiqueta INACTIVO;
- menor énfasis visual;
- acciones diferentes: Reactivar / Ver historial.
```

No basta con que esté oculto.

---

# Servicios que requieren acción

Una tarjeta debe indicar acción requerida si falta:

```text id="tsxh7t"
Precio
Duración
Equipo operativo
Categoría
Descripción pública
Flujo de evaluación
Texto IA/Chat
Visibilidad definida
```

## Badge sugerido

```text id="1t3nb6"
INCOMPLETO
RIESGO PÚBLICO
SIN PRECIO
SIN DURACIÓN
SIN EQUIPO
FLUJO NO DEFINIDO
```

## Próxima acción en servicio seleccionado

En el panel derecho debe aparecer:

```text id="nvjtx2"
Próxima acción: Definir precio base
```

Ejemplos:

```text id="e793us"
Definir precio base
Definir duración
Asignar equipo
Ocultar de landing
Completar descripción pública
Definir flujo operativo
Configurar respuesta IA
```

---

# Servicio seleccionado

## Header

```text id="lm8f9p"
Revisión de frenos
Estado: Activo
Publicación: publicado
Próxima acción: Definir precio base

[Guardar cambios]
[Ver en landing]
[Ocultar de landing]
[Desactivar servicio]
```

## Resumen del servicio

Debe estar siempre visible antes de tabs.

```text id="ng6i0n"
+--------------------------+
| RESUMEN DEL SERVICIO     |
|                          |
| Precio: falta definir    |
| Duración: 60 min         |
| Equipo: Mecánica         |
| Requiere evaluación: sí  |
| Flujo operativo: listo   |
| IA/Chat: pendiente       |
+--------------------------+
```

## Por qué existe

Porque el usuario no debe entrar a cinco tabs para saber si el servicio está incompleto.

---

# Editor con tabs reales

## Tabs

```text id="6zz803"
[Identidad]
[Visibilidad]
[Precio]
[Operación]
[IA/Chat]
```

Regla:

```text id="ph5maa"
Solo una tab activa se muestra a la vez.
No se apilan las cinco secciones.
```

---

# TAB 1: Identidad

```text id="bg8nhh"
+-----------------------------------------------------+
| TAB ACTIVO: IDENTIDAD                               |
|-----------------------------------------------------|
| Nombre del servicio                                 |
| [Revisión de frenos]                                |
|                                                     |
| Categoría                                           |
| [Frenos v]                                          |
|                                                     |
| Descripción pública                                 |
| [textarea breve]                                    |
|                                                     |
| Descripción interna                                 |
| [textarea breve]                                    |
|                                                     |
| [Guardar identidad]                                 |
+-----------------------------------------------------+
```

---

# TAB 2: Visibilidad

```text id="ad0gps"
+-----------------------------------------------------+
| TAB ACTIVO: VISIBILIDAD                             |
|-----------------------------------------------------|
| Publicación en landing                              |
| [Publicado / Oculto]                                |
|                                                     |
| Destacado                                           |
| [Sí / No]                                           |
|                                                     |
| Orden en landing                                    |
| [ 1 ]                                               |
|                                                     |
| Preview                                             |
| Hero / card pública compacta                        |
|                                                     |
| [Guardar visibilidad] [Ver en landing]              |
+-----------------------------------------------------+
```

---

# TAB 3: Precio

```text id="ebgqdb"
+-----------------------------------------------------+
| TAB ACTIVO: PRECIO                                  |
|-----------------------------------------------------|
| Tipo de precio                                      |
| [Desde / Fijo / Requiere evaluación v]              |
|                                                     |
| Precio base                                         |
| [S/ --]                                             |
|                                                     |
| Mostrar precio al público                           |
| [Sí / No]                                           |
|                                                     |
| Mensaje si requiere evaluación                      |
| [Precio final depende de diagnóstico]               |
|                                                     |
| Riesgo actual                                       |
| Servicio publicado sin precio                       |
|                                                     |
| [Guardar precio] [Ocultar hasta completar]          |
+-----------------------------------------------------+
```

## Regla

Si está publicado y sin precio:

```text id="irx062"
Mostrar alerta roja.
Sugerir "Ocultar hasta completar".
```

---

# TAB 4: Operación

```text id="jktrnm"
+-----------------------------------------------------+
| TAB ACTIVO: OPERACIÓN                               |
|-----------------------------------------------------|
| Duración estimada                                   |
| [60 min]                                            |
|                                                     |
| Equipo responsable                                  |
| [Mecánica v]                                        |
|                                                     |
| Requiere evaluación previa                          |
| [Sí / No]                                           |
|                                                     |
| Flujo operativo                                     |
| [Consulta -> Diagnóstico -> Cotización v]           |
|                                                     |
| Requiere bahía                                      |
| [Sí / No]                                           |
|                                                     |
| [Guardar operación]                                 |
+-----------------------------------------------------+
```

---

# TAB 5: IA/Chat

```text id="mlluu3"
+-----------------------------------------------------+
| TAB ACTIVO: IA/CHAT                                 |
|-----------------------------------------------------|
| Visible para agente IA                              |
| [Sí / No]                                           |
|                                                     |
| Respuesta sugerida                                  |
| [textarea breve]                                    |
|                                                     |
| Preguntas frecuentes                                |
| [Agregar FAQ]                                       |
|                                                     |
| Restricciones                                       |
| [No prometer precio final sin diagnóstico]          |
|                                                     |
| [Guardar IA/Chat]                                   |
+-----------------------------------------------------+
```

---

# Paginación / Ver más

## Opción recomendada v1

```text id="4plizt"
Página 1 de 3
[<] [>]
```

## Opción alternativa

```text id="s3x7c3"
[Ver más servicios]
```

Pero paginación es más consistente con Clientes.

---

# Semántica corregida

## Headers válidos

```text id="t4fnj4"
GRID DE SERVICIOS
SERVICIO SELECCIONADO
RESUMEN DEL SERVICIO
TAB ACTIVO: PRECIO
PUBLICADOS
OCULTOS
INCOMPLETOS
```

## Headers a evitar

```text id="hd5150"
Listado / Grid Servicios
Editor de servicio, si no indica servicio seleccionado
Tabs, como texto suelto
Ordenar
Landing: ON
Desde S/ --
```

## Botones válidos

```text id="fce42i"
[Crear servicio]
[Reordenar landing]
[Actualizar]
[Editar]
[Ver en landing]
[Ocultar de landing]
[Desactivar servicio]
[Reactivar]
[Guardar precio]
[Ocultar hasta completar]
```

## Botones a evitar

```text id="uby9cy"
[Ordenar]
[Ver]
[Acción]
[Gestionar]
[Publicar], si el estado real puede ser Publicado/Oculto/Activo/Inactivo
```

---

# Qué NO debe estar en esta pantalla

Para cumplir la regla de no scroll y decisión rápida, no debe aparecer:

```text id="2de6h7"
- Editor completo con todas las secciones abiertas.
- Scroll interno del grid.
- Listado largo de servicios.
- Historial completo de cambios.
- Todas las FAQs del agente IA.
- Todas las reglas operativas avanzadas.
- Analítica profunda de ventas por servicio.
```

Eso puede vivir en:

```text id="9uejmw"
Modal
Drawer
Historial de servicio
Reporte futuro
Configuración avanzada
```

---

# Validación de 5 segundos

WF-11 v0.2 es válido si el jefe puede responder sin scroll:

```text id="wcpxfj"
1. ¿Cuántos servicios tengo?
2. ¿Cuántos están publicados?
3. ¿Cuántos están ocultos?
4. ¿Cuántos están incompletos?
5. ¿Qué servicio publicado tiene riesgo?
6. ¿A cuál le falta precio?
7. ¿A cuál le falta duración?
8. ¿Qué servicio está inactivo?
9. ¿Qué debo editar primero?
10. ¿El servicio seleccionado se puede vender y operar?
```

Si las tarjetas no son comparables, falla.

Si “Desde S/ --” pasa desapercibido, falla.

Si el editor necesita scroll para completar una sección, falla.

Si “Ordenar” no se entiende, falla.

---

# Conclusión

WF-11 original queda reemplazado por **WF-11 v0.2**.

La pantalla queda centrada en:

```text id="4pmbc0"
Oferta publicada
Completitud
Precio
Duración
Equipo operativo
Visibilidad en landing
Estado activo/inactivo
Riesgo público
Próxima acción
```

La regla principal queda:

```text id="ok6yc7"
Todo servicio visible al público debe estar suficientemente definido para no crear confusión comercial ni promesas operativas falsas.
```

El catálogo debe permitir decidir rápido:

```text id="oz11hn"
qué publicar,
qué ocultar,
qué corregir,
qué desactivar,
qué preparar para que el taller pueda vender sin improvisar.
```

---

# WF-12 v0.2 | Admin - Centro de Mensajes como jefe de taller

## Objetivo de la pantalla

La pantalla Centro de Mensajes debe permitir ver y resolver rápidamente comunicaciones pendientes, fallidas o relevantes para la operación.

Debe responder en menos de 5 segundos:

* cuántos mensajes requieren atención;
* cuántos fallaron;
* cuántos están pendientes;
* quién espera respuesta;
* qué mensaje falló y por qué;
* qué cliente/caso está asociado;
* qué acción debo tomar;
* qué comunicaciones son solo informativas.

No debe tener scroll global.

No debe tener scroll interno en la lista.

No debe usar una tercera columna fija si reduce la legibilidad.

No debe mostrar eventos informativos con el mismo peso que mensajes que requieren acción.

---

# Regla madre

```text id="hyxr38"
El Centro de Mensajes no es un historial de comunicaciones.
Es una bandeja de atención y fallos operativos.
```

---

# Decisión sobre WF-12 original

Se conserva:

```text id="lbubnx"
- Sidebar.
- Header.
- Filtros por canal, tipo y estado.
- Lista de mensajes/eventos.
- Panel de detalle.
- Acciones como reintentar, copiar, ver caso y marcar revisado.
```

Se elimina:

```text id="os2jrx"
- Scroll interno en lista de eventos.
- Tercera columna fija de contexto.
- Estados solo como texto plano.
- Tipos solo como texto plano.
- Botón "Fallidos" como única forma de ver errores.
- Formatos inconsistentes de tarjeta.
- Eventos informativos con el mismo peso visual que mensajes accionables.
```

Se agrega:

```text id="flgsp8"
- Resumen superior con contadores.
- Lista paginada o filtrada por defecto.
- Orden automático: requiere acción primero.
- Estado con color + texto.
- Tipo con ícono + texto.
- Badge "Requiere respuesta".
- Tiempo transcurrido.
- Contexto dentro del detalle.
- Contexto expandible si hace falta.
```

---

# Layout validado sin scroll

```text id="ytn51r"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Mensajes                                  OPERATIVO      |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | CENTRO DE MENSAJES                                     |
|   Órdenes de Taller  | Respuestas pendientes, envíos fallidos y comunicación  |
|   Admisión y Diagn.  |             [Crear plantilla] [Ver solo fallidos]      |
|   Bahías y Ejecución |                         [Actualizar mensajes]          |
|   Clientes           |---------------------------------------------------------|
|   Servicios          | Canal [Todos v] Tipo [Todos v] Estado [Todos v]        |
| > Mensajes           | Vista [Últimas 24h v] Cliente/Caso [buscar]            |
|   Personal y Equipos | Filtro: [Requiere acción] [Fallidos] [Pendientes]      |
|   Ajustes            |---------------------------------------------------------|
|----------------------| +------------+ +------------+ +------------+ +---------+ |
| Admin Web            | | REQUIEREN  | | FALLIDOS   | | PENDIENT.  | | ENVIADOS | |
| rol: owner           | | ACCIÓN     | |     3      | |     5      | | HOY 18   | |
| [Cerrar sesión]      | |     6      | | reintentar | | responder | | ok       | |
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | MENSAJES PRIORIZADOS    | MENSAJE SELECCIONADO    | |
|                      | | Últimas 24h · pág. 1/4  |                          | |
|                      | |                          | Cliente: Carlos Ramírez  | |
|                      | | +----------------------+ | Canal: WhatsApp          | |
|                      | | | ROJO · ⚠️ Error      | | Tipo: Error             | |
|                      | | | Estado: Fallido      | | Estado: Fallido         | |
|                      | | | Requiere acción      | | Hace: 3h 15m            | |
|                      | | | WhatsApp · Carlos    | |                          | |
|                      | | | Cotización no enviada| | Mensaje                  | |
|                      | | | Hace 3h15m           | | "La cotización está..." |
|                      | | | Caso: TUR-0012       | |                          | |
|                      | | | [Reintentar envío]   | | Error                    | |
|                      | | +----------------------+ | Timeout del proveedor    | |
|                      | |                          |                          | |
|                      | | +----------------------+ | CONTEXTO OPERATIVO       | |
|                      | | | ROJO · 💬 Interacción| | Caso: TUR-0012           | |
|                      | | | Estado: Pendiente    | | Estado: Espera decisión  | |
|                      | | | Requiere respuesta   | | Vehículo: ABC-123        | |
|                      | | | WebChat · María      | | Próxima acción:          | |
|                      | | | Pregunta por precio  | | Reintentar envío         | |
|                      | | | Hace 45m             | |                          | |
|                      | | | [Responder]          | | [Reintentar envío]       | |
|                      | | +----------------------+ | [Copiar mensaje]         | |
|                      | |                          | [Ver caso]               | |
|                      | | +----------------------+ | [Marcar revisado]        | |
|                      | | | ÁMBAR · 🔔 Alerta    | |                          | |
|                      | | | Estado: Pendiente    | | [Mostrar contexto amplio]|
|                      | | | Requiere revisión    | |                          | |
|                      | | | Sistema · Cotización | |                          | |
|                      | | | Vence hoy            | |                          | |
|                      | | | Hace 2h              | |                          | |
|                      | | | [Ver caso]           | |                          | |
|                      | | +----------------------+ |                          | |
|                      | |                          |                          | |
|                      | | Página 1 de 4            |                          | |
|                      | | [<] [>]                  |                          | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Lectura en 5 segundos

El jefe debe poder entender inmediatamente:

```text id="w7aazo"
Hay 6 mensajes que requieren acción.
Hay 3 fallidos.
Hay 5 pendientes.
El más urgente es un envío fallido de WhatsApp.
El mensaje está asociado al caso TUR-0012.
La acción correcta es reintentar envío.
María tiene una pregunta pendiente hace 45 minutos.
```

Si debe abrir filtros para ver fallidos, la pantalla falla.

Si debe leer cada línea para encontrar lo urgente, la pantalla falla.

---

# Header

```text id="yyrt0e"
CENTRO DE MENSAJES
Respuestas pendientes, envíos fallidos y comunicación
[Crear plantilla] [Ver solo fallidos] [Actualizar mensajes]
```

## Botón: Crear plantilla

Uso:

```text id="6lvyz4"
Crear o editar respuestas reutilizables.
```

## Botón: Ver solo fallidos

Uso:

```text id="w1k38m"
Aislar mensajes fallidos.
```

Regla:

```text id="y971h0"
Los fallidos ya deben aparecer arriba automáticamente.
Este botón no debe ser necesario para descubrirlos.
```

## Botón: Actualizar mensajes

Reemplaza:

```text id="tbdkcw"
Refresh
```

por texto claro.

---

# Filtros superiores

```text id="bpydix"
Canal [Todos v]
Tipo [Todos v]
Estado [Todos v]
Vista [Últimas 24h v]
Cliente/Caso [buscar]
Filtro: [Requiere acción] [Fallidos] [Pendientes]
```

## Vista por defecto

```text id="yf4rrf"
Últimas 24h
```

Alternativas:

```text id="q3l4x2"
Últimas 24h
Últimos 7 días
No leídos
Todos
```

## Orden por defecto

```text id="cm14dz"
1. Fallidos.
2. Pendientes que requieren respuesta.
3. Alertas pendientes.
4. No enviados.
5. Enviados/entregados/leídos recientes.
```

---

# Resumen superior

```text id="lbysgb"
+------------+ +------------+ +------------+ +---------+
| REQUIEREN  | | FALLIDOS   | | PENDIENT.  | | ENVIADOS|
| ACCIÓN     | |     3      | |     5      | | HOY 18  |
|     6      | | reintentar | | responder | | ok      |
+------------+ +------------+ +------------+ +---------+
```

## Qué decide

```text id="eebksw"
Si debo responder.
Si debo reintentar envíos.
Si hay comunicación rota.
Si todo está funcionando.
```

---

# Lista de mensajes priorizados

## Regla sin scroll

```text id="io515p"
No usar scroll interno.
Mostrar máximo 3 tarjetas visibles.
Usar paginación:
Página 1 de 4
[<] [>]
```

## Header recomendado

```text id="fmsd3q"
MENSAJES PRIORIZADOS
Últimas 24h · pág. 1/4
```

No usar:

```text id="73dwxf"
LISTA / EVENTOS
```

porque es ambiguo y suena a log técnico.

---

# Tarjeta estándar de mensaje

Todas las tarjetas deben tener el mismo formato.

```text id="b62ykk"
+------------------------------+
| ROJO · ⚠️ Error              |
| Estado: Fallido              |
| Requiere acción              |
| WhatsApp · Carlos Ramírez    |
| Cotización no enviada        |
| Hace 3h15m                   |
| Caso: TUR-0012               |
| [Reintentar envío]           |
+------------------------------+
```

## Campos obligatorios

```text id="jm0h1e"
Urgencia
Ícono + tipo
Estado
Requiere acción sí/no
Canal
Cliente o sistema
Resumen del mensaje/evento
Tiempo transcurrido
Caso asociado, si existe
Acción principal
```

---

# Estado con color + texto

## Estados

```text id="hbawqt"
Pendiente
Enviado
Entregado
Leído
Fallido
No enviado
```

## Colores recomendados

```text id="8oh3ua"
ROJO:
Fallido

ÁMBAR:
Pendiente que requiere acción
No enviado que requiere revisión

AZUL:
Enviado
Entregado
Leído

GRIS:
Pendiente informativo
No enviado no urgente
```

## Regla

No depender solo del color.

Siempre mostrar:

```text id="w536nh"
Estado: Fallido
Estado: Pendiente
Estado: Enviado
Estado: Entregado
Estado: Leído
Estado: No enviado
```

---

# Tipo con ícono + texto

## Tipos

```text id="ct3wlo"
💬 Interacción
🔔 Notificación
🚨 Alerta
📋 Plantilla
⚠️ Error
```

## Regla

No usar solo ícono.

Debe mostrarse:

```text id="uacfxe"
💬 Interacción
```

No solo:

```text id="jkr2hk"
💬
```

---

# Requiere acción vs informativo

Esta distinción es obligatoria.

## Badge recomendado

```text id="2zj9gl"
Requiere respuesta
Requiere reintento
Requiere revisión
Solo informativo
```

## Ejemplos

```text id="77aasx"
ROJO · ⚠️ Error
Estado: Fallido
Requiere reintento
[Reintentar envío]
```

```text id="idrafd"
ROJO · 💬 Interacción
Estado: Pendiente
Requiere respuesta
[Responder]
```

```text id="o8lfiw"
AZUL · 🔔 Notificación
Estado: Entregado
Solo informativo
[Ver caso]
```

---

# Tiempo transcurrido

Debe verse en la tarjeta.

Ejemplos:

```text id="glj293"
Hace 12m
Hace 45m
Hace 3h15m
Hace 2 días
```

## Por qué

Porque “Pendiente” no dice prioridad suficiente.

No es lo mismo:

```text id="i47c6m"
Pendiente hace 3 minutos
```

que:

```text id="g8n4w4"
Pendiente hace 2 días
```

---

# Panel de mensaje seleccionado

## Estructura

```text id="bcs4rj"
MENSAJE SELECCIONADO
Resumen de mensaje
Contenido
Error, si existe
Contexto operativo
Acciones
```

No usar tercera columna fija.

---

# Detalle de mensaje seleccionado

```text id="w13qvy"
+-----------------------------------------------------+
| MENSAJE SELECCIONADO                                |
|-----------------------------------------------------|
| Cliente: Carlos Ramírez                             |
| Canal: WhatsApp                                     |
| Tipo: ⚠️ Error                                      |
| Estado: Fallido                                     |
| Hace: 3h15m                                         |
|                                                     |
| Mensaje                                             |
| "La cotización está lista para su revisión..."      |
|                                                     |
| Error                                               |
| Timeout del proveedor                               |
|                                                     |
| CONTEXTO OPERATIVO                                  |
| Caso: TUR-0012                                      |
| Estado del caso: Espera decisión                    |
| Vehículo: ABC-123                                   |
| Próxima acción: Reintentar envío                    |
|                                                     |
| [Reintentar envío] [Copiar mensaje]                 |
| [Ver caso] [Marcar revisado]                        |
| [Mostrar contexto amplio]                           |
+-----------------------------------------------------+
```

---

# Contexto operativo

Debe estar dentro del detalle.

Campos sugeridos:

```text id="9b1bbe"
Cliente
Teléfono
Caso asociado
Estado del caso
Vehículo
Cotización relacionada
Próxima acción
Responsable interno
```

## Contexto amplio

Si se requiere más espacio:

```text id="3wf876"
[Mostrar contexto amplio]
```

abre drawer:

```text id="jbemj6"
+------------------------------------------------+
| Contexto operativo amplio                      |
+------------------------------------------------+
| Cliente                                        |
| Carlos Ramírez · +51 999 888 777               |
|                                                |
| Caso                                           |
| TUR-0012 · Espera decisión                     |
|                                                |
| Vehículo                                       |
| Toyota Yaris ABC-123                           |
|                                                |
| Cotización                                     |
| S/ 850 · enviada · vence hoy                   |
|                                                |
| Últimos mensajes                               |
| 10:30 cliente preguntó por precio              |
| 10:35 envío falló                              |
|                                                |
| [Ver cliente] [Ver caso] [Cerrar]              |
+------------------------------------------------+
```

---

# Modal rápido: responder mensaje

```text id="2dx6xj"
+------------------------------------------------+
| Responder mensaje                              |
+------------------------------------------------+
| Cliente: María Torres                          |
| Canal: WebChat                                 |
| Recibido hace: 45m                             |
|                                                |
| Mensaje recibido                               |
| "¿Cuánto cuesta el diagnóstico general?"       |
|                                                |
| Respuesta                                      |
| [textarea]                                     |
|                                                |
| [Usar plantilla] [Cancelar] [Enviar respuesta] |
+------------------------------------------------+
```

---

# Modal rápido: reintentar envío

```text id="tut0nr"
+------------------------------------------------+
| Reintentar envío                               |
+------------------------------------------------+
| Cliente: Carlos Ramírez                        |
| Canal: WhatsApp                                |
| Estado actual: Fallido                         |
| Error: Timeout del proveedor                   |
|                                                |
| Mensaje                                        |
| "La cotización está lista..."                  |
|                                                |
| [Cancelar] [Reintentar envío]                  |
+------------------------------------------------+
```

---

# Semántica corregida

## Headers válidos

```text id="9nxx20"
MENSAJES PRIORIZADOS
MENSAJE SELECCIONADO
CONTEXTO OPERATIVO
RESPUESTAS PENDIENTES
ENVÍOS FALLIDOS
COMUNICACIONES INFORMATIVAS
```

## Headers a evitar

```text id="sx2flu"
LISTA / EVENTOS
DETALLE
CONTEXTO, como tercera columna comprimida
Fallidos, como botón único de descubrimiento
Estado, sin decir estado de qué
```

## Botones válidos

```text id="ko6ycb"
[Crear plantilla]
[Ver solo fallidos]
[Actualizar mensajes]
[Responder]
[Reintentar envío]
[Copiar mensaje]
[Ver caso]
[Marcar revisado]
[Mostrar contexto amplio]
```

## Botones a evitar

```text id="askl5p"
[Ver]
[Acción]
[Gestionar]
[Refresh]
[Fallidos], si no aclara que filtra
```

---

# Qué NO debe estar en esta pantalla

Para mantener foco:

```text id="7isj87"
- Timeline completo de comunicaciones.
- Chat completo de larga conversación.
- Tercera columna fija comprimida.
- Eventos informativos mezclados con urgentes sin prioridad.
- Scroll interno.
- Lista completa sin filtros.
- Plantillas completas abiertas en el panel principal.
```

Eso vive en:

```text id="1wca9f"
Modal
Drawer
Centro de mensajes ampliado
Historial de caso
Cliente
Órdenes de Taller
```

---

# Validación de 5 segundos

WF-12 v0.2 es válido si el jefe puede responder sin scroll:

```text id="wc04up"
1. ¿Cuántos mensajes requieren acción?
2. ¿Cuántos envíos fallaron?
3. ¿Quién espera respuesta?
4. ¿Qué mensaje debo atender primero?
5. ¿Hace cuánto está pendiente?
6. ¿Qué caso está asociado?
7. ¿La acción es responder, reintentar o revisar?
8. ¿Qué comunicaciones son solo informativas?
```

Si los fallidos no saltan a la vista, falla.

Si los pendientes no muestran tiempo, falla.

Si el contexto está tan comprimido que no se puede leer, falla.

Si hay scroll interno en la lista, falla.

---

# Conclusión

WF-12 original queda reemplazado por **WF-12 v0.2**.

La pantalla queda centrada en:

```text id="jg5mp8"
Mensajes que requieren acción
Envíos fallidos
Pendientes de respuesta
Tiempo transcurrido
Cliente/caso asociado
Próxima acción
Contexto operativo legible
```

No queda centrada en logs.

No queda centrada en eventos informativos.

La regla principal queda:

```text id="tr7luv"
Lo que requiere acción debe aparecer arriba, con color, texto, tiempo y botón claro.
```
---

# WF-13 v0.2 | Admin - Personal y Equipos como jefe de taller

## Objetivo de la pantalla

La pantalla Personal y Equipos debe permitir decidir rápidamente:

* qué personal está disponible hoy;
* qué equipos están activos;
* qué capacidad está ocupada vs. libre;
* qué mecánico o equipo puede recibir trabajo;
* qué excepciones afectan la capacidad;
* si hay conflictos entre horarios y excepciones;
* qué debe corregirse antes de asignar trabajos.

No debe tener scroll global.

No debe tener scroll interno.

No debe mostrar tabs si en realidad se muestran varias secciones al mismo tiempo.

No debe usar textos ambiguos.

---

# Regla madre

```text id="yo4ej7"
Personal y Equipos no es una pantalla de configuración.
Es el tablero de capacidad humana y operativa del taller.
```

---

# Decisión sobre WF-13 original

Se conserva:

```text id="4mo2ny"
- Sidebar.
- Header.
- Botones Crear miembro y Crear equipo.
- Conceptos de Personal, Equipos, Horarios y Excepciones.
- Capacidad, horarios semanales y excepciones.
```

Se elimina o corrige:

```text id="plv8x8"
- Mostrar Equipos + Horarios + Excepciones al mismo tiempo.
- Usar tabs que no funcionan como tabs.
- Texto plano ACTIVO.
- Mostrar solo capacidad máxima sin ocupación real.
- Dropdown de equipo como única forma de comparar horarios.
- Formulario de excepción sin lista de excepciones existentes.
- Ausencia de personal individual.
- Scroll implícito por exceso de tarjetas.
```

Se agrega:

```text id="pqvj35"
- Vista default: Capacidad hoy.
- Resumen superior con contadores.
- Personal visible con disponibilidad real.
- Equipos visibles con capacidad ocupada/libre.
- Alertas de excepción activa.
- Tabs reales: una vista activa a la vez.
- Grilla comparativa semanal para horarios.
- Lista de excepciones activas/próximas.
- Paginación o límite de tarjetas visibles.
```

---

# Tabs definitivos

```text id="uot57o"
[Capacidad hoy]
[Personal]
[Equipos]
[Horarios]
[Excepciones]
```

## Por qué agregar “Capacidad hoy”

Porque es la vista que más ayuda al jefe de taller.

Los otros tabs son de administración/configuración.

```text id="qhppoh"
Capacidad hoy:
Decidir asignaciones ahora.

Personal:
Administrar personas individuales.

Equipos:
Administrar grupos operativos.

Horarios:
Comparar disponibilidad semanal.

Excepciones:
Ver y crear cambios temporales.
```

---

# Layout validado sin scroll — Tab Capacidad hoy

```text id="jzxtcq"
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Personal y Equipos                       OPERATIVO       |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | PERSONAL Y EQUIPOS                                    |
|   Órdenes de Taller  | Disponibilidad real, equipos, horarios y excepciones   |
|   Admisión y Diagn.  |                 [Crear miembro] [Crear equipo]         |
|   Bahías y Ejecución |                           [Actualizar capacidad]       |
|   Clientes           |---------------------------------------------------------|
|   Servicios          | [Capacidad hoy] [Personal] [Equipos] [Horarios]        |
|   Mensajes           | [Excepciones]                                           |
| > Personal y Equipos |---------------------------------------------------------|
|   Ajustes            | +------------+ +------------+ +------------+ +---------+ |
|                      | | PERSONAL   | | EQUIPOS    | | CAPACIDAD  | | EXCEPC. | |
|----------------------| | DISPONIBLE | | ACTIVOS    | | LIBRE HOY  | | VIGENT. | |
| Admin Web            | |   5 / 7    | |   3 / 4    | |   4 cupos  | |    2    | |
| rol: owner           | +------------+ +------------+ +------------+ +---------+ |
| [Cerrar sesión]      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | ALERTAS DE CAPACIDAD     | PERSONAL DISPONIBLE HOY |
|                      | |                          |                          |
|                      | | ÁMBAR                    | +----------------------+ |
|                      | | Mecánica: capacidad      | | VERDE · Luis          | |
|                      | | reducida hoy 2 -> 1      | | Mecánico frenos       | |
|                      | | por excepción            | | Disponible 14:00-16:00| |
|                      | | [Ver excepción]          | | Equipo: Mecánica      | |
|                      | |                          | | [Asignar trabajo]     | |
|                      | | ROJO                     | +----------------------+ |
|                      | | Ana no disponible hoy    |                          |
|                      | | 3 trabajos asignados     | +----------------------+ |
|                      | | [Reasignar trabajos]     | | ÁMBAR · Carlos        | |
|                      | |                          | | Mecánico general      | |
|                      | | VERDE                    | | Ocupado 70% hoy       | |
|                      | | Bahía/equipo Detailing   | | Hueco: 16:00-17:00    | |
|                      | | tiene 1 cupo libre       | | [Ver agenda]          | |
|                      | | [Asignar]                | +----------------------+ |
|                      | +--------------------------+--------------------------+ |
|                      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | CAPACIDAD POR EQUIPO     | EXCEPCIONES DE HOY      |
|                      | |                          |                          |
|                      | | Mecánica                 | Mecánica                |
|                      | | Activo ●                 | Capacidad reducida      |
|                      | | Ocupado: 1 / 2           | 10:00-13:00             |
|                      | | Libre: 1 cupo            | Capacidad: 1            |
|                      | | Próximo hueco: 14:00     | Motivo: capacitación    |
|                      | | [Ver equipo]             |                          |
|                      | |--------------------------| Frontdesk               |
|                      | | Frontdesk                | Cierre temprano         |
|                      | | Activo ●                 | 16:00-18:00 cerrado     |
|                      | | Ocupado: 1 / 1           | Motivo: trámite         |
|                      | | Libre: 0 cupos           |                          |
|                      | | Próximo hueco: mañana    | [Ver todas excepciones] |
|                      | | [Ver equipo]             |                          |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

---

# Lectura en 5 segundos

El jefe debe poder entender:

```text id="hxtjw7"
Hay 5 de 7 personas disponibles.
Hay 3 de 4 equipos activos.
Hay 4 cupos libres hoy.
Hay 2 excepciones vigentes.
Mecánica tiene capacidad reducida hoy.
Luis tiene hueco 14:00-16:00.
Frontdesk está lleno.
Ana no está disponible y hay que reasignar trabajos.
```

Si debe abrir horarios o cambiar dropdowns para saber eso, la pantalla falla.

---

# Header

```text id="ex9ekq"
PERSONAL Y EQUIPOS
Disponibilidad real, equipos, horarios y excepciones
[Crear miembro] [Crear equipo] [Actualizar capacidad]
```

## Botón: Crear miembro

Uso:

```text id="xmeaca"
Registrar persona operativa: mecánico, asesor, frontdesk, detailer.
```

## Botón: Crear equipo

Uso:

```text id="uykvlu"
Crear grupo operativo: Mecánica, Frontdesk, Detailing, Diagnóstico.
```

## Botón: Actualizar capacidad

Reemplaza:

```text id="433q06"
Refresh
```

por texto claro.

---

# Resumen superior

```text id="o2ejtf"
+------------+ +------------+ +------------+ +---------+
| PERSONAL   | | EQUIPOS    | | CAPACIDAD  | | EXCEPC. |
| DISPONIBLE | | ACTIVOS    | | LIBRE HOY  | | VIGENT. |
|   5 / 7    | |   3 / 4    | |   4 cupos  | |    2    |
+------------+ +------------+ +------------+ +---------+
```

## Qué decide

```text id="awzy59"
Si puedo tomar más trabajos.
Si falta personal.
Si hay equipos inactivos.
Si una excepción afecta el día.
```

---

# Tab Capacidad hoy

## Objetivo

Ver operación real del día.

Componentes:

```text id="p13si0"
Alertas de capacidad
Personal disponible hoy
Capacidad por equipo
Excepciones de hoy
```

## No debe incluir

```text id="jrh0sl"
Formularios largos.
Horario semanal completo.
Listado completo de todo el personal.
Todas las excepciones históricas.
```

---

# Alertas de capacidad

```text id="eqd30w"
+--------------------------+
| ALERTAS DE CAPACIDAD     |
|                          |
| ÁMBAR                    |
| Mecánica: capacidad      |
| reducida hoy 2 -> 1      |
| por excepción            |
| [Ver excepción]          |
|                          |
| ROJO                     |
| Ana no disponible hoy    |
| 3 trabajos asignados     |
| [Reasignar trabajos]     |
+--------------------------+
```

## Tipos de alerta

```text id="dwtlux"
Capacidad reducida
Persona no disponible con trabajos asignados
Equipo inactivo con citas futuras
Horario cerrado con cita agendada
Excepción duplicada
Sin responsable asignado
```

---

# Personal disponible hoy

```text id="0fi4e2"
+--------------------------+
| PERSONAL DISPONIBLE HOY  |
|                          |
| VERDE · Luis             |
| Mecánico frenos          |
| Disponible 14:00-16:00   |
| Equipo: Mecánica         |
| [Asignar trabajo]        |
|--------------------------|
| ÁMBAR · Carlos           |
| Mecánico general         |
| Ocupado 70% hoy          |
| Hueco: 16:00-17:00       |
| [Ver agenda]             |
|--------------------------|
| ROJO · Ana               |
| No disponible hoy        |
| Tiene 3 trabajos asignados|
| [Reasignar trabajos]     |
+--------------------------+
```

## Campos obligatorios por persona

```text id="khcs99"
Indicador de disponibilidad
Nombre
Rol/especialidad
Equipo
Disponibilidad hoy
Ocupación hoy
Conflicto, si existe
Acción principal
```

## Estados

```text id="5sheme"
VERDE:
Disponible con hueco útil.

ÁMBAR:
Parcialmente disponible o casi lleno.

ROJO:
No disponible, sobrecargado o con conflicto.

GRIS:
Inactivo.
```

---

# Capacidad por equipo

```text id="7kfxdo"
+--------------------------+
| CAPACIDAD POR EQUIPO     |
|                          |
| Mecánica                 |
| Activo ●                 |
| Ocupado: 1 / 2           |
| Libre: 1 cupo            |
| Próximo hueco: 14:00     |
| [Ver equipo]             |
|--------------------------|
| Frontdesk                |
| Activo ●                 |
| Ocupado: 1 / 1           |
| Libre: 0 cupos           |
| Próximo hueco: mañana    |
| [Ver equipo]             |
+--------------------------+
```

## Capacidad correcta

No basta con:

```text id="wumkwr"
Capacidad: 2
```

Debe mostrarse:

```text id="t8i1gp"
Ocupado: 1 / 2
Libre: 1 cupo
Próximo hueco: 14:00
```

---

# Excepciones de hoy

```text id="e6g4hm"
+--------------------------+
| EXCEPCIONES DE HOY       |
|                          |
| Mecánica                 |
| Capacidad reducida       |
| 10:00-13:00              |
| Capacidad: 1             |
| Motivo: capacitación     |
|                          |
| Frontdesk                |
| Cierre temprano          |
| 16:00-18:00 cerrado      |
| Motivo: trámite          |
|                          |
| [Ver todas excepciones]  |
+--------------------------+
```

## Regla

Si una excepción afecta la capacidad de hoy, debe aparecer en:

```text id="g7gvmm"
Resumen superior
Alertas de capacidad
Equipo afectado
Lista de excepciones de hoy
```

No puede quedar aislada en un formulario.

---

# Tab Personal

## Objetivo

Administrar personas individuales.

```text id="mug0fm"
+----------------------+---------------------------------------------------------+
|                      | [Capacidad hoy] [Personal] [Equipos] [Horarios]        |
|                      | [Excepciones]                                           |
|                      |---------------------------------------------------------|
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      | | TOTAL      | | DISP. HOY  | | OCUPADOS   | | INACT.  | |
|                      | |    7       | |    5       | |    2       | |   1     | |
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | PERSONAL OPERATIVO       | MIEMBRO SELECCIONADO     | |
|                      | | 7 personas · pág. 1/2    |                          | |
|                      | |                          | Luis Mendoza             | |
|                      | | +----------------------+ | Estado: Activo ●         | |
|                      | | | VERDE · Luis        | | Rol: Mecánico frenos    | |
|                      | | | Mecánico frenos     | | Equipo: Mecánica        | |
|                      | | | Activo ●            | | Disponibilidad hoy:     | |
|                      | | | Ocupación: 50%      | | 14:00-16:00             | |
|                      | | | Hueco: 14:00        | | Ocupación: 50%          | |
|                      | | | [Ver agenda]        | |                          | |
|                      | | +----------------------+ | [Editar miembro]         | |
|                      | |                          | [Ver agenda]             | |
|                      | | +----------------------+ | [Desactivar miembro]     | |
|                      | | | ÁMBAR · Carlos      | |                          | |
|                      | | | Mecánico general    | |                          | |
|                      | | | Activo ●            | |                          | |
|                      | | | Ocupación: 80%      | |                          | |
|                      | | +----------------------+ |                          | |
|                      | |                          |                          | |
|                      | | Página 1 de 2            |                          | |
|                      | | [<] [>]                  |                          | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

## Regla

Sin scroll interno.

Máximo visible:

```text id="v4gwte"
3 tarjetas de personas.
Paginación.
```

---

# Tab Equipos

## Objetivo

Administrar grupos operativos.

```text id="3dlcpv"
+----------------------+---------------------------------------------------------+
|                      | [Capacidad hoy] [Personal] [Equipos] [Horarios]        |
|                      | [Excepciones]                                           |
|                      |---------------------------------------------------------|
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      | | TOTAL EQ.  | | ACTIVOS    | | CON CUPO   | | INACT.  | |
|                      | |    4       | |    3       | |    2       | |   1     | |
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | EQUIPOS OPERATIVOS       | EQUIPO SELECCIONADO      | |
|                      | | 4 equipos · pág. 1/2     |                          | |
|                      | |                          | Mecánica                 | |
|                      | | +----------------------+ | Estado: Activo ●         | |
|                      | | | ÁMBAR · Mecánica    | | Capacidad base: 2       | |
|                      | | | Activo ●            | | Ocupado hoy: 1 / 2      | |
|                      | | | Ocupado: 1 / 2      | | Libre hoy: 1 cupo       | |
|                      | | | Libre: 1 cupo       | | Slot mínimo: 15 min     | |
|                      | | | Excepción hoy       | | Servicios: frenos, diag.|
|                      | | | [Ver equipo]        | |                          | |
|                      | | +----------------------+ | [Editar equipo]          | |
|                      | |                          | [Ver horarios]           | |
|                      | | +----------------------+ | [Crear excepción]        | |
|                      | | | ROJO · Frontdesk    | |                          | |
|                      | | | Activo ●            | | Alerta: sin cupo hoy    | |
|                      | | | Ocupado: 1 / 1      | |                          | |
|                      | | | Libre: 0            | |                          | |
|                      | | +----------------------+ |                          | |
|                      | |                          |                          | |
|                      | | Página 1 de 2            |                          | |
|                      | | [<] [>]                  |                          | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

## Badge activo/inactivo

No usar texto plano:

```text id="kyri6p"
ACTIVO
```

Usar:

```text id="v7h00r"
Activo ●
Inactivo ○
```

Con texto + color.

---

# Tab Horarios

## Objetivo

Comparar horarios de todos los equipos sin cambiar dropdown repetidamente.

```text id="taax3e"
+----------------------+---------------------------------------------------------+
|                      | [Capacidad hoy] [Personal] [Equipos] [Horarios]        |
|                      | [Excepciones]                                           |
|                      |---------------------------------------------------------|
|                      | HORARIOS SEMANALES COMPARATIVOS                        |
|                      | Semana: [Actual v]                       [Editar semana]|
|                      |---------------------------------------------------------|
|                      | +------------+-------+-------+-------+-------+--------+ |
|                      | | Equipo     | Lun   | Mar   | Mié   | Jue   | Vie    | |
|                      | +------------+-------+-------+-------+-------+--------+ |
|                      | | Frontdesk  | 8-18  | 8-18  | 8-18  | 8-18  | 8-16 ⚠ | |
|                      | | Mecánica   | 8-18  | 8-18  | 8-18⚠ | 8-18  | 8-18   | |
|                      | | Detailing  | 9-17  | 9-17  | 9-17  | Cerr. | 9-17   | |
|                      | +------------+-------+-------+-------+-------+--------+ |
|                      |                                                         |
|                      | Leyenda: ⚠ excepción activa / capacidad reducida        |
|                      |                                                         |
|                      | Equipo seleccionado: Mecánica                           |
|                      | Detalle: Miércoles 10:00-13:00 capacidad reducida a 1   |
|                      | [Editar horario] [Crear excepción]                      |
+----------------------+---------------------------------------------------------+
```

## Regla

No usar solo:

```text id="a3w2lf"
Equipo [Mecánica v]
```

porque obliga a revisar equipo por equipo.

La vista debe ser comparativa.

---

# Tab Excepciones

## Objetivo

Ver excepciones existentes y crear nuevas sin duplicar ni olvidar.

```text id="2t61pf"
+----------------------+---------------------------------------------------------+
|                      | [Capacidad hoy] [Personal] [Equipos] [Horarios]        |
|                      | [Excepciones]                                           |
|                      |---------------------------------------------------------|
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      | | VIGENTES   | | PRÓXIMAS   | | CONFLICTO  | | CERR.   | |
|                      | |    2       | |    4       | |    1       | |   1     | |
|                      | +------------+ +------------+ +------------+ +---------+ |
|                      |                                                         |
|                      | +--------------------------+--------------------------+ |
|                      | | EXCEPCIONES ACTIVAS      | CREAR / EDITAR EXCEPCIÓN |
|                      | |                          |                          |
|                      | | ÁMBAR · Mecánica         | Equipo                   |
|                      | | Hoy 10:00-13:00          | [Mecánica v]             |
|                      | | Capacidad reducida a 1   |                          |
|                      | | Motivo: capacitación     | Fecha                    |
|                      | | [Editar] [Cancelar]      | [2026-07-06]             |
|                      | |--------------------------|                          |
|                      | | ROJO · Frontdesk         | Tipo de excepción        |
|                      | | Vie 16:00-18:00 cerrado  | [Capacidad reducida v]   |
|                      | | Conflicto: cita agendada |                          |
|                      | | [Resolver conflicto]     | Ventana                  |
|                      | |                          | [10:00-13:00]            |
|                      | | Próximas: página 1 de 2  |                          |
|                      | | [<] [>]                  | Nueva capacidad          |
|                      | |                          | [1]                      |
|                      | |                          |                          |
|                      | |                          | Motivo                   |
|                      | |                          | [Capacitación]           |
|                      | |                          |                          |
|                      | |                          | [Guardar excepción]      |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

## Tipos de excepción

```text id="t5oox1"
Cerrado total
Capacidad reducida
Horario extendido
Reemplazo de horario
Persona no disponible
Equipo inactivo temporal
Feriado
Mantenimiento interno
```

## Conflictos

Mostrar alerta si una excepción afecta citas o trabajos ya asignados.

Ejemplos:

```text id="9xp3hu"
Conflicto: 2 citas agendadas en horario cerrado
Conflicto: Luis no disponible con 3 trabajos asignados
Conflicto: Mecánica reducida a 1 con 2 trabajos simultáneos
```

Acciones:

```text id="bxzi3r"
[Resolver conflicto]
[Reasignar trabajos]
[Notificar clientes]
```

---

# Semántica corregida

## Headers válidos

```text id="ptqg16"
CAPACIDAD HOY
PERSONAL DISPONIBLE HOY
CAPACIDAD POR EQUIPO
EXCEPCIONES DE HOY
PERSONAL OPERATIVO
EQUIPOS OPERATIVOS
HORARIOS SEMANALES COMPARATIVOS
EXCEPCIONES ACTIVAS
CREAR / EDITAR EXCEPCIÓN
```

## Headers a evitar

```text id="csp7f6"
EQUIPOS, si la pantalla incluye más cosas
HORARIOS SEMANALES, si solo muestra un dropdown
EXCEPCIONES, si solo muestra formulario
ACTIVO como texto plano
Detalle
Estado, sin contexto
```

## Botones válidos

```text id="dr4wlp"
[Crear miembro]
[Crear equipo]
[Actualizar capacidad]
[Asignar trabajo]
[Ver agenda]
[Reasignar trabajos]
[Ver excepción]
[Ver equipo]
[Editar miembro]
[Editar equipo]
[Crear excepción]
[Resolver conflicto]
[Guardar excepción]
```

## Botones a evitar

```text id="ft47ji"
[Editar], si puede decir Editar miembro/equipo/horario
[Ver]
[Refresh]
[Acción]
```

---

# Reglas de no scroll

```text id="z22jlj"
- Máximo 3 tarjetas visibles por lista.
- Usar paginación.
- No mostrar más de una tab a la vez.
- No apilar Personal + Equipos + Horarios + Excepciones.
- La grilla semanal debe caber en ancho disponible.
- Si no cabe sábado/domingo, usar selector de semana laboral / fin de semana.
```

Para horarios:

```text id="857mrc"
Vista principal: Lun-Vie.
Botón o toggle: [Ver fin de semana].
```

---

# Qué NO debe estar fijo en esta pantalla

```text id="qfs8fn"
- Todos los horarios detallados de todos los equipos.
- Todo el historial de excepciones.
- Formularios largos de personal.
- Listado completo de usuarios.
- Listado completo de equipos.
- Reglas avanzadas de permisos.
```

Eso vive en:

```text id="2hshzy"
Modal
Drawer
Paginación
Editor dedicado
Configuración avanzada
```

---

# Validación de 5 segundos

WF-13 v0.2 es válido si el jefe puede responder sin scroll:

```text id="f8snqc"
1. ¿Cuántas personas están disponibles hoy?
2. ¿Qué equipo tiene cupo libre?
3. ¿Qué equipo está lleno?
4. ¿Qué persona puedo asignar?
5. ¿Qué excepción afecta la capacidad hoy?
6. ¿Hay conflicto entre horario, excepción y citas?
7. ¿Debo reasignar trabajos?
8. ¿Puedo aceptar otro trabajo hoy?
```

Si debe cambiar un dropdown equipo por equipo, falla.

Si no ve personas individuales, falla.

Si solo ve capacidad máxima pero no ocupación real, falla.

Si las excepciones creadas no aparecen en lista, falla.

---

# Conclusión

WF-13 original queda reemplazado por **WF-13 v0.2**.

La pantalla queda centrada en:

```text id="hpc0h8"
Disponibilidad real
Personal operativo
Capacidad ocupada/libre
Equipos activos/inactivos
Horarios comparativos
Excepciones vigentes
Conflictos operativos
Asignación rápida
```

La regla principal queda:

```text id="ou7fb7"
No basta saber cuánta capacidad existe; hay que saber cuánta capacidad queda disponible ahora.
```

La vista default debe ser:

```text id="e3bp9r"
Capacidad hoy
```

porque es la única que responde inmediatamente si el taller puede aceptar o reasignar trabajo.

---

# WF-14 | Admin - Ajustes Generales

```text
+----------------------+---------------------------------------------------------+
| TURAGUA RACING       | Ajustes                                  OPERATIVO       |
|----------------------|---------------------------------------------------------|
|   Resumen Operativo  | AJUSTES GENERALES                                     |
|   Órdenes de Taller  | Identidad, marca, landing, canales, agenda y reglas    |
|   Admisión y Diagn.  |                                        [Guardar cambios]|
|   Bahías y Ejecución |---------------------------------------------------------|
|   Clientes           |                                                         |
|   Servicios          | +--------------------------+--------------------------+ |
|   Mensajes           | | SECCIONES                | PANEL DE CONFIGURACIÓN   | |
|   Personal y Equipos | |                          |                          | |
| > Ajustes            | | > Identidad              | MARCA VISUAL             | |
|                      | |   Marca visual           | Configura color, logo y  | |
|----------------------| |   Landing                | preview del negocio.     | |
| Admin Web            | |   Canales                |                          | |
| rol: owner           | |   Agenda                 | Color primario           | |
| [Cerrar sesión]      | |   Usuarios y permisos    | [ #00AEEF             ]  | |
|                      | |   Reglas operativas      |                          | |
|                      | |   Sistema                | Color secundario         | |
|                      | |                          | [ #111827             ]  | |
|                      | |                          |                          | |
|                      | |                          | Logo                     | |
|                      | |                          | [Subir archivo]          | |
|                      | |                          |                          | |
|                      | |                          | +----------------------+ | |
|                      | |                          | | Preview landing      | | |
|                      | |                          | | Header + CTA         | | |
|                      | |                          | +----------------------+ | |
|                      | |                          |                          | |
|                      | |                          | +----------------------+ | |
|                      | |                          | | Preview admin dark   | | |
|                      | |                          | | Sidebar + card       | | |
|                      | |                          | +----------------------+ | |
|                      | |                          |                          | |
|                      | |                          | [Guardar marca]          | |
|                      | |                          | [Restaurar colores]      | |
|                      | +--------------------------+--------------------------+ |
+----------------------+---------------------------------------------------------+
```

Secciones:

```text
1. Identidad del negocio
2. Marca visual
3. Landing
4. Canales
5. Agenda
6. Usuarios y permisos
7. Reglas operativas
8. Sistema
```

---

# WF-15 | demo_test Pack 0 Console

```text
+--------------------------------------------------------------------------------+
| DEMO TEST PACK 0 CONSOLE                                                       |
| Consola manual para validar /api/demo-test sin duplicar reglas backend          |
|                                                         [Reset] [Copiar JSON]  |
+--------------------------------------------------------------------------------+
|                                                                                |
| Stepper                                                                        |
|                                                                                |
| [1 Customer] -> [2 ManagedEntity] -> [3 Case] -> [4 Availability] ->            |
| [5 Schedule] -> [6 Timeline]                                                    |
|                                                                                |
+-----------------------------------------------------+--------------------------+
| STEP ACTIVO                                         | ESTADO DEL FLUJO         |
|                                                     |                          |
| STEP 3: CREATE OPERATIONAL CASE                     | businessSlug: demo_test  |
|                                                     | customerId: cus_...      |
| businessSlug                                        | managedEntityId: me_...  |
| [demo_test readonly]                                | caseId: pendiente        |
|                                                     | selectedSlot: none       |
| verticalType                                        | appointmentId: none      |
| [vehicle_service readonly]                          | reservationId: none      |
|                                                     |                          |
| customerId                                          | [Copiar estado]          |
| [cus_123 readonly]                                  | [Reset flow]             |
|                                                     |                          |
| managedEntityId                                     |--------------------------|
| [me_456 readonly]                                   | RAW RESPONSE / ERROR     |
|                                                     |                          |
| source.channel                                      | {                        |
| [manual_console readonly]                           |   "ok": true,            |
|                                                     |   "data": ...            |
| source.agent                                        | }                        |
| [manual readonly]                                   |                          |
|                                                     | BackendErrorPanel        |
| source.origin                                       | code                     |
| [demo_test_frontend readonly]                       | message                  |
|                                                     | details                  |
| intent.type                                         | [Copiar error]           |
| [assessment_request readonly]                       |                          |
|                                                     |                          |
| intent.summary                                      |                          |
| [Cliente solicita evaluación]                       |                          |
|                                                     |                          |
| intent.customerText                                 |                          |
| +-------------------------------------------------+ |                          |
| | Texto del cliente / solicitud                   | |                          |
| +-------------------------------------------------+ |                          |
|                                                     |                          |
| selectedOfferingId opcional                        |                          |
| [off_basic_consultation]                            |                          |
|                                                     |                          |
| [Crear Case] [Limpiar step]                         |                          |
+-----------------------------------------------------+--------------------------+
```

Reglas:

```text
- Frontend no calcula disponibilidad.
- Frontend no crea ResourceReservation directo.
- Frontend no llama Mongo.
- Frontend no llama Temporal.
- Frontend muestra errores semánticos.
- Frontend muestra raw response.
```

---

# WF-16 | demo_test Console - detalle de steps

```text
+--------------------------------------------------------------------------------+
| DEMO_TEST - DETALLE DE STEPS                                                    |
+--------------------------------------------------------------------------------+

STEP 1 - CUSTOMER
+--------------------------------------------------------------------------------+
| Campos                                                                         |
|                                                                                |
| businessSlug                                                                   |
| [demo_test readonly]                                                            |
|                                                                                |
| name                                                                           |
| [Nombre del cliente]                                                            |
|                                                                                |
| phone                                                                          |
| [+51 999 999 999]                                                               |
|                                                                                |
| email opcional                                                                 |
| [cliente@email.com]                                                             |
|                                                                                |
| [Crear o reutilizar Customer]                                                   |
+--------------------------------------------------------------------------------+
| Respuesta esperada                                                              |
| - customerId                                                                    |
| - reused true/false                                                             |
| - raw response                                                                  |
+--------------------------------------------------------------------------------+

STEP 2 - MANAGED ENTITY
+--------------------------------------------------------------------------------+
| Campos                                                                         |
|                                                                                |
| businessSlug                                                                   |
| [demo_test readonly]                                                            |
|                                                                                |
| customerId                                                                     |
| [cus_123 readonly]                                                              |
|                                                                                |
| type                                                                           |
| [vehicle readonly]                                                              |
|                                                                                |
| displayName                                                                    |
| [Toyota Yaris ABC-123]                                                          |
|                                                                                |
| summary                                                                        |
| [Toyota Yaris 2020 placa ABC-123]                                               |
|                                                                                |
| data                                                                           |
| Marca       [Toyota]                                                            |
| Modelo      [Yaris]                                                             |
| Año         [2020]                                                              |
| Placa       [ABC-123]                                                           |
| Color       [Blanco]                                                            |
| Kilometraje [85000]                                                             |
|                                                                                |
| [Crear ManagedEntity]                                                           |
+--------------------------------------------------------------------------------+
| Respuesta esperada                                                              |
| - managedEntityId                                                               |
| - raw response                                                                  |
+--------------------------------------------------------------------------------+

STEP 3 - CASE
+--------------------------------------------------------------------------------+
| Campos                                                                         |
|                                                                                |
| businessSlug              [demo_test readonly]                                  |
| verticalType              [vehicle_service readonly]                            |
| customerId                [cus_123 readonly]                                    |
| managedEntityId           [me_456 readonly]                                     |
| source.channel            [manual_console readonly]                             |
| source.agent              [manual readonly]                                     |
| source.origin             [demo_test_frontend readonly]                         |
| intent.type               [assessment_request readonly]                         |
| intent.summary            [Cliente solicita evaluación]                         |
| intent.customerText        [textarea]                                           |
| selectedOfferingId opc.    [off_basic_consultation]                             |
|                                                                                |
| [Crear Case]                                                                   |
+--------------------------------------------------------------------------------+
| Respuesta esperada                                                              |
| - caseId                                                                        |
| - caseNumber                                                                    |
| - status                                                                        |
| - raw response                                                                  |
+--------------------------------------------------------------------------------+

STEP 4 - AVAILABILITY
+--------------------------------------------------------------------------------+
| Campos                                                                         |
|                                                                                |
| businessSlug        [demo_test readonly]                                        |
| teamId              [team_frontdesk]                                            |
| catalogOfferingId   [off_basic_consultation]                                    |
| date                [YYYY-MM-DD]                                                |
| durationMinutes     [60]                                                        |
| timezone            [America/Lima]                                              |
|                                                                                |
| [Buscar disponibilidad]                                                         |
+--------------------------------------------------------------------------------+
| Resultado                                                                       |
|                                                                                |
| +------------------------------------------------------------------------------+ |
| | Slot                  | Capacidad | Acción                                   | |
| | 2026-07-08 09:00      | 1         | [Seleccionar]                           | |
| | 2026-07-08 10:00      | 1         | [Seleccionar]                           | |
| | 2026-07-08 11:00      | 0         | No disponible                           | |
| +------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------+
| Errores posibles                                                                |
| - NO_AVAILABILITY                                                               |
| - WORK_TEAM_NOT_FOUND                                                           |
| - INTERNAL_ERROR                                                                |
+--------------------------------------------------------------------------------+

STEP 5 - SCHEDULE CONSULTATION
+--------------------------------------------------------------------------------+
| Campos readonly                                                                 |
|                                                                                |
| caseId              [case_789]                                                  |
| customerId          [cus_123]                                                   |
| managedEntityId     [me_456]                                                    |
| startAt             [slot seleccionado]                                         |
| durationMinutes     [60]                                                        |
| timezone            [America/Lima]                                              |
|                                                                                |
| Campos editables                                                                |
|                                                                                |
| teamId              [team_frontdesk]                                            |
| catalogOfferingId   [off_basic_consultation]                                    |
| appointmentType     [consultation]                                              |
|                                                                                |
| [Schedule Consultation]                                                         |
+--------------------------------------------------------------------------------+
| Respuesta esperada                                                              |
| - appointmentId                                                                 |
| - resourceReservationId                                                         |
| - reservation.status = booked                                                   |
| - raw response                                                                  |
+--------------------------------------------------------------------------------+
| Errores críticos                                                                |
| - NO_AVAILABILITY                                                               |
| - DOUBLE_BOOKING_CONFLICT                                                       |
| - RESERVATION_FAILED                                                            |
| - APPOINTMENT_CREATION_FAILED                                                   |
+--------------------------------------------------------------------------------+

STEP 6 - TIMELINE
+--------------------------------------------------------------------------------+
| Campos                                                                         |
|                                                                                |
| caseId        [case_789 readonly]                                               |
| businessSlug  [demo_test readonly]                                              |
|                                                                                |
| [Cargar timeline] [Refrescar]                                                   |
+--------------------------------------------------------------------------------+
| Timeline newest-first                                                           |
|                                                                                |
| +------------------------------------------------------------------------------+ |
| | createdAt          | eventType                      | actor                  | |
| | 10:30              | appointment.scheduled           | backend                | |
| | 10:29              | resource_reservation.booked      | backend                | |
| | 10:28              | resource_reservation.held        | backend                | |
| | 10:20              | case.created                     | manual_console         | |
| +------------------------------------------------------------------------------+ |
|                                                                                |
| Cada evento puede expandirse para ver metadata.                                 |
+--------------------------------------------------------------------------------+
```

---

# WF-17 | Mapa de ejecución hacia implementación

```text
+--------------------------------------------------------------------------------+
| MAPA DE EJECUCIÓN                                                               |
+--------------------------------------------------------------------------------+
|                                                                                |
| FASE 1 - Sistema visual                                                         |
|                                                                                |
| [ ] PageHeader                                                                  |
| [ ] Card                                                                        |
| [ ] Button                                                                      |
| [ ] Input                                                                       |
| [ ] Textarea                                                                    |
| [ ] Badge / EstadoBadge                                                         |
| [ ] EmptyState                                                                  |
| [ ] BackendErrorPanel                                                           |
| [ ] RawResponsePanel                                                            |
| [ ] Admin shell responsive                                                      |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                                                |
| FASE 2 - Admin core                                                             |
|                                                                                |
| [ ] Resumen Operativo                                                           |
| [ ] Órdenes de Taller                                                           |
| [ ] Admisión y Diagnóstico                                                      |
| [ ] Bahías y Ejecución                                                          |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                                                |
| FASE 3 - Pantallas soporte                                                      |
|                                                                                |
| [ ] Cartera de Clientes                                                         |
| [ ] Catálogo de Servicios                                                       |
| [ ] Centro de Mensajes                                                          |
| [ ] Personal y Equipos                                                          |
| [ ] Ajustes Generales                                                           |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                                                |
| FASE 4 - Landing                                                                |
|                                                                                |
| [ ] Landing pública desktop                                                     |
| [ ] Landing pública tablet/mobile                                               |
| [ ] Constructor Landing                                                         |
| [ ] Validaciones de publicación                                                 |
| [ ] Preview responsive                                                          |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                                                |
| FASE 5 - demo_test                                                              |
|                                                                                |
| [ ] Console shell                                                               |
| [ ] Customer step                                                               |
| [ ] ManagedEntity step                                                          |
| [ ] Case step                                                                   |
| [ ] Availability step                                                           |
| [ ] Schedule Consultation step                                                  |
| [ ] Timeline step                                                               |
| [ ] Error states + raw response                                                 |
|                                                                                |
+--------------------------------------------------------------------------------+
|                                                                                |
| NO NEGOCIABLE                                                                   |
|                                                                                |
| [x] No horizontal scroll                                                        |
| [x] No textos ilegibles                                                         |
| [x] No espacios vacíos sin intención                                            |
| [x] No acciones ambiguas                                                        |
| [x] No mezclar admisión, diagnóstico, cotización y ejecución                    |
| [x] No romper landing                                                           |
| [x] No romper constructor existente                                             |
| [x] No copiar admin completo hacia demo_test                                    |
| [x] No duplicar reglas backend                                                  |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

# WF-18 | Resumen de pantallas y responsabilidades

```text
+--------------------------------------------------------------------------------+
| PANTALLA                         | RESPONSABILIDAD                              |
+--------------------------------------------------------------------------------+
| Landing pública                  | Vender / informar / convertir                |
| Constructor Landing              | Configurar landing sin código                |
| Admin Shell                      | Navegación y estructura operacional          |
| Resumen Operativo                | Observar estado del negocio                  |
| Órdenes de Taller                | Decidir y gestionar el caso completo         |
| Admisión y Diagnóstico           | Recibir, evaluar y emitir diagnóstico        |
| Bahías y Ejecución               | Ejecutar trabajos y manejar bloqueos         |
| Cartera de Clientes              | Ver cliente, vehículos e historial           |
| Catálogo de Servicios            | Definir oferta comercial-operativa           |
| Centro de Mensajes               | Ver interacciones, notificaciones y errores  |
| Personal y Equipos               | Gestionar capacidad, horarios y equipos      |
| Ajustes Generales                | Gobernar configuración del negocio           |
| demo_test Console                | Validar contrato backend /api/demo-test      |
+--------------------------------------------------------------------------------+
```

Con esto ya puedes editar estructura, nombres, secciones o disposición sin rehacer el PDF.
