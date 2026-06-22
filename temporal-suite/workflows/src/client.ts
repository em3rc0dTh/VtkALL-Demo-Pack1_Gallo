// src/client.ts
// Cliente: script para iniciar un nuevo workflow de aprobación de pedido.
// Ejecuta: npm run start-workflow

import { Client, Connection } from '@temporalio/client';
import { aprobacionPedidoWorkflow } from './workflows';
import type { Pedido } from './activities';

async function main() {
    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });

    // Datos del pedido de ejemplo
    const pedido: Pedido = {
        id: `PED-${Date.now()}`,
        cliente: 'Empresa ABC',
        producto: 'Licencia Software Anual',
        monto: 4500,
        moneda: 'USD',
    };

    console.log(`\n🚀 Iniciando workflow para pedido: ${pedido.id}`);
    console.log(`   Cliente:  ${pedido.cliente}`);
    console.log(`   Producto: ${pedido.producto}`);
    console.log(`   Monto:    ${pedido.monto} ${pedido.moneda}\n`);

    const handle = await client.workflow.start(aprobacionPedidoWorkflow, {
        taskQueue: 'pedidos',
        workflowId: `aprobacion-${pedido.id}`,  // ID único — permite re-conectarse a él
        args: [pedido],
    });

    console.log(`✅ Workflow iniciado!`);
    console.log(`   Workflow ID: ${handle.workflowId}`);
    console.log(`   Run ID:      ${handle.firstExecutionRunId}`);
    console.log(`\n🌐 Ver en la UI: http://localhost:8080/namespaces/default/workflows/${handle.workflowId}`);
    console.log(`\n⏳ El workflow está esperando aprobación (máx 48h).`);
    console.log(`   Para aprobar: npm run approve ${handle.workflowId}`);
    console.log(`   Para rechazar: npm run reject ${handle.workflowId}\n`);

    await connection.close();
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
