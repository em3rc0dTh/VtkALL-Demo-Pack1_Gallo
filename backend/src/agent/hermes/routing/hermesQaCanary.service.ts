import crypto from 'crypto';

export const getHermesQaCanaryConfig = () => {
  const percent = Number(process.env.HERMES_QA_CANARY_PERCENT || '0');
  return {
    enabled: process.env.HERMES_QA_VISIBLE_ENABLED === 'true',
    percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, Math.trunc(percent))) : 0,
    failOpen: process.env.HERMES_QA_FAIL_OPEN !== 'false',
    requireNoActiveProcess: process.env.HERMES_QA_REQUIRE_NO_ACTIVE_PROCESS !== 'false',
    maxReplyChars: Number(process.env.HERMES_QA_MAX_REPLY_CHARS || '3000'),
  };
};

export const stableCanaryBucket = (businessSlug: string, conversationId: string) => {
  const digest = crypto.createHash('sha256').update(`${businessSlug}:${conversationId}`).digest();
  return digest.readUInt32BE(0) % 100;
};

export const isInHermesQaCanary = (businessSlug: string, conversationId: string, percent: number) => {
  if (percent <= 0) return false;
  if (percent >= 100) return true;
  return stableCanaryBucket(businessSlug, conversationId) < percent;
};

