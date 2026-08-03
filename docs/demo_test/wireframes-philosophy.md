# VtkALL Frontend Surgery Design Specification v0.1

## 0. Propósito del documento

Este documento define cómo debe quedar el nuevo diseño funcional del frontend de VtkALL Demo Pack 1 / Turagua Admin y cómo debe servir como base ordenada para construir posteriormente los wireframes.

No es todavía un wireframe visual.

Es una especificación detallada de:

* estructura de pantallas;
* jerarquía visual;
* contenido de cada sección;
* botones;
* formularios;
* estados;
* comportamiento responsive;
* reglas de interacción;
* semántica operacional;
* límites entre admin actual y futura consola `demo_test`.

El objetivo no es “rediseñar por rediseñar”. El objetivo es ejecutar una cirugía avanzada sobre un frontend que ya funciona parcialmente, conservando lo valioso y corrigiendo lo que impide que escale como sistema operativo vertical.

---

# 1. Principios generales obligatorios

## 1.1. Principio madre

Cada pantalla debe permitir que el usuario entienda en menos de cinco segundos:

1. dónde está;
2. qué está ocurriendo;
3. qué requiere atención;
4. qué puede hacer ahora;
5. qué consecuencia tendrá su acción.

Si una pantalla no cumple esos cinco puntos, la pantalla no está lista.

---

## 1.2. Reglas de legibilidad

El sistema debe evitar texto diminuto, jerarquías confusas y grises con bajo contraste.

Reglas mínimas:

* Texto operativo principal: 14–16 px.
* Texto secundario: mínimo 12–13 px.
* Labels de formulario: 12–13 px, siempre legibles.
* Títulos de cards: 15–18 px.
* Títulos de pantalla: 22–28 px.
* KPIs: grandes, pero con unidad y descripción.
* No abusar de mayúsculas sostenidas.
* No usar gris oscuro sobre fondo oscuro para información importante.
* Los estados críticos deben tener contraste alto.
* Los botones principales deben ser identificables sin esfuerzo.

---

## 1.3. Reglas de scroll

El scroll no debe ser la forma principal de entender la operación.

Reglas:

* Evitar scroll horizontal siempre.
* Evitar scroll vertical global innecesario.
* Usar paneles internos con scroll cuando el contenido sea extenso.
* Mantener cabeceras, filtros y acciones importantes visibles.
* En pantallas operativas, el usuario no debe perder contexto al desplazarse.
* Formularios largos deben dividirse en secciones o pasos.

---

## 1.4. Responsive objetivo

El frontend debe verse muy bien desde tablet hasta monitores de 20–22 pulgadas.

### Tablet: 768–1024 px

* Sidebar colapsable o navegación superior compacta.
* Cards en una o dos columnas.
* Panel de detalle debajo del listado o como vista enfocada.
* Botones principales visibles.
* Formularios en una columna.
* Nada de tablas anchas sin adaptación.

### Laptop: 1280–1440 px

* Sidebar fija.
* Vista operativa en dos columnas cuando aplique.
* KPIs compactos.
* Paneles de detalle visibles.
* Filtros superiores persistentes.

### Monitor 20–22": 1600–1920 px

* Más densidad útil.
* No estirar textos innecesariamente.
* Grids de 3–4 columnas.
* Paneles más anchos.
* Uso de espacio para observabilidad, no para decoración vacía.

---

## 1.5. Semántica operacional

Cada pantalla debe hablar en lenguaje de negocio.

Ejemplos:

* “Actividad reciente” debe evolucionar a “Últimos cambios operativos”.
* “Presupuesto interno” debe aclarar si fue preparado, enviado, aprobado o no enviado.
* “Pendientes” debe especificar pendiente de qué:

  * pendiente de confirmación;
  * pendiente de diagnóstico;
  * pendiente de aprobación;
  * pendiente de ejecución;
  * pendiente de entrega.

La semántica debe reducir ambigüedad.

---

## 1.6. Acciones visibles según estado

No todas las acciones deben aparecer siempre.

Ejemplo:

Una orden en estado `intake` puede mostrar:

* iniciar diagnóstico;
* editar datos de admisión;
* cancelar.

Una orden en estado `expert_review` puede mostrar:

* guardar diagnóstico;
* solicitar información;
* preparar cotización.

Una orden en estado `waiting_customer` puede mostrar:

* marcar aprobado;
* marcar rechazado;
* copiar cotización;
* registrar evidencia de aprobación.

Una orden en estado `in_progress` puede mostrar:

* actualizar avance;
* completar tarea;
* reportar bloqueo;
* marcar listo para entrega.

---

# 2. Layout global del Admin

## 2.1. Estructura general

El admin debe mantener la estructura de aplicación operacional:

```text
Sidebar izquierda
Header superior
Área principal
Paneles internos por pantalla
```

### Sidebar

Debe contener navegación clara:

1. Resumen Operativo
2. Órdenes de Taller
3. Admisión y Diagnóstico
4. Bahías y Ejecución
5. Cartera de Clientes
6. Catálogo de Servicios
7. Centro de Mensajes
8. Personal y Equipos
9. Ajustes Generales

### Header superior

Debe mostrar:

* título de la pantalla actual;
* estado del sistema;
* versión del sistema;
* acción primaria contextual, si aplica;
* botón de refrescar, si aplica.

Ejemplo:

```text
Órdenes de Taller     OPERATIVO     VERTIKALL OS v1.0.0     [Refrescar]
```

### Área principal

Debe evitar páginas infinitas.

Debe usar:

* secciones agrupadas;
* cards;
* paneles de detalle;
* tabs internos solo cuando sean necesarios;
* filtros compactos;
* estados vacíos útiles.

---

## 2.2. Sidebar detallada

### Composición

Arriba:

* logo / nombre del taller;
* icono de vertical;
* indicador visual de entorno.

Centro:

* navegación.

Abajo:

