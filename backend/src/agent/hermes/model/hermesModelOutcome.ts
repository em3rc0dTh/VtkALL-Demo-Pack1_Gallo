export type HermesModelOutcome =
  | 'ok'
  | 'timeout'
  | 'rate_limited'
  | 'connection_error'
  | 'provider_error'
  | 'invalid_json'
  | 'schema_validation_failed'
  | 'empty_response'
  | 'circuit_open';

export type HermesModelStage =
  | 'turn_interpretation'
  | 'reply_composition';

export type HermesModelProvider = 'ollama' | 'gemini';

export type HermesModelCircuitState = 'closed' | 'open' | 'half_open';
