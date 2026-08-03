import {
  HermesModelCircuitState,
  HermesModelOutcome,
  HermesModelProvider,
} from './hermesModelOutcome';

type CircuitEntry = {
  state: HermesModelCircuitState;
  consecutiveFailures: number;
  openedAt?: number;
  halfOpenProbeInFlight?: boolean;
};

const circuits = new Map<string, CircuitEntry>();

const keyFor = (provider: HermesModelProvider, model: string) => `${provider}:${model}`;

const failureThreshold = () => {
  const parsed = Number(process.env.HERMES_MODEL_CIRCUIT_FAILURE_THRESHOLD);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
};

const cooldownMs = () => {
  const parsed = Number(process.env.HERMES_MODEL_CIRCUIT_COOLDOWN_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
};

const openingOutcomes = new Set<HermesModelOutcome>([
  'timeout',
  'rate_limited',
  'connection_error',
  'provider_error',
]);

const entryFor = (provider: HermesModelProvider, model: string) => {
  const key = keyFor(provider, model);
  const existing = circuits.get(key);
  if (existing) return existing;
  const created: CircuitEntry = { state: 'closed', consecutiveFailures: 0 };
  circuits.set(key, created);
  return created;
};

export const getHermesModelCircuitState = (
  provider: HermesModelProvider,
  model: string
): HermesModelCircuitState => entryFor(provider, model).state;

export const shouldAllowHermesModelCall = (provider: HermesModelProvider, model: string) => {
  const entry = entryFor(provider, model);
  if (entry.state === 'closed') return { allowed: true, state: entry.state };
  if (entry.state === 'half_open') {
    if (entry.halfOpenProbeInFlight) return { allowed: false, state: entry.state };
    entry.halfOpenProbeInFlight = true;
    return { allowed: true, state: entry.state };
  }

  const elapsed = Date.now() - Number(entry.openedAt || 0);
  if (elapsed >= cooldownMs()) {
    entry.state = 'half_open';
    entry.halfOpenProbeInFlight = true;
    return { allowed: true, state: entry.state };
  }
  return { allowed: false, state: entry.state };
};

export const recordHermesModelCircuitOutcome = (input: {
  provider: HermesModelProvider;
  model: string;
  outcome: HermesModelOutcome;
}) => {
  const entry = entryFor(input.provider, input.model);
  entry.halfOpenProbeInFlight = false;

  if (input.outcome === 'ok') {
    if (entry.state !== 'closed' || entry.consecutiveFailures > 0) {
      console.log('[hermes-model] circuit.closed', {
        provider: input.provider,
        model: input.model,
        previousState: entry.state,
      });
    }
    entry.state = 'closed';
    entry.consecutiveFailures = 0;
    entry.openedAt = undefined;
    return entry.state;
  }

  if (!openingOutcomes.has(input.outcome)) return entry.state;

  entry.consecutiveFailures += 1;
  if (entry.state === 'half_open' || entry.consecutiveFailures >= failureThreshold()) {
    entry.state = 'open';
    entry.openedAt = Date.now();
    console.warn('[hermes-model] circuit.opened', {
      provider: input.provider,
      model: input.model,
      consecutiveFailures: entry.consecutiveFailures,
      cooldownMs: cooldownMs(),
    });
  }
  return entry.state;
};

export const getHermesModelCircuitSnapshot = () =>
  [...circuits.entries()].map(([key, entry]) => ({
    key,
    state: entry.state,
    consecutiveFailures: entry.consecutiveFailures,
    openedAt: entry.openedAt,
  }));
