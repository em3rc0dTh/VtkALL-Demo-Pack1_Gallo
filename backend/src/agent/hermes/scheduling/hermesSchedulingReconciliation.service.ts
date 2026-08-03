import { AgentProcessContext } from '../../../mcp/temporal/schemas/agentProcessContext';
import { agentCapabilityGateway } from '../../capabilities/agentCapabilityGateway';
import { SchedulingExecutionResult } from './hermesSchedulingExecution.contract';

type ReconcileInput = {
  businessSlug: string;
  conversationId: string;
  expectedAction: SchedulingExecutionResult['action'];
  correlationId: string;
  workflowId?: string;
  reason: unknown;
};

const semanticError = (code: string, message: string, retryable = true) => ({
  code,
  message,
  retryable,
});

const appointmentBookedFromContext = (processContext?: AgentProcessContext) => {
  const rawState: any = processContext?.rawState || {};
  return String(processContext?.process?.status || '') === 'APPOINTMENT_BOOKED'
    && Boolean(rawState.appointment?.reservation?._id)
    && Boolean(rawState.appointment?.appointment?._id);
};

export const reconcileHermesSchedulingExecution = async (
  input: ReconcileInput
): Promise<Pick<SchedulingExecutionResult, 'outcome' | 'workflow' | 'processContext' | 'error'>> => {
  const resolvedWorkflowId = input.workflowId || await agentCapabilityGateway.resolveActiveProcess({
    businessSlug: input.businessSlug,
    conversationId: input.conversationId,
  });

  if (!resolvedWorkflowId) {
    return {
      outcome: 'EXECUTION_UNKNOWN',
      workflow: {
        workflowId: undefined,
        started: input.expectedAction === 'START_SCHEDULE_CONSULTATION',
        reused: false,
      },
      error: semanticError('TEMPORAL_EXECUTION_UNKNOWN', 'Could not prove whether the scheduling command advanced.'),
    };
  }

  let processContext: AgentProcessContext | undefined;
  try {
    processContext = await agentCapabilityGateway.getProcessContext({ workflowId: resolvedWorkflowId });
  } catch {
    return {
      outcome: 'EXECUTION_UNKNOWN',
      workflow: {
        workflowId: resolvedWorkflowId,
        started: input.expectedAction === 'START_SCHEDULE_CONSULTATION',
        reused: input.expectedAction !== 'START_SCHEDULE_CONSULTATION',
      },
      error: semanticError('TEMPORAL_EXECUTION_UNKNOWN', 'Could not read authoritative ProcessContext after dispatch.'),
    };
  }

  if (input.expectedAction === 'SUBMIT_SLOT_SELECTION') {
    if (appointmentBookedFromContext(processContext)) {
      return {
        outcome: 'EXECUTED',
        workflow: {
          workflowId: resolvedWorkflowId,
          started: false,
          reused: true,
        },
        processContext,
        error: undefined,
      };
    }

    const bookedDocs = await agentCapabilityGateway.findBookedArtifactsByWorkflow({
      businessSlug: input.businessSlug,
      workflowId: resolvedWorkflowId,
    });
    if (bookedDocs) {
      return {
        outcome: 'EXECUTED',
        workflow: {
          workflowId: resolvedWorkflowId,
          started: false,
          reused: true,
        },
        processContext,
        error: undefined,
      };
    }
  }

  return {
    outcome: 'EXECUTED',
    workflow: {
      workflowId: resolvedWorkflowId,
      started: input.expectedAction === 'START_SCHEDULE_CONSULTATION',
      reused: input.expectedAction !== 'START_SCHEDULE_CONSULTATION',
    },
    processContext,
    error: undefined,
  };
};