* usuario conectado;
* rol;
* botón cerrar sesión.

### Estados

Cada item debe tener:

* estado normal;
* hover;
* active;
* disabled si una sección no está disponible;
* badge opcional si hay alertas.

Ejemplo:

```text
Órdenes de Taller       8
Centro de Mensajes      3
```

### Regla

La sidebar no debe contener texto excesivo ni subtítulos largos.

---

## 2.3. Header de pantalla

Cada pantalla debe tener un `PageHeader` consistente.

Contenido obligatorio:

* título;
* descripción corta;
* acción primaria;
* acción secundaria, si aplica;
* estado de carga si la pantalla está actualizando.

Ejemplo:

```text
Título: Órdenes de Taller
Descripción: Gestión de intake, diagnóstico, cotización y ejecución por vehículo.
Acciones:
[Crear orden]
[Refrescar]
```

---

# 3. Pantalla: Resumen Operativo

## 3.1. Objetivo

El Resumen Operativo debe responder:

* qué ocurre hoy;
* qué está atrasado;
* qué requiere decisión humana;
* qué está generando dinero;
* qué puede fallar pronto;
* cómo avanza el embudo operativo.

No debe ser solo una colección de KPIs.

---

## 3.2. Layout recomendado

```text
Header
↓
Fila 1: KPIs críticos
↓
Fila 2: Alertas operativas + Agenda compacta
↓
Fila 3: Embudo operativo + Carga por equipo
↓
Fila 4: Últimos cambios operativos
```

En pantallas grandes:

```text
[KPIs en 4 o 5 columnas]
[Alertas 40%] [Agenda 60%]
[Embudo 50%] [Equipos 50%]
[Últimos cambios 100%]
```

En tablet:

```text
KPIs en 2 columnas
Alertas
Agenda
Embudo
Equipos
Últimos cambios
```

---

## 3.3. Sección: KPIs superiores

### Cards mínimas

1. Citas de hoy
2. Diagnósticos pendientes
3. Cotizaciones pendientes
4. Trabajos activos
5. Listos para entrega
6. Ingresos estimados

### Cada KPI debe mostrar

* número principal;
* unidad;
* descripción;
* tendencia o alerta;
* mini estado visual.

Ejemplo:

```text
Citas de hoy
8
3 próximas / 1 sin confirmar
```

### Botones

Los KPIs no deben tener botones grandes, pero pueden ser clicables para filtrar.

Acción esperada:

* click en “Diagnósticos pendientes” abre Admisión y Diagnóstico filtrado.
* click en “Cotizaciones pendientes” abre Órdenes de Taller filtrado.
* click en “Trabajos activos” abre Bahías y Ejecución.

---

## 3.4. Sección: Alertas operativas

### Objetivo

Mostrar lo que requiere atención.

### Alertas posibles

* Cita próxima sin confirmación.
* Orden sin diagnóstico después de cierto tiempo.
* Cotización pendiente de aprobación.
* Trabajo vencido.
* Vehículo listo sin entregar.
* Caso sin responsable asignado.
* Error de mensaje o notificación.
* Conflicto de agenda o disponibilidad.

### Layout

Card vertical con lista priorizada.

Cada alerta debe mostrar:

* severidad;
* título;
* descripción breve;
* entidad relacionada;
* hora o antigüedad;
* acción rápida.

Ejemplo:

```text
ALTA
Cotización por expirar
Carlos Ramírez · Toyota Yaris ABC-123
Vence hoy 6:00 p.m.
[Ver orden]
```

### Botones

* Ver orden
* Marcar revisado
* Refrescar alertas

---

## 3.5. Sección: Agenda compacta

### Objetivo

Mostrar citas/consultas próximas del día.

### Datos por item

* hora;
* cliente;
* vehículo;
* tipo de cita;
* estado;
* equipo asignado;
* confirmación.

Ejemplo:

```text
10:30
Carlos Ramírez
Toyota Yaris ABC-123
Evaluación presencial · Confirmada
Equipo: Frontdesk
[Ver]
```

### Acciones

* Ver orden
* Confirmar asistencia
* Reprogramar
* Marcar no-show

Las acciones secundarias pueden estar en menú de tres puntos.

---

## 3.6. Sección: Embudo operativo

### Objetivo

Visualizar volumen por etapa.

Etapas:

```text
Intake
Cita agendada
Diagnóstico
Cotización
Aprobación cliente
Ejecución
Entrega
Cerrado
```

### Visual

Puede ser barra horizontal segmentada o cards pequeñas.

Cada etapa muestra:

* cantidad;
* porcentaje;
* color de estado;
* click para filtrar.

### Regla

No usar gráficos complejos si una barra simple comunica mejor.

---

## 3.7. Sección: Carga por equipo

### Objetivo

Mostrar ocupación operativa.

Equipos posibles:

* Frontdesk
* Mecánica
* Lavado / detailing
* Administración
* Otros

Cada equipo debe mostrar:

* capacidad;
* ocupación actual;
* próximos slots;
* trabajos en curso;
* bloqueos.

Ejemplo:

```text
Mecánica
2/3 ocupados
Próximo libre: 15:30
1 trabajo atrasado
```

### Acciones

* Ver agenda del equipo
* Ver trabajos activos

---

## 3.8. Sección: Últimos cambios operativos

### Objetivo

Mostrar timeline global reciente, no solo citas.

Eventos:

* caso creado;
* cita agendada;
* diagnóstico guardado;
* cotización preparada;
* cotización aprobada;
* orden en ejecución;
* trabajo completado;
* mensaje fallido.

Cada fila:

* timestamp;
* tipo de evento;
* entidad;
* actor;
* estado;
* acción “ver”.

---

# 4. Pantalla: Órdenes de Taller

## 4.1. Objetivo

Ser la consola principal del caso operativo.

Debe permitir gestionar:

