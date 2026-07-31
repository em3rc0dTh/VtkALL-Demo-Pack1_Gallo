import { NativeConnection, Worker } from '@temporalio/worker';
import { validateTemporalAddress } from '../config/env';
import { connectDB, disconnectDB } from '../db/connect';
import * as activities from './activities/scheduleConsultation.activities';
import { TASK_QUEUE } from './types';

const run = async () => {
  const address = validateTemporalAddress();
  await connectDB();
  const connection = await NativeConnection.connect({ address });
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: TASK_QUEUE,
    workflowsPath: require.resolve('./workflows/scheduleConsultation.workflow'),
    activities,
  });

  console.log(`Temporal worker listening on ${TASK_QUEUE} via ${address}`);
  try {
    await worker.run();
  } finally {
    await disconnectDB();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
