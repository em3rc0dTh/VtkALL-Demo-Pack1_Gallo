// worker.ts — Worker de Solicitud de Devolución
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
        taskQueue: 'devoluciones',
    });

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║   🟢  Worker Solicitud Devolución iniciado        ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log('║   📋  Task Queue : devoluciones                   ║');
    console.log('║   📡  Temporal   : localhost:7233                 ║');
    console.log('║   🌐  UI         : http://localhost:8080          ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    await worker.run();
}

main().catch((err) => {
    console.error('❌ Worker error:', err);
    process.exit(1);
});
