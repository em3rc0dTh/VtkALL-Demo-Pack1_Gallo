// src/signal-reject.ts
// Envía una señal de RECHAZO a un workflow que está esperando.
// Uso: npm run reject <workflowId>

import { Client, Connection } from '@temporalio/client';
import { rechazarSignal } from './workflows';

async function main() {
    const workflowId = process.argv[2];
    if (!workflowId) {
        console.error('❌ Falta el Workflow ID\n   Uso: npm run reject <workflowId>');
        process.exit(1);
    }

    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });

    const handle = client.workflow.getHandle(workflowId);

    console.log(`\n🔴 Enviando rechazo para: ${workflowId}`);
    await handle.signal(rechazarSignal, {
        aprobadorId: 'gerente-001',
        motivo: 'Presupuesto insuficiente para este mes.',
    });

    console.log('✅ Señal de rechazo enviada!\n');
    console.log(`🌐 Ver resultado: http://localhost:8080/namespaces/default/workflows/${workflowId}\n`);

    await connection.close();
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