```text
Cliente
Vehículo
Solicitud
Diagnóstico
Cotización
Decisión
Ejecución
Historial
```

---

## 4.2. Layout recomendado

```text
Header
↓
Filtros compactos
↓
Split view:
  izquierda: listado de órdenes
  derecha: detalle de orden seleccionada
```

En desktop:

```text
[Lista 35%] [Detalle 65%]
```

En monitor grande:

```text
[Lista 30%] [Detalle 70%]
```

En tablet:

```text
Listado
↓
Detalle seleccionado
```

---

## 4.3. Header

Título:

```text
Órdenes de Taller
```

Descripción:

```text
Gestión de intake, diagnóstico, cotización y ejecución por vehículo.
```

Botones:

* Crear orden
* Refrescar
* Exportar, opcional futuro

---

## 4.4. Filtros

Campos:

* Estado
* Buscar
* Fecha desde
* Fecha hasta
* Equipo
* Responsable
* Solo con alerta

### Estado

Opciones:

* Todos
* Recibido
* Cita agendada
* En diagnóstico
* Esperando aprobación
* Aprobado
* En ejecución
* Listo para entrega
* Completado
* Cancelado

### Buscar

Debe buscar por:

* cliente;
* teléfono;
* placa;
* marca;
* modelo;
* síntoma;
* número de caso.

Botones:

* Filtrar
* Limpiar
* Guardar vista, futuro opcional

---

## 4.5. Listado de órdenes

Cada item debe mostrar:

* nombre cliente;
* teléfono;
* placa;
* vehículo;
* resumen corto;
* estado;
* monto estimado/final;
* antigüedad;
* alerta si existe.

Ejemplo:

```text
Carlos Ramírez
+51 999 888 777
Toyota Yaris · ABC-123
Ruido al frenar
Estado: En diagnóstico
Creado hace 2h
```

### Estados visuales

* borde izquierdo por estado;
* badge legible;
* alerta superior si está vencido;
* selected state claramente visible.

### Acciones por item

Normalmente no mostrar acciones en listado salvo:

* click para seleccionar;
* menú secundario opcional.

---

## 4.6. Panel de detalle

El panel derecho debe tener header fijo.

### Header del detalle

Debe mostrar:

* número de orden;
* estado actual;
* cliente;
* vehículo;
* acción primaria según estado;
* menú de acciones secundarias.

Ejemplo:

```text
Orden TUR-2026-0001
Carlos Ramírez · Toyota Yaris ABC-123
Estado: En diagnóstico

[Guardar diagnóstico]
[Más acciones]
```

---

## 4.7. Secciones del detalle

El detalle debe estar dividido en tabs o acordeones internos.

Secciones recomendadas:

1. Resumen
2. Admisión
3. Diagnóstico
4. Cotización
5. Decisión
6. Ejecución
7. Historial

En desktop pueden verse como tabs horizontales.

En tablet pueden verse como acordeones.

---

## 4.8. Tab: Resumen

Debe mostrar snapshot del caso.

Campos:

* ID / número de orden;
* estado;
* origen;
* cliente;
* teléfono;
* email;
* vehículo;
* placa;
* marca;
* modelo;
* año;
* kilometraje;
* servicio solicitado;
* síntoma;
* fecha de cita;
* equipo asignado;
* responsable;
* precio estimado;
* precio final.

### Botones

* Editar datos básicos
* Ver cliente
* Ver historial del vehículo

---

## 4.9. Tab: Admisión

Objetivo:

Registrar o revisar la recepción inicial.

Campos:

### Cliente

* nombre;
* teléfono;
* email;
* DNI opcional.

### Vehículo

* placa;
* marca;
* modelo;
* año;
* kilometraje;
* color;
* observaciones externas.

### Solicitud

* servicio solicitado;
* síntoma / problema;
* fecha deseada;
* canal de origen;
* evidencia.

### Checklist de admisión

* kilometraje verificado;
* nivel de combustible;
* accesorios presentes;
* daños visibles;
* fotos de admisión;
* autorización de revisión.

Botones:

* Guardar admisión
* Adjuntar evidencia
* Iniciar diagnóstico
* Cancelar orden

Regla:

No mezclar admisión con diagnóstico técnico.

---

## 4.10. Tab: Diagnóstico

Objetivo:

Registrar hallazgos técnicos.

Campos:

* notas del técnico;
* área afectada;
* severidad;
* causa probable;
* recomendaciones;
* evidencia;
* servicios sugeridos;
* requiere repuesto;
* requiere cotización;
* observaciones internas.

### Formulario de hallazgos

Cada hallazgo:

* área;
* descripción;
* severidad: baja, media, alta, crítica;
* evidencia;
* acción recomendada.

Botones:

* Agregar hallazgo
* Guardar borrador
* Emitir diagnóstico
* Preparar cotización

Regla:

Emitir diagnóstico debe cambiar el estado del caso.

No debe enviar cotización automáticamente.

---

## 4.11. Tab: Cotización

Objetivo:

Preparar una cotización interna o lista para cliente.

Debe diferenciar:

* borrador;
* preparada;
* enviada;
* aprobada;
* rechazada;
* vencida.

### Sección superior

* estado de cotización;
* monto total;
* validez;
* última actualización.

### Formulario

Campos:

* resumen para cliente;
* términos;
* validez;
* moneda;
* subtotal;
* descuento;
* total;
* fecha estimada de entrega.

### Líneas de cotización

Cada línea:

* tipo: servicio, repuesto, mano de obra, otro;
* descripción;
* cantidad;
* precio unitario;
* total;
* visible al cliente;
* notas internas.

Botones:

* Agregar línea
* Guardar cotización
* Copiar resumen
* Marcar enviada
* Registrar aprobación
* Registrar rechazo

Regla:

El sistema debe aclarar si la cotización fue enviada o solo preparada.

---

## 4.12. Tab: Decisión

Objetivo:

Registrar aceptación o rechazo del cliente.

