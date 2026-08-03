# HERMES-12 Runbook

Comandos desde la raiz del repositorio:

```bash
cd /mnt/c/Users/eduar/Desktop/ai-integrations/demo_test
```

En WSL, si Docker requiere permisos:

```bash
echo admin | sudo -S docker compose ps
```

## Levantar stack

```bash
docker compose up -d
docker compose ps
```

Orden esperado:

```text
mongo -> temporal -> ollama -> api -> temporal-worker -> frontend
```

## Health y readiness

```bash
curl -s http://localhost:4000/api/v1/admin/health
curl -s http://localhost:4000/api/v1/admin/hermes/readiness
```

`/health` es liveness del API y Mongo. `/hermes/readiness` indica `ready`, `degraded` o `not_ready`.

## Logs

```bash
docker compose logs --tail=100 api
docker compose logs --tail=100 ollama
docker compose logs --tail=100 temporal
docker compose logs --tail=100 temporal-worker
```

Logs Hermes utiles:

```bash
docker compose logs --tail=300 api | grep -E "hermes-model|hermes-inference|hermes-operational|fallbackUsed|queue_timeout|circuit"
```

## Reinicios puntuales

Reiniciar solo API:

```bash
docker compose restart api
```

Reiniciar solo Ollama:

```bash
docker compose restart ollama
```

Reiniciar solo worker:

```bash
docker compose restart temporal-worker
```

## Ollama

Comprobar modelo disponible:

```bash
docker compose exec ollama ollama list
```

Consumo CPU/RAM:

```bash
docker stats --no-stream
docker stats --no-stream demo_test_api demo_test_ollama
```

## Diagnostico de outcomes

- `model.ok`: el provider produjo una respuesta valida.
- `timeout`: el provider supero el limite configurado.
- `rate_limited`: provider remoto devolvio limite, normalmente 429.
- `circuit_open`: el circuit breaker evita llamadas repetidas a un provider fallando.
- `queue_timeout`: Ollama local estaba ocupado y la espera supero `HERMES_MODEL_QUEUE_WAIT_MS`.
- `fallbackUsed`: el turno continuo con respuesta segura sin depender del provider fallido.
- `coldStart`: Ollama tuvo carga material del modelo antes de inferir.
- `memoryVersion`: version de memoria persistente de la conversacion.

## Verificar fallback

```bash
docker compose stop ollama
curl -s -X POST http://localhost:4000/api/demo-test/agent/message \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: runbook-fallback-1" \
  -d '{"businessSlug":"turagua","conversationId":"runbook-fallback","messageId":"runbook-fallback-1","message":"Hola"}'
docker compose start ollama
```

Esperado: API responde, readiness queda `degraded` mientras Ollama esta detenido y no se inventa accion.

## Verificar replay

Enviar dos veces el mismo `messageId`:

```bash
curl -s -X POST http://localhost:4000/api/demo-test/agent/message \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: runbook-replay-1" \
  -d '{"businessSlug":"turagua","conversationId":"runbook-replay","messageId":"runbook-replay-1","message":"Hola"}'
```

Esperado: segunda respuesta igual, menor latencia y sin nuevo `hermes-model` para ese `messageId`.

## Accion real

Usar la ruta publica `/agendar` o el endpoint:

```bash
curl -s -X POST http://localhost:4000/api/demo-test/agent/message \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: runbook-action-1" \
  -d '{"businessSlug":"turagua","conversationId":"runbook-action","messageId":"runbook-action-1","message":"Quiero reservar Arenado + Undercoating. Soy Ronald Zavaleta, mi telefono es 933075200 y mi vehiculo es un Mitsubishi Montero Sport. Quiero manana."}'
```

Esperado: policy autoriza solo acciones permitidas, Temporal gobierna el proceso y la respuesta visible no expone internals.

