import net from 'net';
import { validateTemporalAddress } from '../../../config/env';
import { getMongoOperationalStatus } from '../../../services/hermesOperationalPersistence.service';
import { getHermesInferenceGateSnapshot } from '../model/hermesInferenceGate.service';
import { getInferenceRuntimeSnapshot, ollamaBaseUrl } from '../model/hermesInferenceRuntime.service';
import { getHermesModelCircuitSnapshot } from '../model/hermesModelCircuitBreaker.service';

export type HermesOperationalReadiness = {
  status: 'ready' | 'degraded' | 'not_ready';
  api: 'up' | 'down';
  mongo: 'up' | 'down';
  temporal: 'up' | 'down' | 'unknown';
  ollama: 'up' | 'down' | 'warming' | 'unknown';
  modelCircuit?: 'closed' | 'open' | 'half_open';
  inferenceGate?: {
    active: number;
    queued: number;
    maxConcurrent: number;
  };
  fallbackAvailable: boolean;
  timestamp: string;
};

const tcpCheck = (host: string, port: number, timeoutMs = 800): Promise<'up' | 'down'> =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs }, () => {
      socket.destroy();
      resolve('up');
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve('down');
    });
    socket.on('error', () => resolve('down'));
  });

const temporalStatus = async (): Promise<'up' | 'down' | 'unknown'> => {
  try {
    const address = validateTemporalAddress();
    const [host, portText] = address.split(':');
    const port = Number(portText);
    if (!host || !Number.isFinite(port)) return 'unknown';
    return tcpCheck(host, port);
  } catch {
    return 'unknown';
  }
};

const ollamaStatus = async (): Promise<'up' | 'down' | 'warming' | 'unknown'> => {
  const baseUrl = ollamaBaseUrl();
  if (!baseUrl) return 'unknown';
  const runtime = getInferenceRuntimeSnapshot();
  if (runtime.warmupStarted && (runtime.lastWarmup as any)?.outcome !== 'ok') return 'warming';
  try {
    const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(800) });
    return response.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
};

const dominantCircuitState = () => {
  const snapshots = getHermesModelCircuitSnapshot();
  if (snapshots.some((entry) => entry.state === 'open')) return 'open';
  if (snapshots.some((entry) => entry.state === 'half_open')) return 'half_open';
  return 'closed';
};

export const getHermesOperationalReadiness = async (): Promise<HermesOperationalReadiness> => {
  const mongo = getMongoOperationalStatus();
  const [temporal, ollama] = await Promise.all([temporalStatus(), ollamaStatus()]);
  const gate = getHermesInferenceGateSnapshot();
  const fallbackAvailable = true;

  let status: HermesOperationalReadiness['status'] = 'ready';
  if (mongo === 'down') status = 'not_ready';
  else if (temporal !== 'up' || ollama !== 'up') status = 'degraded';

  return {
    status,
    api: 'up',
    mongo,
    temporal,
    ollama,
    modelCircuit: dominantCircuitState(),
    inferenceGate: {
      active: gate.activeInferenceCount,
      queued: gate.queueDepth,
      maxConcurrent: gate.maxConcurrent,
    },
    fallbackAvailable,
    timestamp: new Date().toISOString(),
  };
};
