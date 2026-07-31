import { TASK_QUEUE } from '../../temporal/types';
import { runTemporalProbe, summarizeChecks } from './h06bTemporalUtils';

const run = async () => {
  const checks = [];

  try {
    const probe = await runTemporalProbe();

    checks.push({
      name: 'task queue canonical value',
      passed: TASK_QUEUE === 'vtkall-demo-test-schedule-consultation',
      code: TASK_QUEUE === 'vtkall-demo-test-schedule-consultation' ? undefined : 'TEMPORAL_TASK_QUEUE_MISMATCH',
      detail: TASK_QUEUE,
    });
    checks.push({
      name: 'workflow accepted by worker',
      passed: !!probe.workflowId && probe.initialStatus === 'WAITING_FOR_SERVICE_SELECTION',
      code: !!probe.workflowId && probe.initialStatus === 'WAITING_FOR_SERVICE_SELECTION'
        ? undefined
        : 'TEMPORAL_WORKER_NOT_RUNNING',
      detail: `${probe.workflowId}:${probe.initialStatus}`,
    });
    checks.push({
      name: 'workflow registration',
      passed: probe.processContext.workflowType === 'schedule_consultation',
      code: probe.processContext.workflowType === 'schedule_consultation' ? undefined : 'TEMPORAL_WORKFLOW_NOT_REGISTERED',
      detail: String(probe.processContext.workflowType || ''),
    });
    checks.push({
      name: 'workflow cleanup terminal',
      passed: ['COMPLETED', 'CANCELLED'].includes(probe.workflowStatusAfterCleanup),
      detail: probe.workflowStatusAfterCleanup,
    });
  } catch (error: any) {
    checks.push({
      name: 'temporal worker status',
      passed: false,
      code: 'TEMPORAL_WORKER_NOT_RUNNING',
      detail: String(error?.message || error),
    });
  }

  const summary = summarizeChecks(checks);
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