Campos:

* decisión: aceptado / rechazado / pendiente;
* decidido por: cliente / staff en nombre del cliente;
* canal: WhatsApp, llamada, presencial, email, web;
* evidencia;
* nota;
* fecha de decisión.

Botones:

* Registrar aprobación
* Registrar rechazo
* Adjuntar evidencia
* Crear orden de trabajo, si aplica

Regla:

Si staff aprueba en nombre del cliente, debe registrarse evidencia o nota.

---

## 4.13. Tab: Ejecución

Objetivo:

Mostrar o gestionar la Work Order.

Campos:

* estado de ejecución;
* equipo asignado;
* responsable;
* fecha inicio;
* fecha estimada fin;
* tareas;
* bloqueos;
* evidencia de ejecución.

### Tareas

Cada tarea:

* título;
* descripción;
* estado;
* responsable;
* duración estimada;
* inicio;
* fin;
* evidencia.

Botones:

* Crear orden de trabajo
* Iniciar ejecución
* Agregar tarea
* Completar tarea
* Reportar bloqueo
* Marcar listo para entrega
* Marcar entregado

Regla:

No debe existir ejecución sin aprobación o autorización clara.

---

## 4.14. Tab: Historial

Objetivo:

Mostrar timeline del caso y del vehículo.

Eventos:

* caso creado;
* cliente registrado;
* vehículo registrado;
* cita agendada;
* admisión guardada;
* diagnóstico emitido;
* cotización preparada;
* cotización aprobada;
* ejecución iniciada;
* tarea completada;
* entrega.

Cada evento:

* fecha;
* tipo;
* título;
* descripción;
* actor;
* visibilidad;
* metadata.

Botones:

* Refrescar historial
* Filtrar eventos
* Copiar ID del evento, opcional técnico

---

# 5. Pantalla: Admisión y Diagnóstico

## 5.1. Objetivo

Ser una estación de trabajo para el equipo técnico/frontdesk.

No debe duplicar completamente Órdenes de Taller.

Debe enfocarse en órdenes que están en:

* intake;
* cita agendada;
* admisión pendiente;
* diagnóstico pendiente;
* diagnóstico en curso.

---

## 5.2. Layout

```text
Header
↓
Cola de atención
↓
Panel de admisión/diagnóstico
```

Desktop:

```text
[Cola izquierda 35%] [Estación de trabajo 65%]
```

---

## 5.3. Header

Título:

```text
Admisión y Diagnóstico
```

Descripción:

```text
Recepción de vehículos, registro de evidencia y emisión de diagnóstico técnico.
```

Botones:

* Nueva admisión
* Refrescar
* Ver agenda de hoy

---

## 5.4. Cola de atención

Filtros:

* Hoy
* Sin admisión
* En diagnóstico
* Pendientes de foto
* Urgentes

Cada item:

* hora;
* cliente;
* vehículo;
* servicio solicitado;
* estado;
* responsable;
* alerta.

Acciones:

* Seleccionar
* Iniciar admisión
* Iniciar diagnóstico

---

## 5.5. Panel: Admisión

Secciones:

1. Cliente
2. Vehículo
3. Solicitud
4. Checklist
5. Evidencia

### Botones

* Guardar admisión
* Guardar y pasar a diagnóstico
* Cancelar
* Adjuntar foto

---

## 5.6. Panel: Diagnóstico

Secciones:

1. Problema reportado
2. Hallazgos técnicos
3. Recomendaciones
4. Evidencias
5. Resultado

### Resultado

Opciones:

* diagnóstico listo para cotizar;
* requiere más información;
* no procede;
* derivar a otro equipo.

Botones:

* Guardar borrador
* Emitir diagnóstico
* Preparar cotización
* Solicitar información

---

# 6. Pantalla: Bahías y Ejecución

## 6.1. Objetivo

Mostrar y gestionar la ejecución real del trabajo.

Debe responder:

* qué está en cola;
* qué está en progreso;
* qué está bloqueado;
* qué está listo;
* qué equipo está ocupado;
* qué trabajo está atrasado.

---

## 6.2. Layout

```text
Header
↓
Resumen de capacidad
↓
Tablero por estado o por bahía/equipo
↓
Panel de detalle de trabajo
```

---

## 6.3. Header

Título:

```text
Bahías y Ejecución
```

Descripción:

```text
Seguimiento de trabajos activos, tareas, bloqueos y entregas.
```

Botones:

* Refrescar
* Ver solo atrasados
* Ver capacidad

---

## 6.4. Resumen de capacidad

Cards:

* trabajos en cola;
* en ejecución;
* bloqueados;
* listos;
* equipos activos;
* capacidad disponible.

Cada card debe ser clicable para filtrar.

---

## 6.5. Tablero

Opciones de visualización:

1. Por estado:

   * Cola
   * En progreso
   * Bloqueado
   * Listo
   * Entregado

2. Por equipo:

   * Mecánica
   * Lavado
   * Frontdesk
   * Otros

3. Por bahía:

   * Bahía 1
   * Bahía 2
   * Bahía 3

### Card de trabajo

Debe mostrar:

* orden;
* cliente;
* vehículo;
* tarea actual;
* responsable;
* tiempo transcurrido;
* estado;
* alerta.

Acciones:

* Ver detalle
* Completar tarea
* Reportar bloqueo
* Marcar listo

---

## 6.6. Panel de detalle

Secciones:

* resumen de orden;
* tareas;
* evidencia;
* notas internas;
* historial breve.

Botones:

* Iniciar trabajo
* Completar tarea
* Agregar tarea
* Reportar bloqueo
* Marcar listo para entrega
* Marcar entregado

---

# 7. Pantalla: Cartera de Clientes

## 7.1. Objetivo

Gestionar clientes y su historial operativo.

Debe responder:

