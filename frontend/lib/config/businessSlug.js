export const DEFAULT_PUBLIC_BUSINESS_SLUG =
  process.env.NEXT_PUBLIC_DEMO_TEST_BUSINESS_SLUG || 'demo_test';

export const flowStorageKey = `${DEFAULT_PUBLIC_BUSINESS_SLUG}_flow`;

export const agentConversationStorageKey = (businessSlug) =>
  `agent_conversation_${businessSlug || DEFAULT_PUBLIC_BUSINESS_SLUG}`;
