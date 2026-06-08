// workflow.ts — Solicitud de Devolución
//
// Dos casos según la diferencia entre lo pagado y lo realmente requerido:
//   • REEMBOLSO  (montoReal > montoOriginal): empresa paga diferencia al trabajador
//   • DEVOLUCIÓN (montoReal < montoOriginal): trabajador regresa excedente a la empresa

import {
    proxyActivities,
    defineSignal,
    defineQuery,
    setHandler,
    condition,
    log,
} from '@temporalio/workflow';
import type * as acts from './activities';
import type {
    SolicitudDevolucion,
    DevolucionWorkflowState,
    AprobarDevolucionPayload,
    CompletarDevolucionPayload,
    RechazarDevolucionPayload,
} from './types';

// ── ACTIVIDADES ───────────────────────────────────────────────────────────────
const {
    guardarSolicitudDevolucion,
    actualizarEstadoDevolucion,
    notificarCreacionDevolucion,
    notificarAprobacionDevolucion,
    notificarCompletadoDevolucion,
    notificarRechazoDevolucion,
    notificarTimeoutDevolucion,
} = proxyActivities<typeof acts>({
    startToCloseTimeout: '30 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '2 seconds',
        backoffCoefficient: 2,
    },
});

// ── SEÑALES ───────────────────────────────────────────────────────────────────
export const aprobarDevolucionSignal = defineSignal<[AprobarDevolucionPayload]>('aprobarDevolucion');
export const completarDevolucionSignal = defineSignal<[CompletarDevolucionPayload]>('completarDevolucion');
export const rechazarDevolucionSignal = defineSignal<[RechazarDevolucionPayload]>('rechazarDevolucion');

// ── QUERIES ───────────────────────────────────────────────────────────────────
export const estadoDevolucionQuery = defineQuery<DevolucionWorkflowState>('estadoDevolucion');

// ── TIMEOUTS (demo: 2 min; producción: días) ─────────────────────────────────
const TIMEOUT_APROBACION = '2 minutes';
const TIMEOUT_COMPLETAR = '2 minutes';

