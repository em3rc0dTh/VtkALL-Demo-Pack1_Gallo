import { AgentDecision } from '../runtime/agentDecision';

export const parseDecisionJson = (text: string | undefined): AgentDecision | undefined => {
  if (!text) return undefined;
  const trimmed = text.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return undefined;

  const parsed = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== 'object') return undefined;

  const decision = {
    reply: typeof parsed.reply === 'string' ? parsed.reply : undefined,
    intent: parsed.intent && typeof parsed.intent.name === 'string'
      ? {
        name: parsed.intent.name,
        confidence: Number(parsed.intent.confidence || 0),
      }
      : undefined,
    actions: Array.isArray(parsed.actions)
      ? parsed.actions
        .filter((action: any) => action && typeof action.capability === 'string')
        .map((action: any) => ({
          capability: action.capability,
          arguments: action.arguments && typeof action.arguments === 'object' ? action.arguments : {},
        }))
      : undefined,
    extractedData: parsed.extractedData && typeof parsed.extractedData === 'object' ? parsed.extractedData : undefined,
  };

  const hasReply = Boolean(decision.reply?.trim());
  const hasIntent = Boolean(decision.intent?.name);
  const hasActions = Boolean(decision.actions?.length);
  const hasExtractedData = Boolean(decision.extractedData && Object.keys(decision.extractedData).length);

  return hasReply || hasIntent || hasActions || hasExtractedData ? decision : undefined;
};
