// demo.ts — Demo interactivo del flujo completo de PaymentRequest
// Inicia la PR y avanza por TODOS los estados con pausas para que
// puedas ver cada transición en http://localhost:8080 en tiempo real.

import { Client, Connection } from '@temporalio/client';
import {
    paymentRequestWorkflow,
    aprobarSignal,
    autorizarSignal,
    pagarSignal,
    rechazarSignal,
    estadoQuery,
} from './workflow';
import type { PaymentRequest } from './types';

// ─── Helpers visuales ────────────────────────────────────────────────────────

function banner(texto: string, emoji = '▶') {
    const linea = '─'.repeat(60);
    console.log(`\n${linea}`);
    console.log(`  ${emoji}  ${texto}`);
    console.log(`${linea}`);
}

function esperando(segundos: number, accion: string): Promise<void> {
    return new Promise((resolve) => {
        let restante = segundos;
        const interval = setInterval(() => {
            process.stdout.write(`\r  ⏳ Avanzando a [${accion}] en ${restante}s... (revisa la UI ahora)`);
            restante--;
            if (restante < 0) {
                clearInterval(interval);
                process.stdout.write('\n');
                resolve();
            }
        }, 1000);
    });
}

// ─── DEMO PRINCIPAL ──────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║   🎬  DEMO: Flujo completo de PaymentRequest             ║');
    console.log('║                                                          ║');
    console.log('║   Abre la UI en: http://localhost:8080                   ║');
    console.log('║   Ve a Workflows → verás la solicitud aparecer          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });

    // ── Datos del pedido de ejemplo ──────────────────────────────────────────
    const prId = `PR-${Date.now()}`;
    const pr: PaymentRequest = {
        _id: prId,
        tenantId: 'tenant-godigital-001',
        projectId: 'proj-construccion-torre-a',
        projectName: 'Torre A — Construcción Fase 2',
        providerId: 'entity-constructora-del-norte',
        providerName: 'Constructora del Norte S.A.C.',
        subtotal: 42_372.88,
        tax: 7_627.12,
        total: 50_000.00,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        dueDate: '2026-03-15',
        notes: 'Pago por avance de obra mes de marzo — Hito 3: estructura metálica completa',
        status: 'pending',
        createdBy: 'user-carlos-gomez',
        createdByName: 'Carlos Gómez',
        createdByEmail: 'carlos.gomez@godigital.app',
        projectOwnerEmail: 'maria.rodriguez@godigital.app',
        projectOwnerName: 'María Rodríguez',
        attachments: [
            'https://storage.godigital.app/attachments/factura-CN-0234.pdf',
            'https://storage.godigital.app/attachments/avance-obra-foto.zip',
        ],
    };

    // ── PASO 1: Iniciar workflow ─────────────────────────────────────────────
    banner(`PASO 1/5 — Creando Payment Request`, '📋');
    console.log(`  ID:        ${pr._id}`);
    console.log(`  Proyecto:  ${pr.projectName}`);
    console.log(`  Proveedor: ${pr.providerName}`);
    console.log(`  Total:     ${pr.currency} ${pr.total.toLocaleString()}`);
    console.log(`  Creado por: ${pr.createdByName}`);

    const handle = await client.workflow.start(paymentRequestWorkflow, {
        taskQueue: 'payment-requests',
        workflowId: `payment-request-${prId}`,
        args: [pr],
        searchAttributes: {
            // Permite buscar este workflow por proyecto en la UI
        },
    });

    const uiUrl = `http://localhost:8080/namespaces/default/workflows/${handle.workflowId}`;
    console.log(`\n  ✅ Workflow iniciado!`);
    console.log(`  🌐 Ver en UI: ${uiUrl}`);
    console.log(`\n  Estado actual: PENDING`);
    console.log(`  → El proyecto owner recibió email "Acción Requerida: Aprobar"`);

    // ── PASO 2: Aprobar ───────────────────────────────────────────────────────
    await esperando(8, 'APPROVED');
    banner(`PASO 2/5 — Aprobando la solicitud`, '✅');

    await handle.signal(aprobarSignal, {
        userId: 'user-maria-rodriguez',
        userName: 'María Rodríguez (Project Owner)',
        notes: 'Verificado con el informe de avance de obra. Aprobado según presupuesto Q1 2026.',
    });

    const estadoAprobado = await handle.query(estadoQuery);
    console.log(`  Estado actual: ${estadoAprobado.status.toUpperCase()}`);
    console.log(`  Aprobado por: ${estadoAprobado.aprobacion?.userName}`);
    console.log(`  Notas: ${estadoAprobado.aprobacion?.notes}`);

    // ── PASO 3: Autorizar ─────────────────────────────────────────────────────
    await esperando(8, 'AUTHORIZED');
    banner(`PASO 3/5 — Autorizando y asignando fecha de pago`, '🔐');

    await handle.signal(autorizarSignal, {
        userId: 'user-maria-rodriguez',
        userName: 'María Rodríguez (Project Owner)',
        paymentDate: '2026-03-10',
        bankAccountId: 'account-bcp-usd-001',
        bankAccountName: 'BCP — Cuenta Corriente USD ****4521',
        notes: 'Transferencia programada vía BCP. Referencia: TRF-2026-0310-001',
    });

    const estadoAutorizado = await handle.query(estadoQuery);
    console.log(`  Estado actual: ${estadoAutorizado.status.toUpperCase()}`);
    console.log(`  Autorizado por: ${estadoAutorizado.autorizacion?.userName}`);
    console.log(`  Fecha de pago: ${estadoAutorizado.autorizacion?.paymentDate}`);
    console.log(`  Cuenta débito: ${estadoAutorizado.autorizacion?.bankAccountName}`);

    // ── PASO 4: Pagar ─────────────────────────────────────────────────────────
    await esperando(8, 'PAID');
    banner(`PASO 4/5 — Procesando pago con comprobante`, '💸');

    await handle.signal(pagarSignal, {
        userId: 'user-maria-rodriguez',
        userName: 'María Rodríguez (Project Owner)',
        paymentProof: 'https://storage.godigital.app/vouchers/TRF-2026-0310-001-comprobante.pdf',
        notes: 'Transferencia confirmada por BCP. ITF descontado. Neto transferido: USD 49,975.00',
    });

    // ── PASO 5: Resultado final ───────────────────────────────────────────────
    await esperando(5, 'resultado final');
    banner(`PASO 5/5 — Resultado final`, '🏁');

    const estadoFinal = await handle.result();

    console.log(`\n  ┌─────────────────────────────────────────────────┐`);
    console.log(`  │  PAYMENT REQUEST COMPLETADA ✅                   │`);
    console.log(`  ├─────────────────────────────────────────────────┤`);
    console.log(`  │  ID:        ${estadoFinal.pr._id.padEnd(36)} │`);
    console.log(`  │  Estado:    ${estadoFinal.status.toUpperCase().padEnd(36)} │`);
    console.log(`  │  Total:     USD 50,000.00                        │`);
    console.log(`  │  Proveedor: Constructora del Norte S.A.C.        │`);
    console.log(`  ├─────────────────────────────────────────────────┤`);
    console.log(`  │  Historial de estados:                           │`);
    estadoFinal.history.forEach((h) => {
        const linea = `  ${h.status.padEnd(12)} ${h.timestamp.slice(11, 19)}  ${h.actor ?? ''}`;
        console.log(`  │  ${linea.padEnd(47)} │`);
    });
    console.log(`  └─────────────────────────────────────────────────┘`);
    console.log(`\n  🌐 Ver timeline completo en la UI:`);
    console.log(`     ${uiUrl}\n`);

    await connection.close();
}

// ─── MODO ALTERNATIVO: solo rechazar ────────────────────────────────────────
// Para probar el flujo de rechazo, descomenta y ejecuta reject-demo.ts

main().catch((err) => {
    console.error('\n❌ Error en el demo:', err.message);
    if (err.message?.includes('7233')) {
        console.error('   → Verifica que Temporal esté corriendo: sudo docker compose up -d');
    }
    if (err.message?.includes('payment-requests')) {
        console.error('   → Verifica que el worker esté corriendo: npm run pr:worker');
    }
    process.exit(1);
});
