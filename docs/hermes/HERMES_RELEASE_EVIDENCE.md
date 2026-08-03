# HERMES-12 Release Evidence

Fecha: 2026-07-22  
Entorno: Windows + WSL + Docker Compose local  
Business slug: `turagua`  
Modelo local: `qwen2.5:0.5b`

## A. Stack

Estado inicial: ejecutado en esta unidad.

Comandos:

```bash
docker compose up -d
docker compose ps
curl -s http://localhost:4000/api/v1/admin/health
curl -s http://localhost:4000/api/v1/admin/hermes/readiness
docker stats --no-stream demo_test_api demo_test_ollama
```

Resultado:

```text
docker compose ps: PASS
API health: PASS - status ok, database connected
Mongo disponible: PASS - demo_test_mongo healthy
Temporal/worker disponibles: PASS - demo_test_temporal up, demo_test_temporal_worker up
Ollama disponible: PASS - demo_test_ollama up
Hermes readiness: PASS - ready
Hermes readiness payload:
  status=ready
  api=up
  mongo=up
  temporal=up
  ollama=up
  modelCircuit=closed
  inferenceGate active=0 queued=0 maxConcurrent=1
  fallbackAvailable=true
CPU/RAM sample:
  demo_test_api: 68.26 MiB
  demo_test_ollama: 513.9 MiB
```

## B. Turno normal con accion real

Resultado:

```text
conversationId: codex_h12_action_1784742800
messageId: h12-action-2
workflowId: schedule-consultation-1784742749046-cc2d897f
model.ok o degradacion controlada: PASS - Ollama model.ok en interpretacion y composicion
policy autoriza: PASS - accion permitida; executionMs=1244
Temporal ejecuta: PASS - workflow WAITING_FOR_CUSTOMER_DATA
respuesta visible correcta: PASS - "Claro, lo vemos. ¿A nombre de quien registro la evaluacion?"
una sola respuesta visible: PASS
```

## C. Fallback con Ollama detenido

Resultado:

```text
Ollama detenido: PASS
readiness degraded: PASS - ollama=down, temporal=up, mongo=up, fallbackAvailable=true
respuesta deterministica: PASS - "Hola, soy Iris. En que puedo ayudarte?"
sin accion duplicada: PASS - workflowId undefined, executionMs=0
API viva: PASS - HTTP 200
logs: PASS - Ollama connection_error clasificado, fallbackUsed=true
```

## D. Replay

Resultado:

```text
conversationId: codex_h12_action_1784742800
messageId: h12-action-2
misma respuesta: PASS
workflowId preservado: PASS - schedule-consultation-1784742749046-cc2d897f
sin llamada nueva al modelo: PASS - replay HTTP ~79 ms y sin nuevo bloque hermes-model para el replay
sin accion nueva: PASS - no se creo workflow nuevo
latencia reducida: PASS - turno original ~17889 ms, replay ~79 ms
```

## E. Reinicio del API

Resultado:

```text
API restart: PASS
memoria disponible: PASS - Mongo siguio conectado despues del restart
workflow vigente: PASS - state devuelve WAITING_FOR_CUSTOMER_DATA para schedule-consultation-1784742749046-cc2d897f
warm-up best-effort: PASS - log [hermes-inference-runtime] warmup.completed
health recuperado: PASS - /api/v1/admin/health status ok
readiness recuperado: PASS - primero degraded con ollama=warming, luego ready con ollama=up
```

## Resultado final

```text
HERMES_RELEASE_GATE=PASS
Hermes operationally ready for stable demo.
```
