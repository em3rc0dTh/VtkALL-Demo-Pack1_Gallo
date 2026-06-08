// demo.ts — Demo de Solicitud de Devolución (ambos casos)
// Ejecuta 2 workflows en secuencia:
//   1. REEMBOLSO:  empresa pagó de MENOS → debe dar más al trabajador
//   2. DEVOLUCIÓN: empresa pagó de MÁS  → trabajador devuelve excedente

import { Client, Connection } from '@temporalio/client';
import {
    solicitudDevolucionWorkflow,
    aprobarDevolucionSignal,
    completarDevolucionSignal,
    estadoDevolucionQuery,
} from './workflow';
import type { SolicitudDevolucion } from './types';

// ─── Helpers visuales ────────────────────────────────────────────────────────

function banner(texto: string, subtitulo = '') {
    const ancho = 62;
    const linea = '═'.repeat(ancho);
    console.log(`\n╔${linea}╗`);
    console.log(`║  ${texto.padEnd(ancho - 1)}║`);
    if (subtitulo) {
        console.log(`║  ${subtitulo.padEnd(ancho - 1)}║`);
    }
    console.log(`╚${linea}╝`);
}

function paso(n: number, total: number, descripcion: string) {
    console.log(`\n  [${'█'.repeat(n)}${'░'.repeat(total - n)}] PASO ${n}/${total} — ${descripcion}`);
}

function esperando(seg: number, accion: string): Promise<void> {
    return new Promise((resolve) => {
        let r = seg;
        const t = setInterval(() => {
            process.stdout.write(`\r  ⏳ Avanzando a [${accion}] en ${r}s... (observa la UI ahora)`);
            r--;
            if (r < 0) { clearInterval(t); process.stdout.write('\n'); resolve(); }
        }, 1000);
    });
}

