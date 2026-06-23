import { getActiveVerticalConfig } from './verticalConfigService.js';
import { verticalPrompts } from '../prompts/verticals/index.js';

export const getPromptByKey = (promptKey) => verticalPrompts[promptKey] || verticalPrompts.turagua;

export const getActivePrompt = () => {
  const config = getActiveVerticalConfig();
  return getPromptByKey(config.promptKey);
};
