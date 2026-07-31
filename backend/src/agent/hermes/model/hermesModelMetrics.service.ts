import {
  HermesModelCircuitState,
  HermesModelOutcome,
  HermesModelProvider,
  HermesModelStage,
} from './hermesModelOutcome';
import { HermesContextBudgetStats } from '../context/hermesContextBudget.service';
import { HermesInferenceRuntimeMetrics } from './hermesInferenceRuntime.service';

type HermesModelMetric = {
  provider: HermesModelProvider;
  model: string;
  stage: HermesModelStage;
  outcome: HermesModelOutcome;
  latencyMs: number;
  timeoutMs: number;
  attemptNumber: number;
  fallbackUsed: boolean;
  conversationId?: string;
  correlationId?: string;
  messageId?: string;
  circuitState: HermesModelCircuitState;
  inputCharacterCount?: number;
  historyMessageCount?: number;
  outputCharacterCount?: number;
  contextStats?: HermesContextBudgetStats;
  inferenceRuntime?: HermesInferenceRuntimeMetrics;
};

const metrics: HermesModelMetric[] = [];
const MAX_METRICS = 500;
let callsSinceSnapshot = 0;

const percentile = (values: number[], ratio: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
};

const increment = (target: Record<string, number>, key: string | undefined) => {
  const safeKey = key || 'unknown';
  target[safeKey] = (target[safeKey] || 0) + 1;
};

const stageSnapshot = (stage: HermesModelStage) => {
  const entries = metrics.filter((entry) => entry.stage === stage);
  const totalCalls = entries.length;
  const successfulCalls = entries.filter((entry) => entry.outcome === 'ok').length;
  const fallbackCalls = entries.filter((entry) => entry.fallbackUsed).length;
  const timeoutCalls = entries.filter((entry) => entry.outcome === 'timeout').length;
  const latencies = entries.map((entry) => entry.latencyMs).filter((value) => Number.isFinite(value));
  const outcomes: Record<string, number> = {};
  for (const entry of entries) increment(outcomes, entry.outcome);
  return {
    totalCalls,
    successfulCalls,
    fallbackCalls,
    timeoutCalls,
    successRate: totalCalls ? successfulCalls / totalCalls : 0,
    fallbackRate: totalCalls ? fallbackCalls / totalCalls : 0,
    timeoutRate: totalCalls ? timeoutCalls / totalCalls : 0,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    p99: percentile(latencies, 0.99),
    outcomes,
  };
};

export const getHermesModelMetricsSnapshot = () => {
  const totalCalls = metrics.length;
  const successfulCalls = metrics.filter((entry) => entry.outcome === 'ok').length;
  const fallbackCalls = metrics.filter((entry) => entry.fallbackUsed).length;
  const latencies = metrics.map((entry) => entry.latencyMs).filter((value) => Number.isFinite(value));
  const outcomes: Record<string, number> = {};
  const providers: Record<string, number> = {};
  const models: Record<string, number> = {};
  const stages: Record<string, number> = {};

  for (const entry of metrics) {
    increment(outcomes, entry.outcome);
    increment(providers, entry.provider);
    increment(models, entry.model);
    increment(stages, entry.stage);
  }

  return {
    totalCalls,
    successfulCalls,
    fallbackCalls,
    successRate: totalCalls ? successfulCalls / totalCalls : 0,
    fallbackRate: totalCalls ? fallbackCalls / totalCalls : 0,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
    p99: percentile(latencies, 0.99),
    outcomes,
    providers,
    models,
    stages,
    byStage: {
      turn_interpretation: stageSnapshot('turn_interpretation'),
      reply_composition: stageSnapshot('reply_composition'),
    },
  };
};

export const recordHermesModelMetric = (metric: HermesModelMetric) => {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) metrics.shift();

  console.log('[hermes-model] call.completed', {
    provider: metric.provider,
    model: metric.model,
    stage: metric.stage,
    outcome: metric.outcome,
    latencyMs: metric.latencyMs,
    timeoutMs: metric.timeoutMs,
    attemptNumber: metric.attemptNumber,
    fallbackUsed: metric.fallbackUsed,
    conversationId: metric.conversationId,
    correlationId: metric.correlationId,
    messageId: metric.messageId,
    circuitState: metric.circuitState,
    inputCharacterCount: metric.inputCharacterCount,
    historyMessageCount: metric.historyMessageCount,
    outputCharacterCount: metric.outputCharacterCount,
    rawContextCharacterCount: metric.contextStats?.rawContextCharacterCount,
    finalContextCharacterCount: metric.contextStats?.finalContextCharacterCount,
    estimatedInputTokens: metric.contextStats?.estimatedInputTokens,
    historyMessagesIncluded: metric.contextStats?.historyMessagesIncluded,
    historyMessagesDropped: metric.contextStats?.historyMessagesDropped,
    memoryFactsIncluded: metric.contextStats?.memoryFactsIncluded,
    memoryFactsDropped: metric.contextStats?.memoryFactsDropped,
    catalogOfferingsIncluded: metric.contextStats?.catalogOfferingsIncluded,
    catalogOfferingsDropped: metric.contextStats?.catalogOfferingsDropped,
    contextReductionPercent: metric.contextStats?.contextReductionPercent,
    totalDurationMs: metric.inferenceRuntime?.totalDurationMs,
    loadDurationMs: metric.inferenceRuntime?.loadDurationMs,
    promptEvalCount: metric.inferenceRuntime?.promptEvalCount,
    promptEvalDurationMs: metric.inferenceRuntime?.promptEvalDurationMs,
    evalCount: metric.inferenceRuntime?.evalCount,
    evalDurationMs: metric.inferenceRuntime?.evalDurationMs,
    queueWaitMs: metric.inferenceRuntime?.queueWaitMs,
    coldStart: metric.inferenceRuntime?.coldStart,
    keepAliveApplied: metric.inferenceRuntime?.keepAliveApplied,
    concurrentRequests: metric.inferenceRuntime?.concurrentRequests,
    queueDepth: metric.inferenceRuntime?.queueDepth,
    activeInferenceCount: metric.inferenceRuntime?.activeInferenceCount,
    maxConcurrent: metric.inferenceRuntime?.maxConcurrent,
    runtimeReason: metric.inferenceRuntime?.runtimeReason,
  });

  callsSinceSnapshot += 1;
  const snapshotEvery = Number(process.env.HERMES_MODEL_METRICS_LOG_EVERY || 20);
  if (Number.isFinite(snapshotEvery) && snapshotEvery > 0 && callsSinceSnapshot >= snapshotEvery) {
    callsSinceSnapshot = 0;
    console.log('[hermes-model] metrics.snapshot', getHermesModelMetricsSnapshot());
  }
};
