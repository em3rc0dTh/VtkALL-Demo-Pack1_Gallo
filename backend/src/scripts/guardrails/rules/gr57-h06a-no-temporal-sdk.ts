import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr57H06ANoTemporalSdk: GuardrailRule = {
  id: 'GR-57',
  name: 'Hermes scheduling cannot import Temporal SDK',
  run: (context) => {
    const files = context.files.filter((file) => file.path.startsWith('backend/src/agent/hermes/scheduling/'));
    const violations = files.flatMap((file) =>
      contentViolations(file, /from\s+['"][^'"]*@temporalio\/|from\s+['"](?![^'"]*mcp\/temporal\/schemas\/)[^'"]*temporal\//i, 'GR-57 violation: Hermes scheduling cannot import Temporal SDK.')
    );
    return result('GR-57', 'Hermes scheduling cannot import Temporal SDK', 'H06A scheduling layer remains outside Temporal SDK imports.', violations);
  },
};