* quién es el cliente;
* cómo contactarlo;
* qué vehículos tiene;
* qué casos abiertos tiene;
* qué historial tiene;
* cuánto ha gastado o adeuda, si aplica.

---

## 7.2. Layout

```text
Header
↓
Filtros
↓
Listado de clientes + panel de detalle
```

Desktop:

```text
[Lista 35%] [Detalle 65%]
```

---

## 7.3. Header

Título:

```text
Cartera de Clientes
```

Descripción:

```text
Clientes, vehículos, historial de servicios y datos de contacto.
```

Botones:

* Crear cliente
* Importar, futuro
* Refrescar

---

## 7.4. Filtros

Campos:

* buscar por nombre;
* teléfono;
* placa;
* email;
* estado;
* con casos abiertos.

Botones:

* Filtrar
* Limpiar

---

## 7.5. Listado de clientes

Cada item:

* nombre;
* teléfono;
* email;
* cantidad de vehículos;
* casos abiertos;
* última visita;
* gasto total, si aplica.

---

## 7.6. Detalle de cliente

Secciones:

1. Datos personales
2. Contacto
3. Vehículos
4. Casos abiertos
5. Historial
6. Notas

### Datos personales

Campos:

* nombre;
* documento;
* tipo de cliente;
* estado.

Botones:

* Editar cliente
* Fusionar duplicado, futuro
* Desactivar

### Contacto

Campos:

* teléfono principal;
* WhatsApp;
* email;
* canal preferido.

Botones:

* Copiar teléfono
* Abrir conversación, futuro

### Vehículos

Cada vehículo:

* placa;
* marca;
* modelo;
* año;
* kilometraje;
* último servicio.

Botones:

* Agregar vehículo
* Ver historial
* Crear orden para este vehículo

### Historial

Tabla o timeline:

* fecha;
* orden;
* servicio;
* diagnóstico;
* monto;
* estado.

---

# 8. Pantalla: Catálogo de Servicios

## 8.1. Objetivo

Administrar la oferta comercial-operativa.

No debe ser una tabla simple.

Debe conectar:

* landing;
* agente IA;
* admisión;
* diagnóstico;
* cotización;
* equipos;
* duración;
* visibilidad pública.

---

## 8.2. Layout

```text
Header
↓
Filtros
↓
Grid/listado de servicios
↓
Panel de edición
```

---

## 8.3. Header

Título:

```text
Catálogo de Servicios
```

Descripción:

```text
Servicios visibles al cliente y reglas operativas para atención, diagnóstico y ejecución.
```

Botones:

* Crear servicio
* Ordenar catálogo
* Refrescar

---

## 8.4. Filtros

Campos:

* búsqueda;
* categoría;
* visible en landing;
* activo;
* requiere evaluación;
* equipo sugerido.

---

## 8.5. Card de servicio

Cada card:

* nombre;
* categoría;
* descripción corta;
* precio o política de precio;
* duración estimada;
* equipo sugerido;
* visible en landing;
* activo/inactivo;
* requiere diagnóstico;
* requiere cotización.

Botones:

* Editar
* Duplicar
* Activar/desactivar
* Ver en landing

---

## 8.6. Formulario de servicio

Secciones:

### Identidad comercial

* nombre;
* categoría;
* descripción corta;
* descripción larga;
* tags;
* imagen/icono.

### Visibilidad

* visible en landing;
* destacado;
* orden;
* texto CTA.

### Precio

* precio fijo;
* desde;
* requiere cotización;
* moneda;
* notas de precio.

### Operación

* requiere evaluación;
* requiere diagnóstico;
* duración estimada;
* equipo sugerido;
* modalidad permitida.

### IA / Chat

* preguntas frecuentes;
* frases sugeridas;
* restricciones;
* cuándo derivar a humano.

Botones:

* Guardar borrador
* Publicar
* Desactivar
* Cancelar

---

# 9. Pantalla: Centro de Mensajes

## 9.1. Objetivo

Gestionar comunicaciones e interacciones.

Debe distinguir:

* mensajes de cliente;
* notificaciones de sistema;
* alertas operativas;
* plantillas;
* mensajes fallidos.

---

## 9.2. Layout

```text
Header
↓
Filtros
↓
Tres columnas:
  conversaciones / eventos
  detalle
  contexto del caso
```

En tablet, las columnas se apilan.

---

## 9.3. Header

Título:

```text
Centro de Mensajes
```

Descripción:

```text
Interacciones, notificaciones y eventos de comunicación asociados a clientes y órdenes.
```

Botones:

* Crear plantilla
* Refrescar
* Ver fallidos

---

## 9.4. Filtros

Campos:

* canal;
* tipo;
* estado;
* cliente;
* caso;
* fecha.

Tipos:

* interacción;
* notificación;
* alerta;
* plantilla;
* error.

Estados:

* pendiente;
* enviado;
* entregado;
* leído;
* fallido;
* no enviado.

---

## 9.5. Lista de mensajes

Cada item:

* cliente;
* canal;
* tipo;
* preview;
* estado;
* hora;
* caso relacionado;
* alerta si falló.

---

## 9.6. Detalle

Debe mostrar:

* contenido completo;
* canal;
* destinatario;
* estado;
* proveedor;
* error si existe;
* caso relacionado;
* timeline relacionado.

Botones:

* Reintentar
* Copiar contenido
* Marcar revisado
* Ver caso
* Ver cliente

---

## 9.7. Contexto lateral

Debe mostrar:

* cliente;
* teléfono;
* caso abierto;
* estado del caso;
* última acción;
* próxima acción recomendada.

---

# 10. Pantalla: Personal y Equipos

## 10.1. Objetivo

Administrar personas, equipos, capacidad y disponibilidad.

Esta pantalla es clave para evolución hacia disponibilidad real.

---

## 10.2. Layout

```text
Header
↓
Tabs:
  Personal
  Equipos
  Horarios
  Excepciones
↓
Contenido por tab
```

---

## 10.3. Header

