# 📘 Guía Completa de Temporal Workflows
### Para aplicaciones internas de negocio con TypeScript

---

## Tabla de Contenidos

1. [¿Qué es Temporal y para qué sirve?](#1-qué-es-temporal-y-para-qué-sirve)
2. [Conceptos clave](#2-conceptos-clave)
3. [Arquitectura del proyecto](#3-arquitectura-del-proyecto)
4. [Cómo diseñar un flujo de negocio](#4-cómo-diseñar-un-flujo-de-negocio)
5. [Crear Actividades](#5-crear-actividades)
6. [Crear un Workflow](#6-crear-un-workflow)
7. [Configurar el Worker](#7-configurar-el-worker)
8. [Iniciar y gestionar Workflows (Cliente)](#8-iniciar-y-gestionar-workflows-cliente)
9. [Señales — input externo a workflows en ejecución](#9-señales--input-externo-a-workflows-en-ejecución)
10. [Queries — consultar el estado](#10-queries--consultar-el-estado)
11. [Timers durables](#11-timers-durables)
12. [Manejo de errores y reintentos](#12-manejo-de-errores-y-reintentos)
13. [Monitoreo en la UI web](#13-monitoreo-en-la-ui-web)
14. [Casos de uso comunes para tu negocio](#14-casos-de-uso-comunes-para-tu-negocio)
15. [Comandos de referencia rápida](#15-comandos-de-referencia-rápida)

---

## 1. ¿Qué es Temporal y para qué sirve?

Temporal es una **plataforma de ejecución durable**. Esto significa que puedes escribir procesos de negocio como código normal en TypeScript y Temporal garantiza que:

- ✅ **Nunca se pierden**, aunque el servidor se reinicie, caiga la red o falle el proceso
- ✅ **Se reintentan automáticamente** cuando algo falla (llamadas a APIs, bases de datos, etc.)
- ✅ **Pueden durar días, semanas o meses** esperando una acción humana o externa
- ✅ **Son observables** — puedes ver exactamente en qué paso está cada proceso en la UI

### ¿Cuándo usarlo en tu negocio?

| Problema sin Temporal | Solución con Temporal |
|---|---|
| Un proceso de múltiples pasos falla a mitad y se pierde el estado | El workflow retoma desde donde falló automáticamente |
| Necesitas esperar aprobación humana por horas/días | El workflow duerme durablemente y despierta al recibir la señal |
| Múltiples microservicios que se llaman en cadena son difíciles de rastrear | Todo el flujo es código en un solo lugar, visible en la UI |
| Los cronjobs fallidos pasan desapercibidos | Temporal reintenta y alerta si algo sale mal |

---

## 2. Conceptos clave

```
┌─────────────────────────────────────────────────────┐
│                   TEMPORAL SERVER                    │
│  (orquesta y persiste el estado de todo)             │
└──────────┬──────────────────────────┬───────────────┘
           │ task queue: "pedidos"    │
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────┐
│     WORKER       │      │   CLIENTE (tu app)    │
│  Ejecuta:        │      │  - Inicia workflows   │
│  - Workflows     │      │  - Envía señales      │
│  - Actividades   │      │  - Consulta estado    │
└──────────────────┘      └──────────────────────┘
```

| Concepto | Qué es | Analogía |
|---|---|---|
| **Workflow** | El "director": define el flujo, la secuencia y la lógica de decisión | El guión de una obra de teatro |
| **Activity** | Una tarea concreta: llamar a una API, guardar en DB, enviar email | Un actor ejecutando una escena |
| **Worker** | El proceso que corre workflows y actividades | El equipo técnico de producción |
| **Task Queue** | La cola que conecta el servidor con tus workers | El tablero de asignación de tareas |
| **Signal** | Input externo que modifica un workflow en ejecución | Una llamada telefónica inesperada |
| **Query** | Consultar el estado de un workflow sin modificarlo | Revisar el estado de un pedido online |
| **Workflow ID** | Identificador único de una instancia del workflow | Número de orden de compra |

> [!IMPORTANT]
> Un **Workflow** solo define la lógica de orquestación — no hace trabajo real directamente.
> Todo el trabajo real (DB, emails, APIs) va en **Actividades**.

---

## 3. Arquitectura del proyecto

```
temporal-suite/
├── deploy/
│   └── docker-compose.yml        ← Temporal Server + UI + PostgreSQL
└── workflows/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── activities.ts         ← Lógica real de negocio
        ├── workflows.ts          ← Flujos de negocio (orquestación)
        ├── worker.ts             ← Proceso que conecta todo con Temporal
        ├── client.ts             ← Script para iniciar workflows
        ├── signal-approve.ts     ← Script para enviar aprobación
        └── signal-reject.ts      ← Script para enviar rechazo
```

### Regla de oro

```
activities.ts   → "Hacer cosas" (llamadas externas, I/O, DB)
workflows.ts    → "Decidir qué hacer y en qué orden" (solo lógica pura)
worker.ts       → "Ejecutar lo que Temporal le asigne"
client.ts       → "Decirle a Temporal qué iniciar"
```

---

## 4. Cómo diseñar un flujo de negocio

Antes de escribir código, dibuja el flujo en papel o en un diagrama. Temporal es perfecto para flujos que tienen:

- Múltiples pasos secuenciales
- Puntos de espera (aprobaciones, pagos, confirmaciones)
- Pasos que pueden fallar y deben reintentarse
- Condiciones (si X → hacer Y, si no → hacer Z)

### Ejemplo: Flujo de Aprobación de Pedido

```
[INICIO]
   │
   ▼
[1. Guardar pedido en DB]
   │
   ▼
[2. Notificar aprobadores]
   │
   ▼
[3. Esperar señal ──────────────────────── hasta 48 horas]
   │                                              │
   ├── "aprobar" ────────────────┐               │ timeout
   └── "rechazar" ──────────┐   │               │
                            │   ▼               ▼
                            │  [4a. Procesar]  [4c. Cancelar]
                            │        │              │
                            │  [5a. Notificar]  [5c. Notificar]
                            ▼
                       [4b. Cancelar]
                            │
                       [5b. Notificar]
                            │
                          [FIN]
```

### Checklist de diseño

- [ ] ¿Cuáles son los pasos del flujo?
- [ ] ¿Qué pasos necesitan acceso a sistemas externos? → Son **Actividades**
- [ ] ¿Hay pasos de espera? ¿Por cuánto tiempo máximo?
- [ ] ¿Qué inputs externos puede recibir mientras corre? → Son **Señales**
- [ ] ¿Qué información necesito poder consultar? → Son **Queries**
- [ ] ¿Qué pasa si algo falla? ¿Cuántos reintentos?

---

## 5. Crear Actividades

Las actividades son **funciones TypeScript normales** que hacen trabajo real. Temporal las ejecuta con reintentos automáticos.

```typescript
// src/activities.ts
import { log } from '@temporalio/activity';

// Definir los datos que usa tu workflow
export interface Pedido {
  id: string;
  cliente: string;
  monto: number;
}

// Cada función exportada es una actividad disponible
export async function guardarPedido(pedido: Pedido): Promise<void> {
  log.info('Guardando pedido', { id: pedido.id });
  
  // Aquí va tu código real: DB, APIs, etc.
  await db.insert('pedidos', pedido);  // ejemplo
}

export async function enviarEmail(destinatario: string, asunto: string): Promise<void> {
  log.info('Enviando email', { destinatario });
  await emailService.send({ to: destinatario, subject: asunto });
}

export async function procesarPago(pedido: Pedido): Promise<string> {
  const resultado = await stripe.charges.create({ amount: pedido.monto });
  return resultado.id;  // Puedes retornar valores desde actividades
}
```

### Reglas de las Actividades

> [!WARNING]
> Las actividades **SÍ pueden**:
> - Llamar a APIs externas
> - Leer/escribir en bases de datos
> - Enviar emails, mensajes, notificaciones
> - Tener efectos secundarios
> - Usar `Date.now()`, `Math.random()`, etc.
>
> Las actividades **NO deben**:
> - Llamar a otras actividades directamente (eso lo hace el workflow)
> - Durar horas sin reportar progreso (usa Heartbeat si necesitas)

### Heartbeat para actividades largas

Si una actividad tarda mucho tiempo (procesar un archivo grande, un bulk de datos), usa heartbeat:

```typescript
import { heartbeat, isCancelled } from '@temporalio/activity';

export async function procesarArchivoGrande(url: string): Promise<void> {
  const lineas = await descargarArchivo(url);
  
  for (let i = 0; i < lineas.length; i++) {
    if (isCancelled()) break;  // Respetar cancelación
    
    await procesarLinea(lineas[i]);
    
    // Reportar progreso cada 100 líneas
    if (i % 100 === 0) {
      heartbeat(`Procesadas ${i}/${lineas.length} líneas`);
    }
  }
}
```

---

## 6. Crear un Workflow

El workflow es **código determinista** que orquesta las actividades. La clave: **no hagas I/O aquí**, solo llama actividades.

```typescript
// src/workflows.ts
import { proxyActivities, defineSignal, defineQuery, setHandler, condition, sleep, log } from '@temporalio/workflow';
import type * as activitiesTypes from './activities';
import type { Pedido } from './activities';

// 1. Conectar actividades al workflow
const acts = proxyActivities<typeof activitiesTypes>({
  startToCloseTimeout: '30 seconds',  // Tiempo máx por actividad
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

// 2. Definir señales que el workflow puede recibir
export const aprobarSignal = defineSignal<[{ userId: string }]>('aprobar');
export const pausarSignal = defineSignal('pausar');

// 3. Definir queries para consultar el estado
export const estadoQuery = defineQuery<string>('estado');

// 4. Definir e implementar el workflow
export async function miWorkflow(pedido: Pedido): Promise<void> {
  const ctx = { aprobado: false, pausado: false };
  let etapa = 'iniciando';

  // Registrar manejadores de señales
  setHandler(aprobarSignal, ({ userId }) => {
    log.info('Aprobación recibida', { userId });
    ctx.aprobado = true;
  });

  setHandler(pausarSignal, () => { ctx.pausado = true; });

  // Registrar manejador de query
  setHandler(estadoQuery, () => etapa);

  // El flujo en sí
  etapa = 'guardando';
  await acts.guardarPedido(pedido);

  etapa = 'notificando';
  await acts.enviarEmail('jefe@empresa.com', `Aprobar pedido ${pedido.id}`);

  etapa = 'esperando_aprobacion';
  const aprobado = await condition(() => ctx.aprobado, '48 hours');

  if (!aprobado) {
    etapa = 'expirado';
    return;
  }

  etapa = 'procesando_pago';
  await acts.procesarPago(pedido);

  etapa = 'completado';
}
```

### Reglas de los Workflows

> [!WARNING]
> Los workflows **SÍ pueden**:
> - Llamar actividades con `await acts.miActividad()`
> - Usar [sleep()](file:///c:/Users/eduar/Desktop/Chinese%20Method/temporal-suite/workflows/src/activities.ts#63-66) de `@temporalio/workflow` para timers durables
> - Usar `condition()` para esperar condiciones
> - Recibir señales y responder queries
> - Tener lógica condicional, loops, try/catch
>
> Los workflows **NO deben**:
> - Llamar APIs, DB, o cualquier I/O directamente
> - Usar `Date.now()` — usa `new Date()` de Temporal workflow context
> - Usar `Math.random()` directamente
> - Importar módulos no deterministas

---

## 7. Configurar el Worker

El Worker es el proceso que se conecta a Temporal y ejecuta los workflows y actividades.

```typescript
// src/worker.ts
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',  // Cambiar en producción
  });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),  // Archivo de workflows
    activities,                                      // Objeto con todas las actividades
    taskQueue: 'mi-cola',                           // Nombre de la cola
    
    // Opciones avanzadas (opcionales)
    maxConcurrentActivityTaskExecutions: 10,         // Actividades paralelas máx
    maxConcurrentWorkflowTaskExecutions: 5,          // Workflows paralelos máx
  });

  await worker.run();
}

main();
```

### Un worker, múltiples colas

Puedes tener workers especializados por tipo de tarea:

```typescript
// worker-pagos.ts — solo procesa workflows de pago
const worker = await Worker.create({
  taskQueue: 'pagos',
  activities: actividadesDePago,
  workflowsPath: require.resolve('./workflows/pagos'),
});

// worker-notificaciones.ts — solo notificaciones
const worker = await Worker.create({
  taskQueue: 'notificaciones',
  activities: actividadesDeNotificacion,
  workflowsPath: require.resolve('./workflows/notificaciones'),
});
```

> [!TIP]
> Para producción, corre múltiples instancias del worker con el mismo `taskQueue`
> para escalar horizontalmente. Temporal distribuye el trabajo automáticamente.

---

## 8. Iniciar y gestionar Workflows (Cliente)

El cliente se usa desde **cualquier parte de tu app** (API REST, cron, botón en tu dashboard) para iniciar o interactuar con workflows.

### Iniciar un workflow

```typescript
import { Client, Connection } from '@temporalio/client';
import { miWorkflow } from './workflows';

const connection = await Connection.connect({ address: 'localhost:7233' });
const client = new Client({ connection });

// Iniciar
const handle = await client.workflow.start(miWorkflow, {
  taskQueue: 'mi-cola',
  workflowId: `pedido-${pedido.id}`,  // ID único — importante para idempotencia
  args: [pedido],
  
  // Opcionales:
  searchAttributes: {
    CustomStringField: [pedido.cliente],  // Permite buscar en la UI
  },
});

console.log(`Workflow ID: ${handle.workflowId}`);
```

### Obtener el resultado (esperar a que termine)

```typescript
const resultado = await handle.result();
console.log('Workflow completado:', resultado);
```

### Obtener un handle de un workflow ya existente

```typescript
// No necesitas el handle original — solo el ID
const handle = client.workflow.getHandle('pedido-12345');

// Luego puedes enviar señales, queries, etc.
```

### Cancelar un workflow

```typescript
const handle = client.workflow.getHandle('pedido-12345');
await handle.cancel();
```

### Terminar forzadamente (para casos de emergencia)

```typescript
await handle.terminate('Razón de la terminación');
```

---

## 9. Señales — input externo a workflows en ejecución

Las señales permiten que **código externo modifique o avance** un workflow que está corriendo o esperando.

### Definir señales (en workflows.ts)

```typescript
import { defineSignal, setHandler } from '@temporalio/workflow';

// Sin payload
export const pausarSignal = defineSignal('pausar');

// Con payload tipado
export const aprobarSignal = defineSignal<[{ userId: string; comentario: string }]>('aprobar');

// Con múltiples parámetros
export const actualizarSignal = defineSignal<[string, number]>('actualizar');
```

### Registrar el manejador (dentro del workflow)

```typescript
export async function miWorkflow(): Promise<void> {
  const ctx = { aprobado: false };

  setHandler(aprobarSignal, ({ userId, comentario }) => {
    log.info(`Aprobado por ${userId}: ${comentario}`);
    ctx.aprobado = true;
  });

  // El workflow espera hasta que aprobado sea true o pasen 24 horas
  await condition(() => ctx.aprobado, '24 hours');
}
```

### Enviar señales (desde el cliente)

```typescript
const handle = client.workflow.getHandle('pedido-12345');

// Sin payload
await handle.signal(pausarSignal);

// Con payload
await handle.signal(aprobarSignal, {
  userId: 'gerente-maria',
  comentario: 'Todo está en orden',
});
```

> [!NOTE]
> Las señales son **fire and forget** — el cliente no espera respuesta.
> Para obtener resultados, usa una Query después de enviar la señal.

---

## 10. Queries — consultar el estado

Las queries permiten **leer el estado** de un workflow en ejecución **sin modificarlo**.

### Definir queries (en workflows.ts)

```typescript
import { defineQuery, setHandler } from '@temporalio/workflow';

// Query simple
export const obtenerEtapaQuery = defineQuery<string>('etapa');

// Query con parámetro
export const obtenerDetalleQuery = defineQuery<Detalle, [string]>('detalle');
```

### Registrar el manejador (dentro del workflow)

```typescript
export async function miWorkflow(pedido: Pedido): Promise<void> {
  let etapa = 'iniciando';
  const historial: string[] = [];

  setHandler(obtenerEtapaQuery, () => etapa);
  setHandler(obtenerDetalleQuery, (campo: string) => {
    // Puedes retornar datos calculados en el momento
    return { etapa, historial, pedido };
  });

  etapa = 'procesando';
  historial.push('Workflow iniciado');
  // ... resto del workflow
}
```

### Ejecutar queries (desde el cliente)

```typescript
const handle = client.workflow.getHandle('pedido-12345');

const etapa = await handle.query(obtenerEtapaQuery);
console.log(`El pedido está en: ${etapa}`);

const detalle = await handle.query(obtenerDetalleQuery, 'todo');
```

---

## 11. Timers durables

A diferencia de `setTimeout` normal, los timers de Temporal **sobreviven reinicios del servidor**.

```typescript
import { sleep, condition } from '@temporalio/workflow';

// Esperar un tiempo fijo
await sleep('5 minutes');
await sleep('2 hours');
await sleep('7 days');
await sleep(1000 * 60 * 60); // también acepta milisegundos

// Esperar HASTA que una condición sea verdadera (con timeout opcional)
const cumplio = await condition(() => ctx.aprobado);           // sin timeout
const cumplio = await condition(() => ctx.aprobado, '48 hours'); // con timeout

// Si condition retorna false, se agotó el tiempo
if (!cumplio) {
  // manejar timeout
}
```

### Caso de uso: recordatorio automático

```typescript
export async function workflowConRecordatorio(pedido: Pedido): Promise<void> {
  const ctx = { aprobado: false };
  
  setHandler(aprobarSignal, () => { ctx.aprobado = true; });
  
  // Enviar notificación inicial
  await acts.notificarAprobador(pedido);
  
  // Esperar 24 horas
  const aprobado = await condition(() => ctx.aprobado, '24 hours');
  
  if (!aprobado) {
    // Mandar recordatorio y esperar 24 horas más
    await acts.enviarRecordatorio(pedido);
    const aprobadoFinal = await condition(() => ctx.aprobado, '24 hours');
    
    if (!aprobadoFinal) {
      await acts.escalarAGerencia(pedido);
    }
  }
}
```

---

## 12. Manejo de errores y reintentos

### Reintentos en actividades

```typescript
const acts = proxyActivities<typeof activitiesTypes>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 5,        // Intentar máximo 5 veces
    initialInterval: '1 second',
    backoffCoefficient: 2,     // Exponential backoff: 1s, 2s, 4s, 8s...
    maximumInterval: '30 seconds',
    nonRetryableErrorTypes: [  // Errores que NO se reintentan
      'ValidationError',
      'NotFoundError',
    ],
  },
});
```

### Errores no reintentables (en actividades)

```typescript
import { ApplicationFailure } from '@temporalio/activity';

export async function validarPedido(pedido: Pedido): Promise<void> {
  if (pedido.monto <= 0) {
    // Este error NO se reintentará — es un error de validación lógica
    throw ApplicationFailure.nonRetryable('Monto inválido', 'ValidationError', pedido);
  }
  
  // Este error SÍ se reintentará — es un error de infraestructura
  const resultado = await llamarAPI();
  if (!resultado.ok) {
    throw new Error('API temporalmente no disponible');
  }
}
```

### Try/catch en el workflow

```typescript
export async function miWorkflow(pedido: Pedido): Promise<void> {
  try {
    await acts.procesarPago(pedido);
  } catch (err) {
    // Si el pago falló después de todos los reintentos
    log.error('Pago fallido', { error: err });
    await acts.notificarFallo(pedido, err);
    await acts.cancelarPedido(pedido);
    throw err;  // Re-lanzar marca el workflow como FAILED en la UI
  }
}
```

---

## 13. Monitoreo en la UI web

Accede a **http://localhost:8080** (o tu VPS) para ver todo en tiempo real.

### Lo que puedes ver

| Sección | Qué muestra |
|---|---|
| **Workflows** | Lista de todos los workflows (Running, Completed, Failed, Timed Out) |
| **Workflow Detail** | Línea de tiempo de cada evento, inputs, outputs, señales recibidas |
| **Event History** | Cada actividad, señal y decisión, con timestamps exactos |
| **Namespaces** | Separación de ambientes (producción, staging, desarrollo) |
| **Task Queues** | Tus colas y cuántos workers las están escuchando |
| **Schedules** | Workflows que corren en calendario (tipo cron) |

### Filtros útiles en la UI

```sql
-- Ver solo workflows fallidos de hoy
ExecutionStatus = "Failed" AND StartTime > "2026-03-03"

-- Buscar workflow por cliente
CustomStringField = "Empresa ABC"

-- Ver workflows de tipo específico
WorkflowType = "aprobacionPedidoWorkflow"
```

> [!TIP]
> Agrega **Search Attributes** al iniciar tu workflow para poder filtrarlo fácilmente en la UI:
> ```typescript
> await client.workflow.start(miWorkflow, {
>   searchAttributes: {
>     CustomStringField: [pedido.cliente],  // Filtrable en UI
>     CustomIntField: [pedido.monto],
>   }
> });
> ```

---

## 14. Casos de uso comunes para tu negocio

### 📋 Workflow de Aprobación (ya implementado)
Pedidos, gastos, vacaciones, contratos — cualquier proceso que necesite OK humano.

### 📅 Workflows tipo Cron (Schedule)
```typescript
// Crear un schedule que corre diario a las 9am
await client.schedule.create({
  scheduleId: 'reporte-diario',
  spec: { cronExpressions: ['0 9 * * *'] },
  action: {
    type: 'startWorkflow',
    workflowType: generarReporteWorkflow,
    taskQueue: 'reportes',
  },
});
```

### 🔄 Saga Pattern (transacciones distribuidas)
Para operaciones que tocan múltiples sistemas y deben revertirse si algo falla:
```typescript
export async function crearCuentaWorkflow(usuario: Usuario): Promise<void> {
  let pagoCreado = false;
  let usuarioCreado = false;

  try {
    await acts.crearUsuarioEnDB(usuario);
    usuarioCreado = true;

    await acts.crearCuentaDePago(usuario);
    pagoCreado = true;

    await acts.enviarEmailBienvenida(usuario);
  } catch (err) {
    // Compensar en orden inverso
    if (pagoCreado) await acts.eliminarCuentaDePago(usuario);
    if (usuarioCreado) await acts.eliminarUsuarioDeDB(usuario);
    throw err;
  }
}
```

### 🔁 Workflows de larga duración (polling)
```typescript
export async function monitorearSistemaWorkflow(): Promise<void> {
  while (true) {
    const estado = await acts.verificarEstadoSistema();
    
    if (estado.hayProblema) {
      await acts.enviarAlerta(estado);
    }
    
    await sleep('5 minutes');  // Verificar cada 5 minutos, sin consumir recursos
  }
}
```

### 👥 Fan-out / Fan-in (tareas paralelas)
```typescript
import { Promise } from '@temporalio/workflow';

export async function procesarPedidosWorkflow(pedidos: Pedido[]): Promise<void> {
  // Procesar todos los pedidos en paralelo
  const promesas = pedidos.map(pedido => acts.procesarPedido(pedido));
  const resultados = await Promise.all(promesas);
  
  await acts.generarResumen(resultados);
}
```

---

## 15. Comandos de referencia rápida

### Infraestructura

```bash
# Levantar Temporal (desde la carpeta deploy)
sudo docker compose up -d

# Ver estado de los contenedores
sudo docker compose ps

# Ver logs del servidor
sudo docker logs temporal-server -f

# Apagar (los datos persisten en el volumen)
sudo docker compose down

# Apagar Y borrar datos (cuidado en producción)
sudo docker compose down -v
```

### Worker y cliente

```bash
cd temporal-suite/workflows

# Instalar dependencias (solo la primera vez)
npm install

# Levantar el worker (dejar corriendo en background o en su terminal)
npm run worker

# Iniciar un nuevo workflow de pedido
npm run start-workflow

# Aprobar un workflow en espera
npm run approve <workflowId>

# Rechazar un workflow en espera
npm run reject <workflowId>
```

### Temporal CLI (herramienta de administración)

```bash
# Listar workflows activos
temporal workflow list

# Ver detalles de un workflow
temporal workflow describe --workflow-id mi-workflow-id

# Enviar señal desde CLI
temporal workflow signal --workflow-id mi-id --name aprobar --input '{"userId":"admin"}'

# Ejecutar query desde CLI
temporal workflow query --workflow-id mi-id --type estado

# Cancelar un workflow
temporal workflow cancel --workflow-id mi-id

# Ver historial completo de eventos
temporal workflow show --workflow-id mi-id
```

---

## Flujo de trabajo día a día

```
1. Diseñas el flujo en papel
       ↓
2. Agregas las actividades en activities.ts
       ↓
3. Defines la orquestación en workflows.ts
       ↓
4. El worker lo registra automáticamente (ya está corriendo)
       ↓
5. Tu app/script llama al cliente para iniciar el workflow
       ↓
6. Monitoras el progreso en http://localhost:8080
       ↓
7. Envías señales desde tu app (botón "Aprobar") o desde CLI
       ↓
8. El workflow completa y puedes obtener el resultado
```

---

> [!NOTE]
> **Documentación oficial**: https://docs.temporal.io/develop/typescript
>
> **Ejemplos de la comunidad**: https://github.com/temporalio/samples-typescript
>
> **Comunidad (Slack)**: https://t.mp/slack
