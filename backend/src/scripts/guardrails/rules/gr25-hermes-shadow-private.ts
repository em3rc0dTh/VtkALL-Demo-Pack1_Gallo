import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations } from './shared';

export const gr25HermesShadowPrivate: GuardrailRule = {
  id: 'GR-25',
  name: 'Shadow result cannot enter public response DTO',
  run: (context) => {
    const controllerFiles = context.files.filter((file) => file.path.startsWith('backend/src/controllers/'));
    const violations = controllerFiles.flatMap((file) =>
      contentViolations(file, /agentClientPayload\([\s\S]{0,500}hermesReply|sendSingleResponse\([\s\S]{0,500}hermesReply/i, 'GR-25 violation: hermesReply must not enter public DTO.')
    );
    return result('GR-25', 'Shadow result cannot enter public response DTO', 'Public controller responses do not expose Hermes shadow text.', violations);
  },
};
