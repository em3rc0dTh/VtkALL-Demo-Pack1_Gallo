// worker.ts — Worker del PaymentRequest
import 'dotenv/config';   // ← carga .env antes de todo (SMTP, TEMPORAL_ADDRESS, etc.)
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
        taskQueue: 'payment-requests',
        maxConcurrentActivityTaskExecutions: 10,
        maxConcurrentWorkflowTaskExecutions: 5,
    });

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   🟢  Worker PaymentRequest iniciado             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║   📋  Task Queue : payment-requests              ║');
    console.log('║   📡  Temporal   : localhost:7233                ║');
    console.log('║   🌐  UI         : http://localhost:8080         ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    await worker.run();
}

main().catch((err) => {
    console.error('❌ Worker error:', err);
    process.exit(1);
});
