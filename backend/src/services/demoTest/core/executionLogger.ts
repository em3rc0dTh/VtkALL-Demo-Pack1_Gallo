import { ExecutionContext } from './ExecutionContext';
import { SemanticError } from './SemanticError';
import { toSemanticError } from './errorSerialization';

export const logExecutionError = (message: string, error: unknown, context: ExecutionContext) => {
  const semanticError: SemanticError = toSemanticError(error);
  console.error(JSON.stringify({
    level: 'error',
    message,
    correlationId: context.correlationId,
    causationId: context.causationId,
    businessSlug: context.businessSlug,
    caseId: context.caseId,
    workflowId: context.workflowId,
    activityId: context.activityId,
    errorCode: semanticError.code,
    operation: context.metadata?.operation,
  }));
};