Título:

```text
Personal y Equipos
```

Descripción:

```text
Gestión de usuarios operativos, equipos de trabajo, capacidad y horarios.
```

Botones:

* Crear miembro
* Crear equipo
* Refrescar

---

## 10.4. Tab: Personal

Tabla o cards:

* nombre;
* rol;
* equipo;
* estado;
* contacto;
* permisos;
* última actividad.

Botones:

* Editar
* Desactivar
* Asignar equipo
* Ver agenda

Formulario:

* nombre;
* email;
* teléfono;
* rol;
* equipo;
* permisos;
* estado.

---

## 10.5. Tab: Equipos

Cada equipo:

* nombre;
* tipo;
* capacidad;
* servicios asociados;
* miembros;
* estado;
* horario activo.

Botones:

* Crear equipo
* Editar
* Activar/desactivar
* Ver agenda

Formulario:

* nombre;
* tipo;
* capacidad;
* granularidad de slot;
* servicios asociados;
* miembros;
* activo.

---

## 10.6. Tab: Horarios

Debe mostrar reglas semanales.

Por equipo:

* lunes;
* martes;
* miércoles;
* jueves;
* viernes;
* sábado;
* domingo.

Cada día:

* hora inicio;
* hora fin;
* capacidad;
* activo/inactivo.

Botones:

* Agregar bloque horario
* Copiar horario a otros días
* Guardar cambios

---

## 10.7. Tab: Excepciones

Excepciones por fecha:

* bloquear día;
* reemplazar horario;
* extender horario.

Campos:

* equipo;
* fecha;
* modo;
* ventanas;
* motivo;
* activo.

Botones:

* Crear excepción
* Editar
* Desactivar
* Ver impacto en disponibilidad

---

# 11. Pantalla: Ajustes Generales

## 11.1. Objetivo

Configurar el negocio sin crear un formulario interminable.

---

## 11.2. Layout

```text
Header
↓
Navegación secundaria por secciones
↓
Panel de configuración
```

Secciones:

1. Identidad del negocio
2. Marca visual
3. Landing
4. Canales
5. Agenda
6. Usuarios y permisos
7. Reglas operativas
8. Sistema

---

## 11.3. Identidad del negocio

Campos:

* nombre del taller;
* slogan;
* descripción;
* país;
* zona horaria;
* moneda;
* dirección;
* teléfono;
* email.

Botones:

* Guardar
* Restablecer

---

## 11.4. Marca visual

Campos:

* color primario;
* color secundario;
* logo;
* favicon;
* estilo visual;
* modo claro/oscuro, si aplica.

Debe tener preview.

Botones:

* Guardar marca
* Restaurar colores

---

## 11.5. Landing

Debe enlazar al constructor.

Campos:

* landing activa;
* bloques visibles;
* orden de bloques;
* SEO básico;
* CTA principal;
* chat visible.

Botones:

* Abrir constructor
* Previsualizar landing
* Publicar cambios

---

## 11.6. Canales

Campos:

* WhatsApp;
* email;
* web chat;
* webhook;
* estado de integración.

Botones:

* Probar canal
* Guardar
* Ver logs

---

## 11.7. Agenda

Campos:

* duración default;
* anticipación mínima;
* horario base;
* reglas de cancelación;
* confirmación requerida.

Botones:

* Guardar agenda
* Ver disponibilidad

---

## 11.8. Reglas operativas

Campos:

* requiere diagnóstico antes de cotizar;
* permite aprobación manual;
* requiere evidencia para aprobación manual;
* permite crear orden sin cita;
* vencimiento de cotización.

Botones:

* Guardar reglas
* Ver historial de cambios

---

# 12. Constructor Landing Page tipo WordPress

## 12.1. Objetivo

Mantener y mejorar una de las capacidades más valiosas del frontend: el constructor de landing configurable.

Debe permitir editar la landing sin tocar código.

---

## 12.2. Layout ideal

Desktop:

```text
Header del constructor
↓
Tres zonas:
  izquierda: árbol de bloques
  centro: preview
  derecha: propiedades del bloque
```

Tablet:

```text
Header
↓
Tabs:
  Bloques
  Preview
  Propiedades
```

---

## 12.3. Header del constructor

Debe mostrar:

* nombre de la landing;
* estado: borrador / guardado / publicado;
* última actualización;
* usuario editor.

Botones:

* Guardar borrador
* Publicar
* Previsualizar
* Deshacer, futuro
* Volver al admin

---

## 12.4. Panel izquierdo: árbol de bloques

Lista de bloques:

* Hero
* Servicios
* Sobre Nosotros
* Galería
* Testimonios
* CTA
* Contacto
* Embed
* ChatAsistente

Cada bloque debe mostrar:

* nombre;
* activo/inactivo;
* orden;
* tipo;
* alerta si falta configuración.

Acciones:

* seleccionar;
* activar/desactivar;
* duplicar;
* eliminar;
* mover arriba;
* mover abajo;
* agregar bloque.

---

## 12.5. Panel central: preview

Debe mostrar la landing como se verá públicamente.

Controles:

* desktop;
* tablet;
* mobile;
* abrir en nueva pestaña.

Reglas:

* El preview debe actualizarse sin perder cambios.
* Debe indicar si hay cambios sin guardar.
* No debe deformarse por el panel lateral.

---

## 12.6. Panel derecho: propiedades

Depende del bloque seleccionado.

### Propiedades comunes

* título;
* subtítulo;
* texto;
* imagen;
* activo;
* orden;
* estilo;
* CTA;
* visibilidad.

### Hero

Campos:

* título principal;
* subtítulo;
* texto CTA;
* link CTA;
* imagen/fondo;
* badge;
* mensaje inicial para chat.

### Servicios

Campos:

* servicios visibles;
* orden;
* mostrar precio;
* mostrar duración;
* CTA por servicio;
* layout: grid/lista.

