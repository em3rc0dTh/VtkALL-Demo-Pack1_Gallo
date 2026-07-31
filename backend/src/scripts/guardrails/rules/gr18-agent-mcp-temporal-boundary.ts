import { GuardrailRule, result } from '../ruleTypes';
import { importViolations } from './shared';

export const gr18AgentMcpTemporalBoundary: GuardrailRule = {
  id: 'GR-18',
  name: 'Agent MCP Temporal boundary',
  run: (context) => {
    const agentRuntimeFiles = context.files.filter((file) => file.path.includes('backend/src/agent/runtime/'));
    const mcpFiles = context.files.filter((file) => file.path.includes('backend/src/mcp/'));
    const workflowFiles = context.files.filter((file) => file.path.includes('backend/src/temporal/workflows/'));

    const runtimeViolations = agentRuntimeFiles.flatMap((file) => [
      ...importViolations(file, (specifier) => specifier.includes('/models/') || specifier.includes('backend/src/models'), (specifier) =>
        `GR-18 violation: Agent Runtime must not import Mongoose models (${specifier}).`
      ),
      ...importViolations(file, (specifier) =>
        specifier.includes('/mcp/') ||
        specifier.includes('agentSim.service') ||
        specifier.includes('/temporal/workflows/') ||
        specifier.includes('/temporal/client'),
      (specifier) =>
        `GR-18 violation: Agent Runtime must use AgentCapabilityGateway for process capabilities, not ${specifier}.`
      ),
    ]);

    const mcpViolations = mcpFiles.flatMap((file) =>
      importViolations(file, (specifier) => specifier.includes('/models/') || specifier.includes('backend/src/models'), (specifier) =>
        `GR-18 violation: MCP boundary must not import Mongoose models (${specifier}).`
      )
    );

    const workflowViolations = workflowFiles.flatMap((file) =>
      importViolations(file, (specifier) =>
        specifier.includes('/mcp/') ||
        specifier.includes('/agent/providers/') ||
        specifier.includes('gemini') ||
        specifier.includes('ollama'),
      (specifier) => `GR-18 violation: Temporal workflows must not import MCP or AI provider code (${specifier}).`)
    );

    const rawToolExposure = mcpFiles.flatMap((file) => {
      const violations = [];
      const forbidden = ['temporal.start_workflow', 'temporal.signal_workflow', 'temporal.query_workflow', 'temporal.update_workflow'];
      for (const term of forbidden) {
        if (file.content.includes(term)) {
          violations.push({
            file: file.path,
            message: `GR-18 violation: MCP must not expose unrestricted Temporal primitive ${term}.`,
            evidence: term,
          });
        }
      }
      return violations;
    });

    return result(
      'GR-18',
      'Agent MCP Temporal boundary',
      'Agent Runtime uses MCP for Temporal, MCP exposes semantic tools only, workflows do not import MCP/AI code.',
      [...runtimeViolations, ...mcpViolations, ...workflowViolations, ...rawToolExposure]
    );
  },
};
