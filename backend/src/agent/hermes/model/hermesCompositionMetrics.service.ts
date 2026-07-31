type HermesCompositionTurnMetric = {
  conversationId?: string;
  correlationId?: string;
  attempted: boolean;
  succeeded: boolean;
  timedOut: boolean;
  rejectedByGate: boolean;
  fallbackUsed: boolean;
  repairUsed: boolean;
  latencyMs?: number;
  retryUsed: boolean;
};

const metrics: HermesCompositionTurnMetric[] = [];
const MAX_METRICS = 500;

const percentile = (values: number[], ratio: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
};

export const getHermesCompositionMetricsSnapshot = () => {
  const totalTurns = metrics.length;
  const attempted = metrics.filter((entry) => entry.attempted).length;
  const succeeded = metrics.filter((entry) => entry.succeeded).length;
  const timedOut = metrics.filter((entry) => entry.timedOut).length;
  const rejectedByGate = metrics.filter((entry) => entry.rejectedByGate).length;
  const fallbackUsed = metrics.filter((entry) => entry.fallbackUsed).length;
  const repairUsed = metrics.filter((entry) => entry.repairUsed).length;
  const retryUsed = metrics.filter((entry) => entry.retryUsed).length;
  const latencies = metrics.map((entry) => entry.latencyMs || 0).filter((value) => value > 0);
  return {
    totalTurns,
    composition_attempted: attempted,
    composition_succeeded: succeeded,
    composition_timed_out: timedOut,
    composition_rejected_by_gate: rejectedByGate,
    fallback_used: fallbackUsed,
    repair_used: repairUsed,
    retry_used: retryUsed,
    completionRate: attempted ? succeeded / attempted : 0,
    fallbackRate: totalTurns ? fallbackUsed / totalTurns : 0,
    timeoutRate: attempted ? timedOut / attempted : 0,
    gateRejectionRate: attempted ? rejectedByGate / attempted : 0,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    p99: percentile(latencies, 0.99),
  };
};

export const recordHermesCompositionTurnMetric = (metric: HermesCompositionTurnMetric) => {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) metrics.shift();
  console.log('[hermes-composition] turn.completed', {
    ...metric,
    snapshot: getHermesCompositionMetricsSnapshot(),
  });
};
