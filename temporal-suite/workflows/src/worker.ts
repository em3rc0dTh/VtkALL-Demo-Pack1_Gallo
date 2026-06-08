// src/worker.ts
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
    // NativeConnection es la forma correcta de configurar la conexión en el Worker
    const connection = await NativeConnection.connect({
        address: 'localhost:7233',
    });

    const worker = await Worker.create({
        connection,
        workflowsPath: require.resolve('./workflows'),
        activities,
        taskQueue: 'pedidos',
    });

    console.log('🟢 Worker iniciado. Escuchando cola: pedidos');
    console.log('📡 Conectado a Temporal en localhost:7233');
    console.log('⌨️  Presiona Ctrl+C para detener\n');

    await worker.run();
}

main().catch((err) => {
    console.error('❌ Error en el worker:', err);
    process.exit(1);
});
