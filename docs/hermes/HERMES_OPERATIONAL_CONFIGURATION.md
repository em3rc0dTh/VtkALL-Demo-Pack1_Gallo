# HERMES-12 Operational Configuration

Estado canonico para demo estable de Hermes.

## Valores aceptados

| Variable | Proposito | Valor aceptado | Default | Impacto operativo | Requiere reinicio | Riesgo de modificar |
| --- | --- | --- | --- | --- | --- | --- |
| `HERMES_MODEL_INTERPRETATION_TIMEOUT_MS` | Limite para interpretar un turno. | `15000` | `15000` | Evita esperas largas del modelo. | Si | Muy bajo aumenta fallback; muy alto bloquea turnos. |
| `HERMES_MODEL_COMPOSITION_TIMEOUT_MS` | Limite para redactar respuesta final. | `10000` | `10000` | Controla latencia visible. | Si | Muy bajo vuelve rigida la respuesta; muy alto demora UI. |
| `HERMES_MODEL_OLLAMA_NUM_PREDICT` | Maximo de tokens generados por Ollama. | `256` | `256` | Balance entre JSON valido y latencia. | Si | Reducirlo produjo `invalid_json`; subirlo aumenta latencia. |
| `HERMES_MODEL_OLLAMA_NUM_CTX` | Context window de Ollama. | vacio/default | vacio/default | Usa el default del modelo. | Si | Forzarlo puede recargar modelo y degradar latencia. |
| `HERMES_MODEL_CIRCUIT_FAILURE_THRESHOLD` | Fallas antes de abrir circuit breaker. | `3` | `3` | Evita repetir llamadas fallidas. | Si | Muy bajo degrada antes de tiempo; muy alto repite esperas. |
| `HERMES_MODEL_CIRCUIT_COOLDOWN_MS` | Tiempo antes de half-open. | `30000` | `30000` | Permite recuperacion gradual. | Si | Muy bajo causa reintentos constantes; muy alto retrasa recuperacion. |
| `HERMES_MODEL_METRICS_LOG_EVERY` | Frecuencia de resumen de metricas. | `20` | `20` | Controla ruido de logs. | Si | Muy bajo genera logs excesivos. |
| `HERMES_CONTEXT_MAX_HISTORY_MESSAGES` | Historial reciente enviado al modelo. | `8` | `8` | Mantiene continuidad sin inflar prompt. | Si | Muy bajo pierde hilo; muy alto sube latencia. |
| `HERMES_CONTEXT_MAX_MEMORY_FACTS` | Facts persistentes enviados al modelo. | `8` | `8` | Mantiene memoria util. | Si | Muy bajo olvida; muy alto mete ruido. |
| `HERMES_CONTEXT_MAX_CATALOG_OFFERINGS` | Servicios incluidos por turno. | `5` | `5` | Reduce catalogo enviado al modelo. | Si | Muy bajo puede ocultar servicios relevantes. |
| `HERMES_CONTEXT_MAX_OFFERING_DESCRIPTION_CHARS` | Tamano por descripcion de servicio. | `220` | `220` | Compacta catalogo. | Si | Muy bajo pierde detalle; muy alto sube tokens. |
| `HERMES_CONTEXT_MAX_INTERPRETATION_CHARS` | Presupuesto de contexto para interpretacion. | `12000` | `12000` | Limita entrada al modelo. | Si | Muy bajo rompe comprension; muy alto aumenta latencia. |
| `HERMES_CONTEXT_MAX_COMPOSITION_CHARS` | Presupuesto de contexto para composicion. | `9000` | `9000` | Limita respuesta final asistida. | Si | Muy bajo vuelve respuesta pobre; muy alto aumenta latencia. |
| `HERMES_OLLAMA_WARMUP_ENABLED` | Ejecutar warm-up al iniciar API. | `true` | `true` | Reduce primer turno frio. | Si | Desactivarlo aumenta latencia inicial. |
| `HERMES_OLLAMA_WARMUP_TIMEOUT_MS` | Limite del warm-up. | `20000` | `20000` | Warm-up no bloquea API. | Si | Muy bajo puede fallar sin calentar modelo. |
| `HERMES_OLLAMA_KEEP_ALIVE` | Mantener modelo cargado. | `30m` | `30m` | Retiene memoria para bajar latencia. | Si | Muy alto consume RAM; muy bajo enfria el modelo. |
| `HERMES_MODEL_MAX_CONCURRENT` | Inferencias Ollama simultaneas. | `1` | `1` | Protege CPU/RAM local. | Si | Subirlo puede saturar maquina. |
| `HERMES_MODEL_MAX_QUEUE` | Inferencias en espera. | `4` | `4` | Controla backlog local. | Si | Muy bajo causa fallback rapido; muy alto acumula espera. |
| `HERMES_MODEL_QUEUE_WAIT_MS` | Espera maxima en cola. | `2000` | `2000` | Evita que usuarios esperen por Ollama. | Si | Muy bajo usa fallback frecuente; muy alto empeora latencia. |

## Fuentes alineadas

Estos valores deben mantenerse alineados en:

- `.env.example`
- `backend/.env.example`
- `docker-compose.yml`

No copiar secretos reales a ejemplos ni documentacion.

## Validacion al inicio

El API valida al iniciar:

- timeouts mayores a cero;
- circuit threshold mayor o igual a uno;
- cooldown mayor a cero;
- concurrencia mayor o igual a uno;
- cola y espera mayores o iguales a cero;
- limites de historial, facts y catalogo mayores o iguales a cero;
- presupuestos de caracteres mayores a cero;
- `num_predict` mayor a cero cuando esta definido;
- `keep_alive` con formato aceptado por Ollama;
- `OLLAMA_URL` como URL HTTP(S);
- modelo no vacio.

Si la configuracion Hermes es invalida, el startup falla explicitamente con el nombre de la variable y sin exponer secretos.

