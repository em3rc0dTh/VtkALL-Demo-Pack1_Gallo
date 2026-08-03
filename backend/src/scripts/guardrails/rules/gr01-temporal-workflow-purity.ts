import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr01TemporalWorkflowPurity: GuardrailRule = {
  id: 'GR-01',
  name: 'Temporal Workflow purity',
  run: (context) => {
    const workflowFiles = context.files.filter((file) => file.path.includes('backend/src/temporal/workflows/'));
    const forbidden = (specifier: string) =>
      /mongoose|mongodb|\/models\/|backend\/src\/models|\/db\/|\/controllers?\/|\/routes?\//i.test(specifier) ||
      /^(fs|path|http|https|axios|node:fs|node:path)$/.test(specifier) ||
      /xmlrpc|jsonrpc|odoo/i.test(specifier);
    const violations = workflowFiles.flatMap((file) =>
      importViolations(
        file,
        forbidden,
        (specifier) => `GR-01 violation: Temporal Workflow imports persistence or infrastructure code (${specifier}). Workflows may orchestrate Activities only.`
      )
    );
    return result('GR-01', 'Temporal Workflow purity', 'Workflow files must stay deterministic and infrastructure-free.', violations);
  },
};
