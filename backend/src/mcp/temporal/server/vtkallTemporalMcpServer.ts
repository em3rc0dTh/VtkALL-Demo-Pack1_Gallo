import { temporalAgentBridge } from '../temporalAgentBridge';
import {
  ContinueScheduleConsultationInput,
  GetScheduleConsultationContextInput,
  StartScheduleConsultationInput,
} from '../schemas/agentProcessContext';

export type TemporalMcpToolName =
  | 'start_schedule_consultation'
  | 'continue_schedule_consultation'
  | 'get_schedule_consultation_context';

const allowedTools: TemporalMcpToolName[] = [
  'start_schedule_consultation',
  'continue_schedule_consultation',
  'get_schedule_consultation_context',
];

const assertObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('MCP tool arguments must be an object.');
  }
  return value as Record<string, unknown>;
};

export class VtkallTemporalMcpServer {
  readonly tools = allowedTools;

  async execute(toolName: TemporalMcpToolName, rawArguments: unknown) {
    if (!allowedTools.includes(toolName)) {
      throw new Error(`MCP tool is not allowed: ${toolName}`);
    }

    const args = assertObject(rawArguments);

    if (toolName === 'start_schedule_consultation') {
      if (!args.businessSlug || !args.conversationId) {
        throw new Error('businessSlug and conversationId are required.');
      }
      return temporalAgentBridge.startScheduleConsultation({
        businessSlug: String(args.businessSlug),
        conversationId: String(args.conversationId),
        offeringId: args.offeringId ? String(args.offeringId) : undefined,
        customerMessage: args.customerMessage ? String(args.customerMessage) : undefined,
      } satisfies StartScheduleConsultationInput);
    }

    if (toolName === 'continue_schedule_consultation') {
      if (!args.workflowId || !args.action) {
        throw new Error('workflowId and action are required.');
      }
      const action = String(args.action);
      if (!['submit_offering_selection', 'submit_customer_information', 'submit_date_preference', 'submit_slot_selection', 'cancel_process'].includes(action)) {
        throw new Error(`Customer process action is not allowed: ${action}`);
      }
      return temporalAgentBridge.continueScheduleConsultation({
        workflowId: String(args.workflowId),
        conversationId: args.conversationId ? String(args.conversationId) : undefined,
        action: action as ContinueScheduleConsultationInput['action'],
        data: args.data && typeof args.data === 'object' ? args.data as Record<string, unknown> : {},
      });
    }

    if (toolName === 'get_schedule_consultation_context') {
      if (!args.workflowId) {
        throw new Error('workflowId is required.');
      }
      return temporalAgentBridge.getScheduleConsultationContext({
        workflowId: String(args.workflowId),
      } satisfies GetScheduleConsultationContextInput);
    }

    throw new Error(`Unhandled MCP tool: ${toolName}`);
  }
}

export const vtkallTemporalMcpServer = new VtkallTemporalMcpServer();