### Sobre Nosotros

Campos:

* título;
* historia;
* puntos destacados;
* imagen;
* métricas.

### Galería

Campos:

* imágenes;
* orden;
* captions;
* visibilidad.

### Testimonios

Campos:

* nombre;
* texto;
* calificación;
* foto;
* activo.

### CTA

Campos:

* título;
* texto;
* botón;
* destino;
* estilo.

### Contacto

Campos:

* dirección;
* teléfono;
* WhatsApp;
* email;
* mapa;
* horario.

### Embed

Campos:

* título;
* código embed;
* altura;
* descripción;
* visibilidad.

### ChatAsistente

Campos:

* activo;
* nombre del agente;
* mensaje inicial;
* preguntas sugeridas;
* posición;
* canales.

---

## 12.7. Validaciones del constructor

Antes de publicar:

* Hero debe tener título.
* CTA principal debe tener texto y destino.
* Contacto debe tener al menos un canal.
* Imágenes deben tener texto alternativo.
* Bloques inactivos no deben bloquear publicación.
* Embed debe estar validado para evitar romper layout.

---

# 13. Pantalla pública: Landing

## 13.1. Objetivo

Ser la cara comercial del negocio.

Debe mantener:

* Hero;
* catálogo de servicios;
* información del negocio;
* galería;
* testimonios;
* CTA;
* contacto;
* chat asistente.

---

## 13.2. Reglas visuales

* Debe cargar rápido.
* Debe verse bien en mobile, tablet y desktop.
* CTAs claros.
* Servicios fáciles de entender.
* Chat accesible sin tapar contenido.
* No abusar de animaciones.
* Contraste adecuado.
* Imágenes optimizadas.

---

## 13.3. Hero

Debe mostrar:

* nombre del negocio;
* propuesta de valor;
* CTA principal;
* CTA secundario;
* imagen o visual;
* acceso al chat.

Botones:

* Agendar evaluación
* Ver servicios
* Hablar con Iris

---

## 13.4. Catálogo público

Cada servicio:

* nombre;
* descripción;
* precio desde o “requiere evaluación”;
* duración estimada si aplica;
* CTA;
* icono/imagen.

Botones:

* Solicitar evaluación
* Consultar por chat
* Ver detalle

---

## 13.5. Chat asistente

Debe:

* abrir sin bloquear navegación;
* permitir mensaje inicial contextual;
* responder sobre servicios;
* iniciar flujo de lead/cita cuando aplique;
* mostrar estado de carga;
* manejar errores.

---

# 14. demo_test Pack 0 Console

## 14.1. Objetivo

Crear una consola contractual mínima para validar el backend `/api/demo-test`.

No debe copiar el admin completo.

Debe usar patrones visuales consistentes y componentes reutilizables.

---

## 14.2. Layout

```text
Header
↓
Stepper horizontal o vertical
↓
Panel activo del step
↓
Panel lateral de estado del flujo
↓
Raw response/debug
```

Desktop:

```text
[Workflow 70%] [Estado/debug 30%]
```

Tablet:

```text
Stepper
Panel activo
Estado/debug colapsable
```

---

## 14.3. Header

Título:

```text
Demo Test Pack 0 Console
```

Descripción:

```text
Consola manual para validar Customer → ManagedEntity → Case → Availability → Schedule Consultation → Timeline.
```

Botones:

* Reset flow
* Refrescar timeline
* Copiar estado JSON

---

## 14.4. Step 1: Customer

Campos:

* businessSlug readonly: demo_test
* nombre
* teléfono
* email opcional

Botón:

* Crear o reutilizar Customer

Resultado:

* customerId;
* reused true/false;
* raw response.

Errores:

* mostrar error.code;
* error.message;
* details.

---

## 14.5. Step 2: ManagedEntity

Campos:

* businessSlug readonly;
* customerId readonly;
* type: vehicle;
* displayName;
* summary;
* data JSON o campos guiados:

  * marca;
  * modelo;
  * año;
  * placa;
  * color;
  * kilometraje.

Botón:

* Crear ManagedEntity

Resultado:

* managedEntityId;
* raw response.

---

## 14.6. Step 3: Case

Campos:

* businessSlug;
* verticalType: vehicle_service;
* customerId;
* managedEntityId;
* source.channel: manual_console;
* source.agent: manual;
* source.origin: demo_test_frontend;
* intent.type: assessment_request;
* intent.summary;
* intent.customerText;
* selectedOfferingId opcional.

Botón:

* Crear Case

Resultado:

* caseId;
* caseNumber;
* status;
* raw response.

---

## 14.7. Step 4: Availability

Campos:

* businessSlug;
* teamId;
* catalogOfferingId;
* date;
* durationMinutes;
* timezone: America/Lima.

Botón:

* Buscar disponibilidad

Resultado:

* lista de slots;
* startAt;
* endAt;
* capacityRemaining;
* selección de slot.

Acción:

* seleccionar slot.

Regla:

Frontend no calcula disponibilidad.

---

## 14.8. Step 5: Schedule Consultation

Campos readonly:

* caseId;
* customerId;
* managedEntityId;
* selected startAt;
* duration;
* timezone.

Campos editables:

* teamId;
* catalogOfferingId;
* appointmentType.

Botón:

* Schedule Consultation

Resultado:

* appointmentId;
* resourceReservationId;
* reservation status;
* raw response.

Errores críticos:

* DOUBLE_BOOKING_CONFLICT;
* NO_AVAILABILITY;
* RESERVATION_FAILED;
* APPOINTMENT_CREATION_FAILED.

---

## 14.9. Step 6: Timeline

Campos:

* caseId;
* businessSlug.

Botón:

* Cargar timeline
* Refrescar

Vista:

* eventos newest-first;
* eventType;
* title;
* description;
* actor;
* createdAt;
* metadata colapsable.

Eventos esperados:

