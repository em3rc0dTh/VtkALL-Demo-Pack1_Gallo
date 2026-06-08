// worker.ts — Worker del Cash Request Workflow
import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
    const connection = await NativeConnection.connect({
        address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
    });

    const worker = await Worker.create({
        connection,
        workflowsPath: require.resolve('./workflow'),
        activities,
        taskQueue: 'cash-requests',
        maxConcurrentActivityTaskExecutions: 10,
        maxConcurrentWorkflowTaskExecutions: 5,
    });

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   🟢  Worker CashRequest iniciado                ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║   📋  Task Queue : cash-requests                 ║');
    console.log('║   📡  Temporal   : localhost:7233                ║');
    console.log('║   🌐  UI         : http://localhost:8080         ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    await worker.run();
}

main().catch((err) => {
    console.error('❌ Worker CashRequest error:', err);
    process.exit(1);
});
