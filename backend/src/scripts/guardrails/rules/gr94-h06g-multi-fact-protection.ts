import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

export const gr94H06GMultiFactProtection: GuardrailRule = {
  id: 'GR-94',
  name: 'H06G protects extracted and known facts',
  run: (context) => {
    const test = context.getFile('backend/src/agent/hermes/tests/h06gOrchestration.test.ts');
    const orchestrator = context.getFile('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts');
    const violations = [];

    if (!orchestrator?.content.includes('type HermesTurnPlan = {')) {
      violations.push(violation('backend/src/agent/hermes/orchestration/hermesTurnOrchestrator.service.ts', 'GR-94 violation: canonical orchestrator must define an internal turn plan.'));
    }

    if (!test?.content.includes("customerData?.firstName")) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-94 violation: H06G multi-fact test must assert firstName preservation.'));
    }

    if (!test?.content.includes('selected offering was not preserved')) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-94 violation: H06G multi-fact test must assert offering preservation.'));
    }

    if (!test?.content.includes('orchestrator repeated the known first name') || !test?.content.includes('already known service')) {
      violations.push(violation('backend/src/agent/hermes/tests/h06gOrchestration.test.ts', 'GR-94 violation: H06G multi-fact test must reject repeated questions for known facts.'));
    }

    return result('GR-94', 'H06G protects extracted and known facts', 'H06G preserves multi-fact input and avoids re-asking known data.', violations);
  },
};
