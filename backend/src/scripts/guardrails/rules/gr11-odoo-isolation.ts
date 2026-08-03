import { GuardrailRule, result } from '../ruleTypes';
import { contentViolations, isDocumentation } from './shared';

export const gr11OdooIsolation: GuardrailRule = {
  id: 'GR-11',
  name: 'Odoo isolation',
  run: (context) => {
    const files = context.files.filter((file) =>
      !isDocumentation(file) &&
      !file.path.includes('backend/src/scripts/guardrails/') &&
      !/platform\/adapters\/odoo|integrations\/odoo-adapter/.test(file.path)
    );
    const violations = files.flatMap((file) =>
      contentViolations(file, /(?:from\s+['"][^'"]*(?:xmlrpc|jsonrpc|odoo)|require\([^)]*(?:xmlrpc|jsonrpc|odoo)|res\.partner|sale\.order|product\.template)/i, 'GR-11 violation: direct Odoo/XML-RPC/JSON-RPC access must live only in an explicit adapter path.')
    );
    return result('GR-11', 'Odoo isolation', 'No direct Odoo integration outside future adapter boundaries.', violations);
  },
};
