import crypto from 'crypto';
import { WorkflowHandle } from '@temporalio/client';
import { getTemporalClient } from '../temporal/client';
import { ScheduleConsultationWorkflow } from '../temporal/workflows/scheduleConsultation.workflow';
import { ScheduleConsultationState, TASK_QUEUE } from '../temporal/types';

const getHandle = async (workflowId: string): Promise<WorkflowHandle> => {
  const client = await getTemporalClient();
  return client.workflow.getHandle(workflowId);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getWorkflowState = async (workflowId: string): Promise<ScheduleConsultationState> => {
  const handle = await getHandle(workflowId);
  return handle.query('getScheduleConsultationState');
};

export const getWorkflowProcessContext = async (workflowId: string) => {
  const handle = await getHandle(workflowId);
  return handle.query('getScheduleConsultationProcessContext');
};

export const waitForStateChange = async (workflowId: string, previousStatus?: string) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const state = await getWorkflowState(workflowId);
    if (!previousStatus || state.status !== previousStatus || ['APPOINTMENT_BOOKED', 'FAILED_SLOT_UNAVAILABLE', 'CANCELLED'].includes(state.status)) {
      return state;
    }
    await sleep(250);
  }
  return getWorkflowState(workflowId);
};

export const waitForWorkflowReady = async (workflowId: string) => {
  for (let attempt = 0; attempt < 40; attempt++) {
    const state = await getWorkflowState(workflowId);
    if (state.status !== 'CATALOG_REQUESTED' || state.catalog.length > 0) {
      return state;
    }
    await sleep(250);
  }
  return getWorkflowState(workflowId);
};

export const waitForSlotReservation = async (workflowId: string) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const state = await getWorkflowState(workflowId);
    if (state.status !== 'SLOT_SELECTED') {
      return state;
    }
    await sleep(250);
  }
  return getWorkflowState(workflowId);
};

export const startScheduleConsultation = async (businessSlug: string) => {
  if (!businessSlug) {
    throw new Error('businessSlug is required to start ScheduleConsultationWorkflow.');
  }

  const client = await getTemporalClient();
  const workflowId = `schedule-consultation-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await client.workflow.start(ScheduleConsultationWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [{ businessSlug, agentRole: 'manual' }],
  });

  return waitForWorkflowReady(workflowId);
};

export const signalWorkflow = async (workflowId: string, signalName: string, payload?: any) => {
  const before = await getWorkflowState(workflowId);
  const handle = await getHandle(workflowId);
  await handle.signal(signalName, payload);
  if (signalName === 'selectSlot') {
    return waitForSlotReservation(workflowId);
  }
  return waitForStateChange(workflowId, before.status);
};