* case.created;
* resource_reservation.held;
* resource_reservation.booked;
* appointment.scheduled;
* status.changed.

---

# 15. Componentes UI reutilizables

## 15.1. PageHeader

Props:

* title;
* description;
* actions;
* status;
* breadcrumbs opcional.

Debe ser consistente en todas las pantallas.

---

## 15.2. Card

Variantes:

* default;
* elevated;
* warning;
* error;
* success;
* compact.

Debe tener:

* header;
* title;
* description;
* content;
* footer opcional.

---

## 15.3. Button

Variantes:

* primary;
* secondary;
* outline;
* ghost;
* danger;
* success.

Estados:

* default;
* hover;
* loading;
* disabled;
* active.

---

## 15.4. Badge / EstadoBadge

Debe representar estados con texto claro.

No debe depender solo de color.

Ejemplo:

```text
En diagnóstico
Esperando aprobación
Listo para entrega
```

---

## 15.5. BackendErrorPanel

Debe mostrar:

* error.code;
* error.message;
* details;
* sugerencia si aplica;
* botón copiar error.

---

## 15.6. EmptyState

Debe contener:

* icono;
* título;
* descripción;
* acción opcional.

No debe decir solo “sin datos”.

Debe orientar.

---

## 15.7. RawResponsePanel

Para demo_test y debugging.

Debe permitir:

* expandir/colapsar;
* copiar JSON;
* ver timestamp de última respuesta.

---

# 16. Reglas de formularios

Todo formulario debe tener:

* labels visibles;
* placeholders útiles;
* hints cuando el campo sea ambiguo;
* errores por campo;
* error general;
* botón primario;
* botón cancelar;
* loading state;
* prevención de doble submit.

Reglas:

* No depender solo de placeholder.
* No esconder campos obligatorios.
* No usar formularios gigantes sin agrupación.
* No enviar si faltan campos mínimos.
* Backend sigue siendo autoridad final.

---

# 17. Reglas de estados y errores

Cada pantalla debe manejar:

* loading inicial;
* loading por acción;
* success;
* error;
* empty state;
* estado parcial;
* error recuperable;
* error crítico.

Errores deben mostrar:

* mensaje humano;
* código técnico si viene del backend;
* detalles relevantes;
* acción sugerida.

---

# 18. Qué se conserva

Se conserva conceptualmente:

* landing page;
* constructor de landing;
* catálogo de servicios;
* centro de mensajes;
* personal y equipos;
* ajustes generales;
* admin oscuro operativo;
* PageHeader;
* Card;
* Button;
* Inputs;
* EmptyState;
* EstadoBadge;
* integración vía `/api`.

---

# 19. Qué se corrige

Debe corregirse:

* jerarquía visual;
* exceso de scroll;
* paneles sin contexto fijo;
* formularios largos;
* semántica ambigua;
* contraste débil;
* espacios vacíos sin intención;
* acciones visibles en estados incorrectos;
* mezcla entre admisión, diagnóstico, cotización y ejecución;
* falta de separación entre mensajes, notificaciones y alertas.

---

# 20. Qué no se debe hacer

No se debe:

* copiar el admin completo hacia demo_test;
* rediseñar todo de una vez;
* crear pantallas bonitas sin contrato funcional;
* inventar reglas en frontend;
* romper landing actual;
* romper constructor landing;
* romper catálogo;
* romper ajustes;
* ocultar errores backend;
* depender de campos no documentados;
* usar scroll horizontal;
* usar texto ilegible;
* llenar espacios con decoración vacía.

---

# 21. Secuencia recomendada para convertir esto en wireframes

## Fase 1: Sistema visual

Wireframes base de:

* Shell admin;
* Sidebar;
* Header;
* Card;
* Form;
* Table/List;
* Detail panel;
* Error panel;
* Empty state.

## Fase 2: Pantallas core admin

Wireframes de:

1. Resumen Operativo
2. Órdenes de Taller
3. Admisión y Diagnóstico
4. Bahías y Ejecución

## Fase 3: Pantallas soporte

Wireframes de:

5. Cartera de Clientes
6. Catálogo de Servicios
7. Centro de Mensajes
8. Personal y Equipos
9. Ajustes Generales

## Fase 4: Constructor Landing

Wireframes de:

* árbol de bloques;
* preview;
* propiedades;
* publicar;
* preview responsive.

## Fase 5: demo_test Console

Wireframes de:

* Customer;
* ManagedEntity;
* Case;
* Availability;
* Schedule Consultation;
* Timeline.

---

# 22. Criterio final de aceptación

Una pantalla está lista para implementación cuando cumple:

1. Se entiende en menos de cinco segundos.
2. Tiene jerarquía visual clara.
3. Tiene semántica operacional correcta.
4. No depende de scroll horizontal.
5. Usa scroll vertical solo cuando es necesario.
6. Funciona en tablet, laptop y monitor grande.
7. Tiene acciones visibles según estado.
8. Tiene loading, empty, success y error.
9. Respeta contraste y legibilidad.
10. No rompe funcionalidad existente.
11. No mezcla responsabilidades de proceso.
12. Puede convertirse a wireframe sin ambigüedad.
13. Puede convertirse a PR sin reinterpretación creativa.

---

# 23. Conclusión

El nuevo frontend de VtkALL debe evolucionar desde un admin funcional hacia una consola operacional madura.

La meta no es agregar más pantallas.

La meta es que cada pantalla tenga una responsabilidad clara:

* Resumen Operativo observa.
* Órdenes de Taller decide.
* Admisión y Diagnóstico evalúa.
* Bahías y Ejecución ejecuta.
* Clientes conserva historial.
* Catálogo define la oferta.
* Mensajes comunica.
* Personal y Equipos define capacidad.
* Ajustes gobierna configuración.
* Landing vende.
* Constructor Landing configura.
* demo_test valida contrato.

Esa separación debe guiar todos los wireframes y todos los PRs posteriores.