// ── Helper: textos según tipo ─────────────────────────────────────────────────
function buildResumen(sol: SolicitudDevolucion) {
    const fmt = (n: number) =>
        `${sol.currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (sol.tipo === 'reembolso') {
        return {
            tipo: sol.tipo,
            descripcion: `La empresa debe reembolsar ${fmt(sol.diferencia)} al trabajador (pagó de menos)`,
            accionRequerida: `Procesar pago adicional de ${fmt(sol.diferencia)} al trabajador`,
        } as const;
    }
    return {
        tipo: sol.tipo,
        descripcion: `El trabajador debe devolver ${fmt(sol.diferencia)} a la empresa (recibió de más)`,
        accionRequerida: `Confirmar recepción de la devolución de ${fmt(sol.diferencia)}`,
    } as const;
}

// ── Helper: manejar rechazo o timeout ────────────────────────────────────────
async function procesarRechazoOTimeout(
    sol: SolicitudDevolucion,
    state: DevolucionWorkflowState,
    rechazo: RechazarDevolucionPayload | null,
    etapa: string,
): Promise<DevolucionWorkflowState> {
    const actor = rechazo?.userName ?? 'Sistema';
    const reason = rechazo?.reason ?? `Timeout sin respuesta en etapa: ${etapa}`;

    log.warn(`❌ Solicitud rechazada/expirada en ${etapa}`, { actor, reason });

    if (rechazo === null) {
        await notificarTimeoutDevolucion(sol, etapa);
    } else {
        await notificarRechazoDevolucion(sol, rechazo);
    }

    const fallback: RechazarDevolucionPayload = { userId: 'system', userName: 'Sistema', reason };
    state.status = 'rejected';
    state.rechazo = { ...(rechazo ?? fallback), timestamp: new Date().toISOString() };
    state.history.push({ status: 'rejected', timestamp: new Date().toISOString(), actor });

    await actualizarEstadoDevolucion(sol._id, 'rejected', { rejection_reason: reason });
    return state;
}

// ── WORKFLOW PRINCIPAL ────────────────────────────────────────────────────────
export async function solicitudDevolucionWorkflow(
    sol: SolicitudDevolucion,
): Promise<DevolucionWorkflowState> {

    // Determinar tipo automáticamente según los montos
    // (el caller ya debería haberlo calculado, pero lo verificamos)
    const diferencia = sol.montoRealRequerido - sol.montoOriginalPagado;
    const tipo = diferencia > 0 ? 'reembolso' : 'devolucion';

    // Asegurar coherencia tipada
    const solicitudFinal: SolicitudDevolucion = {
        ...sol,
        tipo,
        diferencia: Math.abs(diferencia),
    };

    const state: DevolucionWorkflowState = {
        status: 'pending',
        solicitud: solicitudFinal,
        history: [{ status: 'pending', timestamp: new Date().toISOString() }],
        resumen: buildResumen(solicitudFinal),
    };

    const ctx = {
        aprobacion: null as AprobarDevolucionPayload | null,
        completado: null as CompletarDevolucionPayload | null,
        rechazo: null as RechazarDevolucionPayload | null,
    };

    setHandler(aprobarDevolucionSignal, (d) => { ctx.aprobacion = d; });
    setHandler(completarDevolucionSignal, (d) => { ctx.completado = d; });
    setHandler(rechazarDevolucionSignal, (d) => { ctx.rechazo = d; });
    setHandler(estadoDevolucionQuery, () => state);

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 1: PENDING — registrar y notificar
    // ══════════════════════════════════════════════════════════════════════════
    log.info(`🚀 Solicitud de ${tipo.toUpperCase()} iniciada`, {
        id: sol._id,
        pr_referencia: sol.paymentRequestRef,
        pagado_originalmente: `${sol.currency} ${sol.montoOriginalPagado}`,
        monto_real_requerido: `${sol.currency} ${sol.montoRealRequerido}`,
        diferencia: `${sol.currency} ${Math.abs(diferencia)}`,
        tipo: tipo === 'reembolso'
            ? '↗ Empresa debe pagar MÁS al trabajador'
            : '↙ Trabajador debe DEVOLVER excedente a empresa',
    });

    await guardarSolicitudDevolucion(solicitudFinal);
    await notificarCreacionDevolucion(solicitudFinal);

    log.info('⏳ [PENDING] Esperando revisión y aprobación del Project Owner...', {
        timeout: TIMEOUT_APROBACION,
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 2: PENDING → APPROVED
    // ══════════════════════════════════════════════════════════════════════════
    const decisionAprobacion = await condition(
        () => ctx.aprobacion !== null || ctx.rechazo !== null,
        TIMEOUT_APROBACION,
    );

    const rechazoTrasAprobacion = ctx.rechazo;
    const aprobacion = ctx.aprobacion;

    if (!decisionAprobacion || rechazoTrasAprobacion !== null) {
        return procesarRechazoOTimeout(solicitudFinal, state, rechazoTrasAprobacion, 'pending→approved');
    }

    const aprobacionData = aprobacion!;
    log.info('✅ Solicitud aprobada', {
        por: aprobacionData.userName,
        notas: aprobacionData.notes,
        siguiente_paso: state.resumen.accionRequerida,
    });

    state.status = 'approved';
    state.aprobacion = { ...aprobacionData, timestamp: new Date().toISOString() };
    state.history.push({ status: 'approved', timestamp: new Date().toISOString(), actor: aprobacionData.userName });

    await actualizarEstadoDevolucion(sol._id, 'approved', {
        approved_by: aprobacionData.userId,
        approval_notes: aprobacionData.notes,
    });
    await notificarAprobacionDevolucion(solicitudFinal, aprobacionData);

    // Contexto para el log según el tipo
    if (tipo === 'reembolso') {
        log.info('⏳ [APPROVED] Esperando comprobante del pago adicional al trabajador...', {
            instruccion: 'El Project Owner debe pagar la diferencia al trabajador y subir el comprobante',
            monto: `${sol.currency} ${Math.abs(diferencia)}`,
            timeout: TIMEOUT_COMPLETAR,
        });
    } else {
        log.info('⏳ [APPROVED] Esperando confirmación de devolución del excedente...', {
            instruccion: 'El trabajador debe devolver el excedente y el Project Owner confirma con comprobante',
            monto: `${sol.currency} ${Math.abs(diferencia)}`,
            timeout: TIMEOUT_COMPLETAR,
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 3: APPROVED → COMPLETED
    // ══════════════════════════════════════════════════════════════════════════
    const decisionCompletar = await condition(
        () => ctx.completado !== null || ctx.rechazo !== null,
        TIMEOUT_COMPLETAR,
    );

    const rechazoTrasCompletar = ctx.rechazo;
    const completado = ctx.completado;

    if (!decisionCompletar || rechazoTrasCompletar !== null) {
        return procesarRechazoOTimeout(solicitudFinal, state, rechazoTrasCompletar, 'approved→completed');
    }

    const completadoData = completado!;

    // Log específico según tipo
    if (tipo === 'reembolso') {
        log.info('💚 Reembolso procesado — diferencia pagada al trabajador', {
            por: completadoData.userName,
            monto: `${sol.currency} ${Math.abs(diferencia)}`,
            comprobante: completadoData.comprobante,
            fechaEfectiva: completadoData.fechaEfectiva,
        });
    } else {
        log.info('✅ Devolución confirmada — excedente regresado a la empresa', {
            por: completadoData.userName,
            monto: `${sol.currency} ${Math.abs(diferencia)}`,
            comprobante: completadoData.comprobante,
            fechaEfectiva: completadoData.fechaEfectiva,
        });
    }

    state.status = 'completed';
    state.completado = { ...completadoData, timestamp: new Date().toISOString() };
    state.history.push({ status: 'completed', timestamp: new Date().toISOString(), actor: completadoData.userName });

    await actualizarEstadoDevolucion(sol._id, 'completed', {
        completed_by: completadoData.userId,
        comprobante: completadoData.comprobante,
        fecha_efectiva: completadoData.fechaEfectiva,
        completion_notes: completadoData.notes,
    });
    await notificarCompletadoDevolucion(solicitudFinal, completadoData);

    log.info('🏁 Workflow SolicitudDevolucion completado ✅', {
        id: sol._id,
        tipo: tipo.toUpperCase(),
        diferencia: `${sol.currency} ${Math.abs(diferencia)}`,
        historial: state.history.map((h) => `${h.status} (${h.actor ?? 'sistema'})`).join(' → '),
    });

    return state;
}
