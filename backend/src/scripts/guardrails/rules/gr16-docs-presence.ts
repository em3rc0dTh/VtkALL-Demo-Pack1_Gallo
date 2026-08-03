import { GuardrailRule, result } from '../ruleTypes';
import { violation } from './shared';

const requiredDocs = [
  'docs/README.md',
  'docs/architecture/BACKEND_GUARDRAIL_RULES.md',
  'docs/architecture/ADR-001.md',
  'docs/architecture/ADR-002.md',
  'docs/contracts/ContractMK1 (2).md',
  'docs/data-model/DATA_MODEL_VTKALL_DataModel-0_v3_timeslots.md',
  'docs/use-cases/USE_CASES_VTKALL_DEMO_PACK_1_2.md',
  'docs/reviews/BACKEND_CURRENT_STATE_AUDIT.md',
];

export const gr16DocsPresence: GuardrailRule = {
  id: 'GR-16',
  name: 'Documentation presence',
  run: (context) => {
    const violations = requiredDocs
      .filter((doc) => !context.hasFile(doc))
      .map((doc) => violation(doc, `GR-16 violation: required canonical architecture document mapping is missing: ${doc}.`));
    const readme = context.getFile('docs/README.md');
    for (const canonical of ['ADR-001', 'ADR-002', 'ContractMK1', 'Data Model v3', 'Use Cases', 'Backend Current State Audit', 'Backend Guardrail Rules']) {
      if (!readme?.content.includes(canonical)) violations.push(violation('docs/README.md', `GR-16 violation: docs index must map ${canonical}.`));
    }
    return result('GR-16', 'Documentation presence', 'Canonical architecture references are present and indexed.', violations);
  },
};
