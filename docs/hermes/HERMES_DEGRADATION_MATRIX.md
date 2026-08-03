# HERMES-12 Degradation Matrix

Regla principal: la degradacion nunca debe inventar que una accion fue ejecutada.

| Condicion | Comportamiento esperado | Estado operativo |
| --- | --- | --- |
| Ollama disponible | Interpretacion y composicion local con `model.ok`. | `ready` si Mongo y Temporal estan disponibles. |
| Ollama timeout | Clasificar `timeout`; intentar provider permitido y luego fallback. | `degraded` si se repite o abre circuito. |
| Ollama circuit open | Saltar llamada local sin espera. | `degraded`, API viva. |
| Gemini 429 | Clasificar `rate_limited`; usar fallback. | `degraded`, sin duplicar acciones. |
| Ambos providers caidos | Fallback deterministico. | `degraded`, no confirma acciones no ejecutadas. |
| Cola Ollama llena | `queue_unavailable` o `queue_timeout`; continuar con provider/fallback. | `degraded`, gate protege la maquina. |
| Mongo caido | No aceptar operacion completa. | `not_ready`. |
| Temporal caido | Q&A puede continuar; acciones transaccionales no pueden garantizarse. | `degraded`. |
| Memoria falla | Continuar turno sin romper reserva. | `degraded` si persiste. |
| Warm-up falla | API disponible; warning en logs; fallback sigue disponible. | `degraded` para modelo local. |
| Replay recibido | Devolver respuesta persistida sin inferencia. | `ready` o `degraded` segun dependencias. |
| JSON invalido | Clasificar `invalid_json`; usar provider/fallback. | `degraded` si repetido. |

## Lectura de readiness

- `ready`: API y Mongo estan arriba, Temporal esta arriba y Ollama responde.
- `degraded`: API y Mongo estan arriba, pero Temporal u Ollama no estan disponibles. Hermes puede responder, pero con capacidades reducidas.
- `not_ready`: Mongo no esta disponible o el API no puede atender operacion completa.