async function correrCaso(
    client: Client,
    sol: SolicitudDevolucion,
    label: string,
): Promise<void> {
    const sufijo = sol.tipo === 'reembolso' ? 'reembolso' : 'devolucion';
    const wfId = `dev-${sufijo}-${sol._id}`;
    const uiUrl = `http://localhost:8080/namespaces/default/workflows/${wfId}`;

    banner(
        `CASO ${label}: ${sol.tipo.toUpperCase()}`,
        sol.tipo === 'reembolso'
            ? '↗ Empresa pagó de MENOS → debe dar más al trabajador'
            : '↙ Empresa pagó de MÁS  → trabajador devuelve excedente',
    );

    console.log(`\n  PR Referencia: ${sol.paymentRequestRef}`);
    console.log(`  Monto pagado:  ${sol.currency} ${sol.montoOriginalPagado.toLocaleString()}`);
    console.log(`  Monto real:    ${sol.currency} ${sol.montoRealRequerido.toLocaleString()}`);
    const diff = Math.abs(sol.montoRealRequerido - sol.montoOriginalPagado);
    console.log(`  Diferencia:    ${sol.currency} ${diff.toLocaleString()} (${sol.tipo === 'reembolso' ? 'a favor del trabajador' : 'a favor de la empresa'})`);

    // ── Iniciar workflow ──────────────────────────────────────────────────────
    paso(1, 3, 'Creando solicitud');
    const handle = await client.workflow.start(solicitudDevolucionWorkflow, {
        taskQueue: 'devoluciones',
        workflowId: wfId,
        args: [sol],
    });

    console.log(`\n  ✅ Workflow iniciado!`);
    console.log(`  🌐 ${uiUrl}`);
    console.log(`  ⏳ Estado: PENDING — Esperando aprobación del Project Owner`);

    // ── Aprobar ───────────────────────────────────────────────────────────────
    await esperando(8, 'APPROVED');
    paso(2, 3, 'Aprobando solicitud');

    await handle.signal(aprobarDevolucionSignal, {
        userId: 'user-maria-rodriguez',
        userName: 'María Rodríguez (Project Owner)',
        notes:
            sol.tipo === 'reembolso'
                ? 'Verificado. El trabajador efectivamente gastó más. Proceder con el reembolso.'
                : 'Verificado. Se pagó más de lo necesario. El trabajador debe devolver el excedente.',
    });

    const estadoAprobado = await handle.query(estadoDevolucionQuery);
    console.log(`  ✅ Estado: APPROVED`);
    console.log(`  → Aprobado por: ${estadoAprobado.aprobacion?.userName}`);
    console.log(`  → Acción siguiente: ${estadoAprobado.resumen.accionRequerida}`);

    // ── Completar ─────────────────────────────────────────────────────────────
    await esperando(8, 'COMPLETED');
    paso(3, 3, sol.tipo === 'reembolso' ? 'Cargando comprobante de pago al trabajador' : 'Confirmando recepción de devolución');

    await handle.signal(completarDevolucionSignal, {
        userId: 'user-maria-rodriguez',
        userName: 'María Rodríguez (Project Owner)',
        comprobante:
            sol.tipo === 'reembolso'
                ? `https://storage.godigital.app/vouchers/reembolso-${sol._id}.pdf`
                : `https://storage.godigital.app/vouchers/devolucion-recibo-${sol._id}.pdf`,
        fechaEfectiva: new Date().toISOString().split('T')[0],
        notes:
            sol.tipo === 'reembolso'
                ? `Transferencia de ${sol.currency} ${diff.toLocaleString()} procesada a ${sol.trabajadorName}`
                : `Recibo firmado por ${sol.trabajadorName}. Dinero ingresado a caja.`,
    });

    // ── Resultado final ───────────────────────────────────────────────────────
    await esperando(4, 'resultado');
    const estadoFinal = await handle.result();

    console.log(`\n  ┌─────────────────────────────────────────────────────`);
    console.log(`  │  ${sol.tipo.toUpperCase()} COMPLETADO ✅`);
    console.log(`  │  Estado: ${estadoFinal.status.toUpperCase()}`);
    console.log(`  │  Diferencia: ${sol.currency} ${diff.toLocaleString()}`);
    console.log(`  │  Comprobante: ${estadoFinal.completado?.comprobante}`);
    console.log(`  │  Historial: ${estadoFinal.history.map((h) => h.status).join(' → ')}`);
    console.log(`  └─────────────────────────────────────────────────────`);
    console.log(`  🌐 Ver detalles: ${uiUrl}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
    banner(
        '🎬  DEMO: Solicitud de Devolución — Ambos casos',
        'Abre http://localhost:8080 y ve a Workflows para seguir en tiempo real',
    );

    const connection = await Connection.connect({ address: 'localhost:7233' });
    const client = new Client({ connection });

    // ── CASO 1: REEMBOLSO — pagó de menos ────────────────────────────────────
    // PaymentRequest original: $50,000. Proveedor cobró $52,300. Diferencia: $2,300 a favor del trabajador.
    const solReembolso: SolicitudDevolucion = {
        _id: `DEV-${Date.now()}-A`,
        tenantId: 'tenant-godigital-001',
        paymentRequestId: 'PR-CONSTRUCTORA-2026-001',
        paymentRequestRef: 'PR-001 — Constructora del Norte S.A.C. (Hito 3)',
        projectId: 'proj-torre-a',
        projectName: 'Torre A — Construcción Fase 2',
        trabajadorId: 'user-carlos-gomez',
        trabajadorName: 'Carlos Gómez',
        trabajadorEmail: 'carlos.gomez@godigital.app',
        projectOwnerEmail: 'maria.rodriguez@godigital.app',
        projectOwnerName: 'María Rodríguez',
        montoOriginalPagado: 50_000.00,
        montoRealRequerido: 52_300.00,  // Costó MÁS de lo previsto → REEMBOLSO
        diferencia: 2_300.00,
        currency: 'USD',
        tipo: 'reembolso',
        notes: 'El proveedor añadió costo de grúa adicional no contemplado en la cotización original.',
        attachments: ['https://storage.godigital.app/docs/factura-adicional-grua.pdf'],
        status: 'pending',
        createdBy: 'user-carlos-gomez',
        createdByName: 'Carlos Gómez',
    };

    await correrCaso(client, solReembolso, '1/2');

    console.log('\n\n  ⏸  Pausa de 5 segundos antes del siguiente caso...\n');
    await new Promise((r) => setTimeout(r, 5000));

    // ── CASO 2: DEVOLUCIÓN — pagó de más ─────────────────────────────────────
    // PaymentRequest original: $15,000. Proveedor cobró $13,750. Diferencia: $1,250 a favor de la empresa.
    const solDevolucion: SolicitudDevolucion = {
        _id: `DEV-${Date.now()}-B`,
        tenantId: 'tenant-godigital-001',
        paymentRequestId: 'PR-SUMINISTROS-2026-004',
        paymentRequestRef: 'PR-004 — Suministros Eléctricos Perú S.A. (Cableado piso 4)',
        projectId: 'proj-torre-a',
        projectName: 'Torre A — Construcción Fase 2',
        trabajadorId: 'user-jose-mendoza',
        trabajadorName: 'José Mendoza',
        trabajadorEmail: 'jose.mendoza@godigital.app',
        projectOwnerEmail: 'maria.rodriguez@godigital.app',
        projectOwnerName: 'María Rodríguez',
        montoOriginalPagado: 15_000.00,
        montoRealRequerido: 13_750.00,  // Costó MENOS de lo previsto → DEVOLUCIÓN
        diferencia: 1_250.00,
        currency: 'USD',
        tipo: 'devolucion',
        notes: 'El proveedor aplicó descuento por volumen no anticipado. El excedente debe ser devuelto.',
        attachments: ['https://storage.godigital.app/docs/nota-credito-SEP-045.pdf'],
        status: 'pending',
        createdBy: 'user-jose-mendoza',
        createdByName: 'José Mendoza',
    };

    await correrCaso(client, solDevolucion, '2/2');

    banner('🏁  DEMO COMPLETADO — Ambos casos ejecutados', 'Ver los 2 workflows en http://localhost:8080/namespaces/default/workflows');

    await connection.close();
}

main().catch((err) => {
    console.error('\n❌ Error en el demo:', err.message);
    if (err.message?.includes('7233')) {
        console.error('   → Verifica que Temporal esté corriendo: sudo docker compose up -d');
    }
    if (err.message?.includes('devoluciones')) {
        console.error('   → Verifica que el worker esté corriendo: npm run dev:worker');
    }
    process.exit(1);
});
