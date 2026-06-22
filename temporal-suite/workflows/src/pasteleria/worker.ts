import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function main() {
    const connection = await NativeConnection.connect({
        address: 'localhost:7233',
    });

    const worker = await Worker.create({
        connection,
        workflowsPath: require.resolve('./workflows'),
        activities,
        taskQueue: 'pasteleria-pedidos',
    });

    console.log('🍰 Worker de Pastelería iniciado. Escuchando cola: pasteleria-pedidos');
    console.log('📡 Conectado a Temporal en localhost:7233');
    console.log('⌨️  Presiona Ctrl+C para detener\n');

    await worker.run();
}

main().catch((err) => {
    console.error('❌ Error en el worker de pastelería:', err);
    process.exit(1);
});
