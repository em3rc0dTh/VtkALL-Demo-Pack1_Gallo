import { turaguaPrompt } from './turagua.prompt.js';
import { bateylatePrompt } from './bateylate.prompt.js';
import { repairDemoPrompt } from './repairDemo.prompt.js';

export const verticalPrompts = Object.freeze({
  turagua: turaguaPrompt,
  bateylate: bateylatePrompt,
  'repair-demo': repairDemoPrompt
});
