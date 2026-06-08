// src/signal-approve.ts
// Envía una señal de APROBACIÓN a un workflow que está esperando.
// Uso: npm run approve <workflowId>

import { Client, Connection } from '@temporalio/client';
import { aprobarSignal } from './workflows';

async function main() {
    const workflowId = process.argv[2];
    if (!workflowId) {
        console.error('❌ Falta el Workflow ID\n   Uso: npm run approve <workflowId>');
        process.exit(1);
    }

    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });

    const handle = client.workflow.getHandle(workflowId);

    console.log(`\n🟢 Enviando aprobación para: ${workflowId}`);
    await handle.signal(aprobarSignal, {
        aprobadorId: 'gerente-001',
        comentario: 'Aprobado. Proceder con el pedido.',
    });

    console.log('✅ Señal de aprobación enviada!\n');
    console.log(`🌐 Ver resultado: http://localhost:8080/namespaces/default/workflows/${workflowId}\n`);

    await connection.close();
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
