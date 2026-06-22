// src/workflows.ts
import {
    proxyActivities,
    defineSignal,
    defineQuery,
    setHandler,
    condition,
    log,
} from '@temporalio/workflow';
import type * as activitiesTypes from './activities';
import type { Pedido } from './activities';

// Importamos actividades con typing correcto usando 'import type'
const acts = proxyActivities<typeof activitiesTypes>({
    startToCloseTimeout: '30 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '1 second',
        backoffCoefficient: 2,
    },
});

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TipoDecision = 'aprobado' | 'rechazado';

interface Decision {
    tipo: TipoDecision;
    aprobadorId: string;
    comentario: string;
}

export interface EstadoWorkflow {
    etapa: 'pendiente' | 'aprobado' | 'rechazado' | 'expirado' | 'completado';
    pedido: Pedido;
    aprobadorId?: string;
    comentario?: string;
    transaccionId?: string;
}

// ── Señales (input externo mientras el workflow corre) ────────────────────────
export const aprobarSignal = defineSignal<[{ aprobadorId: string; comentario: string }]>('aprobar');
export const rechazarSignal = defineSignal<[{ aprobadorId: string; motivo: string }]>('rechazar');

// ── Queries (consultar estado sin modificarlo) ────────────────────────────────
export const estadoQuery = defineQuery<EstadoWorkflow>('estado');

// ── Workflow principal ────────────────────────────────────────────────────────
export async function aprobacionPedidoWorkflow(pedido: Pedido): Promise<EstadoWorkflow> {
    const estado: EstadoWorkflow = { etapa: 'pendiente', pedido };

    // Usamos un objeto contenedor para que TypeScript no pierda el tipo
    // al mutar la variable dentro de closures (limitación de narrowing en TS)
    const ctx = { decision: null as Decision | null };

    setHandler(estadoQuery, () => estado);

    setHandler(aprobarSignal, ({ aprobadorId, comentario }) => {
        log.info('🟢 Señal de aprobación recibida', { aprobadorId });
        ctx.decision = { tipo: 'aprobado', aprobadorId, comentario };
    });

    setHandler(rechazarSignal, ({ aprobadorId, motivo }) => {
        log.info('🔴 Señal de rechazo recibida', { aprobadorId });
        ctx.decision = { tipo: 'rechazado', aprobadorId, comentario: motivo };
    });

    // ── Paso 1: Guardar pedido ──────────────────────────────────────────────────
    log.info('🚀 Iniciando workflow de aprobación', { pedidoId: pedido.id });
    await acts.guardarPedido(pedido);

    // ── Paso 2: Notificar aprobadores ───────────────────────────────────────────
    await acts.notificarAprobadores(pedido);

    // ── Paso 3: Esperar decisión con timer durable de 48 horas ─────────────────
    log.info('⏳ Esperando decisión del aprobador (máx 48h)...');
    const fueDecidido = await condition(() => ctx.decision !== null, '48 hours');

    // ── Paso 4: Procesar resultado ──────────────────────────────────────────────
    if (!fueDecidido || ctx.decision === null) {
        log.warn('⏰ Workflow expirado por timeout sin decisión');
        estado.etapa = 'expirado';
        await acts.cancelarPedido(pedido, 'Timeout: sin respuesta en 48h');
        await acts.notificarCliente(pedido, false);
        return estado;
    }

    // Extraemos para que TypeScript pueda narrowear correctamente
    const decision: Decision = ctx.decision;

    estado.aprobadorId = decision.aprobadorId;
    estado.comentario = decision.comentario;

    if (decision.tipo === 'aprobado') {
        estado.etapa = 'aprobado';
        log.info('✅ Aprobado, procesando pago...');
        const transaccionId = await acts.procesarPago(pedido);
        estado.transaccionId = transaccionId;
        await acts.notificarCliente(pedido, true, transaccionId);
        estado.etapa = 'completado';
    } else {
        estado.etapa = 'rechazado';
        log.info('❌ Rechazado');
        await acts.cancelarPedido(pedido, decision.comentario);
        await acts.notificarCliente(pedido, false);
    }

    log.info('🏁 Workflow finalizado', { etapa: estado.etapa });
    return estado;
}
