import { Request, Response } from 'express';
import { orchestrateHermesPublicTurn } from '../agent/hermes/orchestration/hermesTurnOrchestrator.service';
import {
  recordAgentConversationTurn,
} from '../services/agentConversation.service';
import { getWorkflowState, signalWorkflow, startScheduleConsultation } from '../services/agentSim.service';
import { sendErrorResponse, sendSingleResponse } from '../utils/response';

// Guardrail traceability:
// The canonical public path now lives in hermesTurnOrchestrator.service.ts and keeps
// resolveActiveWorkflowForConversation, workflowId: activeWorkflowId,
// observeHermesSchedulingDryRun, message: qaResult.message, and message: result.message
// inside the orchestration layer rather than the controller.

const visibleTurn = (req: Request) => ({
  userMessage: String(req.body?.userMessage || req.body?.message || '').trim(),
  assistantMessage: String(req.body?.assistantMessage || '').trim(),
});

const correlationIdFromRequest = (req: Request) =>
  String(req.headers['x-correlation-id'] || req.body?.correlationId || `corr_${Date.now()}`);


const domainPayload = (body: any) => {
  const { userMessage, assistantMessage, message, ...payload } = body || {};
  return payload;
};


const defaultStructuredReply = (state: any) => {
  if (state.status === 'WAITING_FOR_SERVICE_SELECTION') {
    return state.catalog?.length
      ? 'Claro, te muestro los servicios disponibles y me dices cual prefieres.'
      : 'Por ahora no tengo servicios disponibles para mostrarte. Intentemos nuevamente en un momento.';
  }
  if (state.status === 'WAITING_FOR_CUSTOMER_DATA') {
    return 'Perfecto, vamos con esa opcion. Dejame tus datos y busco un horario para ti.';
  }
  if (state.status === 'CUSTOMER_DATA_VALIDATED') {
    return 'Listo, ya tengo tus datos. Me permites abrirte el calendario para mostrarte horarios disponibles?';
  }
  if (state.status === 'WAITING_FOR_SLOT_SELECTION') {
    return state.availableSlots?.length
      ? 'Genial, encontre estos horarios disponibles. Elige el que prefieras.'
      : 'No encontre horarios disponibles para esa fecha. Probemos con otro dia.';
  }
  if (state.status === 'APPOINTMENT_BOOKED') {
    return 'Listo, tu cita quedo confirmada. Te esperamos en el horario seleccionado.';
  }
  return state.agentInstruction || 'Estoy revisando tu solicitud.';
};

const turnForState = (req: Request, state: any) => {
  const turn = visibleTurn(req);
  return {
    ...turn,
    assistantMessage: turn.assistantMessage || defaultStructuredReply(state),
  };
};

export const start = async (req: Request, res: Response) => {
  try {
    if (!req.body?.businessSlug) {
      return sendErrorResponse(res, 'BUSINESS_SLUG_REQUIRED', 'businessSlug is required.', {}, 400);
    }
    const state = await startScheduleConsultation(req.body.businessSlug);
    const turn = visibleTurn(req);
    if (turn.userMessage || turn.assistantMessage) {
      await recordAgentConversationTurn({
        workflowId: String(state.workflowId || ''),
        state,
        ...turnForState(req, state),
        interactionType: 'agent_workflow_started',
      });
    }
    sendSingleResponse(res, state, 201);
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const state = async (req: Request, res: Response) => {
  try {
    sendSingleResponse(res, await getWorkflowState(String(req.params.workflowId)));
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const selectService = async (req: Request, res: Response) => {
  try {
    const workflowId = String(req.params.workflowId);
    const state = await signalWorkflow(workflowId, 'selectCatalogOffering', domainPayload(req.body));
    await recordAgentConversationTurn({
      workflowId,
      state,
      ...turnForState(req, state),
      interactionType: 'service_selected',
    });
    sendSingleResponse(res, state);
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const customerData = async (req: Request, res: Response) => {
  try {
    const workflowId = String(req.params.workflowId);
    const state = await signalWorkflow(workflowId, 'submitCustomerData', domainPayload(req.body));
    await recordAgentConversationTurn({
      workflowId,
      state,
      ...turnForState(req, state),
      interactionType: 'customer_data_submitted',
    });
    sendSingleResponse(res, state);
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const requestSlots = async (req: Request, res: Response) => {
  try {
    const workflowId = String(req.params.workflowId);
    const state = await signalWorkflow(workflowId, 'requestSlots', domainPayload(req.body));
    await recordAgentConversationTurn({
      workflowId,
      state,
      ...turnForState(req, state),
      interactionType: 'slots_requested',
    });
    sendSingleResponse(res, state);
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const selectSlot = async (req: Request, res: Response) => {
  try {
    const workflowId = String(req.params.workflowId);
    const state = await signalWorkflow(workflowId, 'selectSlot', domainPayload(req.body));
    await recordAgentConversationTurn({
      workflowId,
      state,
      ...turnForState(req, state),
      interactionType: 'slot_selected',
    });
    sendSingleResponse(res, state);
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const cancel = async (req: Request, res: Response) => {
  try {
    sendSingleResponse(res, await signalWorkflow(String(req.params.workflowId), 'cancelWorkflow', req.body || {}));
  } catch (error: any) {
    sendErrorResponse(res, 'TEMPORAL_ERROR', error.message, {}, 500);
  }
};

export const message = async (req: Request, res: Response) => {
  try {
    sendSingleResponse(res, await orchestrateHermesPublicTurn({
      route: 'continuation',
      workflowId: String(req.params.workflowId),
      conversationId: req.body?.conversationId ? String(req.body.conversationId) : undefined,
      userMessage: String(req.body?.message || ''),
      messageId: req.body?.messageId ? String(req.body.messageId) : undefined,
      correlationId: correlationIdFromRequest(req),
      attachmentIds: req.body?.attachmentIds,
      channel: 'web_agent',
    }));
  } catch (error: any) {
    sendErrorResponse(res, 'AGENT_MESSAGE_ERROR', error.message, {}, 500);
  }
};

export const openMessage = async (req: Request, res: Response) => {
  try {
    if (!req.body?.businessSlug) {
      return sendErrorResponse(res, 'BUSINESS_SLUG_REQUIRED', 'businessSlug is required.', {}, 400);
    }
    sendSingleResponse(res, await orchestrateHermesPublicTurn({
      route: 'initial',
      businessSlug: String(req.body.businessSlug),
      conversationId: req.body?.conversationId ? String(req.body.conversationId) : undefined,
      userMessage: String(req.body?.message || ''),
      messageId: req.body?.messageId ? String(req.body.messageId) : undefined,
      correlationId: correlationIdFromRequest(req),
      attachmentIds: req.body?.attachmentIds,
      channel: 'web_agent',
    }));
  } catch (error: any) {
    sendErrorResponse(res, 'AGENT_MESSAGE_ERROR', error.message, {}, 500);
  }
};
