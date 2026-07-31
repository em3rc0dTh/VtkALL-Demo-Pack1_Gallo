import { validateTemporalAddress } from '../config/env';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const extractHost = (address: string) => {
  if (address.startsWith('[')) {
    const closingBracket = address.indexOf(']');
    return closingBracket >= 0 ? address.slice(1, closingBracket) : address;
  }

  const lastColon = address.lastIndexOf(':');
  return lastColon >= 0 ? address.slice(0, lastColon) : address;
};

export const getTemporalConnectionOptions = (address = validateTemporalAddress()) => {
  const host = extractHost(address);

  return {
    address,
    ...(LOOPBACK_HOSTS.has(host)
      ? {
          // Prevent grpc-js from honoring proxy env vars for local Temporal.
          channelArgs: {
            'grpc.enable_http_proxy': 0,
          },
        }
      : {}),
  };
};
