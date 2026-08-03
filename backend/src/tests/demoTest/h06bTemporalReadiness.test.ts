import { TASK_QUEUE } from '../../temporal/types';
import {
  TEMPORAL_NAMESPACE,
  createTemporalClient,
  describeNamespace,
  runTemporalProbe,
  summarizeChecks,
} from './h06bTemporalUtils';

const run = async () => {
  const checks = [];
  let probe: Awaited<ReturnType<typeof runTemporalProbe>> | undefined;
  let address = '';

  try {
    const connectionBundle = await createTemporalClient();
    address = connectionBundle.address;
    checks.push({ name: 'address format', passed: true, detail: address });
    checks.push({ name: 'tcp connection', passed: true });
    checks.push({ name: 'temporal client connection', passed: true });

    const namespace = await describeNamespace(connectionBundle.connection);
    checks.push({
      name: 'namespace access',
      passed: String(namespace?.namespaceInfo?.name || '') === TEMPORAL_NAMESPACE,
      code: String(namespace?.namespaceInfo?.name || '') === TEMPORAL_NAMESPACE ? undefined : 'TEMPORAL_NAMESPACE_UNAVAILABLE',
      detail: String(namespace?.namespaceInfo?.name || ''),
    });
    await connectionBundle.connection.close();

    probe = await runTemporalProbe();
    checks.push({
      name: 'task queue verification',
      passed: TASK_QUEUE === 'vtkall-demo-test-schedule-consultation',
      code: TASK_QUEUE === 'vtkall-demo-test-schedule-consultation' ? undefined : 'TEMPORAL_TASK_QUEUE_MISMATCH',
      detail: TASK_QUEUE,
    });
    checks.push({
      name: 'workflow start probe',
      passed: !!probe.workflowId,
      code: probe.workflowId ? undefined : 'TEMPORAL_WORKFLOW_NOT_REGISTERED',
      detail: probe.workflowId,
    });
    checks.push({
      name: 'worker accepted workflow',
      passed: probe.initialStatus === 'WAITING_FOR_SERVICE_SELECTION',
      code: probe.initialStatus === 'WAITING_FOR_SERVICE_SELECTION' ? undefined : 'TEMPORAL_WORKER_NOT_RUNNING',
      detail: probe.initialStatus,
    });
    checks.push({
      name: 'process context query',
      passed: probe.processContext.workflowType === 'schedule_consultation'
        && probe.processContext.awaitingType === 'offering_selection'
        && probe.processContext.allowedActions.includes('submit_offering_selection'),
      detail: JSON.stringify(probe.processContext),
    });
    checks.push({
      name: 'workflow cleanup',
      passed: ['COMPLETED', 'CANCELLED'].includes(probe.workflowStatusAfterCleanup) && probe.terminalStatus === 'CANCELLED',
      detail: `${probe.terminalStatus}/${probe.workflowStatusAfterCleanup}`,
    });
    checks.push({
      name: 'temporal residue',
      passed: probe.readinessPrefixRunningCount === 0,
      detail: `runningPrefix=${probe.readinessPrefixRunningCount}`,
    });
    checks.push({
      name: 'appointment residue',
      passed: probe.residue.appointments === 0,
      detail: String(probe.residue.appointments),
    });
    checks.push({
      name: 'resource reservation residue',
      passed: probe.residue.resourceReservations === 0,
      detail: String(probe.residue.resourceReservations),
    });
    checks.push({
      name: 'mongo residue',
      passed: Object.values(probe.residue).every((value) => value === 0),
      detail: JSON.stringify(probe.residue),
    });
  } catch (error: any) {
    const message = String(error?.message || error);
    const code = /^Invalid TEMPORAL_ADDRESS/.test(message)
      ? 'TEMPORAL_ADDRESS_HAS_SCHEME'
      : /ECONNREFUSED|ENOTFOUND|No connection established|TCP timeout/i.test(message)
        ? 'TEMPORAL_HOST_UNREACHABLE'
        : /namespace/i.test(message)
          ? 'TEMPORAL_NAMESPACE_UNAVAILABLE'
          : /workflow/i.test(message)
            ? 'TEMPORAL_WORKFLOW_NOT_REGISTERED'
            : 'TEMPORAL_CONNECTION_FAILED';

    checks.push({
      name: 'temporal readiness fatal',
      passed: false,
      code,
      detail: message,
    });
  }

  const summary = summarizeChecks(checks);
  console.log(JSON.stringify({
    ...summary,
    temporalAddress: address || undefined,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TASK_QUEUE,
    probe,
  }, null, 2));
  if (!summary.ok) process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
