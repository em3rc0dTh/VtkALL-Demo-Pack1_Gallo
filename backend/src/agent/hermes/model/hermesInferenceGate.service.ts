type GateLease = {
  acquired: true;
  queueWaitMs: number;
  queueDepth: number;
  activeInferenceCount: number;
  maxConcurrent: number;
  release: () => void;
};

type GateRejected = {
  acquired: false;
  reason: 'queue_unavailable' | 'queue_timeout';
  queueWaitMs: number;
  queueDepth: number;
  activeInferenceCount: number;
  maxConcurrent: number;
};

type GateWaiter = {
  resolve: (lease: GateLease) => void;
  reject: (rejection: GateRejected) => void;
  startedAt: number;
  timeout: NodeJS.Timeout;
};

let activeInferenceCount = 0;
const queue: GateWaiter[] = [];

const numericEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const maxConcurrent = () => numericEnv(process.env.HERMES_MODEL_MAX_CONCURRENT, 1);
const maxQueue = () => numericEnv(process.env.HERMES_MODEL_MAX_QUEUE, 4);
const queueWaitMs = () => numericEnv(process.env.HERMES_MODEL_QUEUE_WAIT_MS, 2000);

const makeLease = (startedAt: number): GateLease => {
  activeInferenceCount += 1;
  let released = false;
  return {
    acquired: true,
    queueWaitMs: Date.now() - startedAt,
    queueDepth: queue.length,
    activeInferenceCount,
    maxConcurrent: maxConcurrent(),
    release: () => {
      if (released) return;
      released = true;
      activeInferenceCount = Math.max(0, activeInferenceCount - 1);
      const next = queue.shift();
      if (!next) return;
      clearTimeout(next.timeout);
      next.resolve(makeLease(next.startedAt));
    },
  };
};

export const acquireHermesInferenceGate = async (): Promise<GateLease | GateRejected> => {
  const startedAt = Date.now();
  if (activeInferenceCount < maxConcurrent()) return makeLease(startedAt);

  if (queue.length >= maxQueue()) {
    return {
      acquired: false,
      reason: 'queue_unavailable',
      queueWaitMs: 0,
      queueDepth: queue.length,
      activeInferenceCount,
      maxConcurrent: maxConcurrent(),
    };
  }

  return new Promise((resolve) => {
    const waiter: GateWaiter = {
      startedAt,
      resolve,
      reject: resolve,
      timeout: setTimeout(() => {
        const index = queue.indexOf(waiter);
        if (index >= 0) queue.splice(index, 1);
        resolve({
          acquired: false,
          reason: 'queue_timeout',
          queueWaitMs: Date.now() - startedAt,
          queueDepth: queue.length,
          activeInferenceCount,
          maxConcurrent: maxConcurrent(),
        });
      }, queueWaitMs()),
    };
    queue.push(waiter);
  });
};

export const getHermesInferenceGateSnapshot = () => ({
  activeInferenceCount,
  queueDepth: queue.length,
  maxConcurrent: maxConcurrent(),
  maxQueue: maxQueue(),
  queueWaitMs: queueWaitMs(),
});
