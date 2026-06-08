// workflow.ts — El orquestador del flujo PaymentRequest
// Define la SECUENCIA de estados y la lógica de transición.

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
    PaymentRequest,
    PRWorkflowState,
    AprobarPayload,
    AutorizarPayload,
    PagarPayload,
    RechazarPayload,
} from './types';

// ── Configuración de actividades ─────────────────────────────────────────────
const {
    guardarPaymentRequest,
    actualizarEstado,
    notificarCreacion,
    notificarAprobacion,
    notificarAutorizacion,
    notificarPago,
    notificarRechazo,
    notificarTimeout,
} = proxyActivities<typeof acts>({
    startToCloseTimeout: '30 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '2 seconds',
        backoffCoefficient: 2,
        maximumInterval: '30 seconds',
    },
});

// ── SEÑALES — una por cada transición de estado ──────────────────────────────
export const aprobarSignal = defineSignal<[AprobarPayload]>('aprobar');
export const autorizarSignal = defineSignal<[AutorizarPayload]>('autorizar');
export const pagarSignal = defineSignal<[PagarPayload]>('pagar');
export const rechazarSignal = defineSignal<[RechazarPayload]>('rechazar');

// ── QUERY — para consultar el estado en cualquier momento ────────────────────
export const estadoQuery = defineQuery<PRWorkflowState>('estado');

// ── TIEMPOS DE ESPERA por etapa ──────────────────────────────────────────────
// Producción: el workflow espera hasta N días antes de auto-rechazar por timeout.
const TIMEOUT_APROBACION = '7 days';   // Project Owner tiene 7 días para aprobar
const TIMEOUT_AUTORIZACION = '5 days';  // Project Owner tiene 5 días para autorizar
const TIMEOUT_PAGO = '3 days';  // Project Owner tiene 3 días para pagar/atender

// ── Helper: manejar rechazo/timeout y retornar estado final ─────────────────
async function manejarRechazoOTimeout(
    pr: PaymentRequest,
    state: PRWorkflowState,
    rechazo: RechazarPayload | null,
    etapa: string,
    diasEspera: number,
    timeout: string,
): Promise<PRWorkflowState> {
    const motivo = rechazo?.reason ?? `Timeout: sin respuesta en ${timeout}`;
    const actor = rechazo?.userName ?? 'Sistema';

    log.warn(`❌ PR rechazada/expirada en etapa ${etapa}`, { motivo, actor });

    if (rechazo === null) {
        await notificarTimeout(pr, etapa, diasEspera);
    } else {
        await notificarRechazo(pr, rechazo);
    }

    const fallbackRechazo: RechazarPayload = {
        userId: 'system',
        userName: 'Sistema',
        reason: motivo,
    };

    state.status = 'rejected';
    state.rechazo = { ...(rechazo ?? fallbackRechazo), timestamp: new Date().toISOString() };
    state.history.push({ status: 'rejected', timestamp: new Date().toISOString(), actor });

    await actualizarEstado(pr._id, 'rejected', { rejection_reason: motivo });
    return state;
}

// ── WORKFLOW PRINCIPAL ───────────────────────────────────────────────────────
export async function paymentRequestWorkflow(pr: PaymentRequest): Promise<PRWorkflowState> {

    const state: PRWorkflowState = {
        status: 'pending',
        pr,
        history: [{ status: 'pending', timestamp: new Date().toISOString() }],
    };

    const ctx = {
        aprobacion: null as AprobarPayload | null,
        autorizacion: null as AutorizarPayload | null,
        pago: null as PagarPayload | null,
        rechazo: null as RechazarPayload | null,
    };

    setHandler(aprobarSignal, (data) => { ctx.aprobacion = data; });
    setHandler(autorizarSignal, (data) => { ctx.autorizacion = data; });
    setHandler(pagarSignal, (data) => { ctx.pago = data; });
    setHandler(rechazarSignal, (data) => { ctx.rechazo = data; });
    setHandler(estadoQuery, () => state);

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 1: PENDING — guardar y notificar
    // ══════════════════════════════════════════════════════════════════════════
    log.info('🚀 PaymentRequest workflow iniciado', {
        id: pr._id,
        proyecto: pr.projectName,
        proveedor: pr.providerName,
        monto: `${pr.currency} ${pr.total}`,
    });

    await guardarPaymentRequest(pr);
    await notificarCreacion(pr);

    log.info('⏳ [PENDING] Esperando aprobación...', {
        timeout: TIMEOUT_APROBACION,
        projectOwner: pr.projectOwnerName,
    });

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 2: PENDING → APPROVED
    // ══════════════════════════════════════════════════════════════════════════
    const decisionAprobacion = await condition(
        () => ctx.aprobacion !== null || ctx.rechazo !== null,
        TIMEOUT_APROBACION,
    );

    // Capturar en locales para que TypeScript pueda narrowear correctamente
    const rechazoTrasAprobacion = ctx.rechazo;
    const aprobacion = ctx.aprobacion;

    if (!decisionAprobacion || rechazoTrasAprobacion !== null) {
        return manejarRechazoOTimeout(pr, state, rechazoTrasAprobacion, 'pending→approved', 7, TIMEOUT_APROBACION);
    }

    // aprobacion aquí es no-null: garantizado por la condition
    const aprobacionData = aprobacion!;
    log.info('✅ PR aprobada', { por: aprobacionData.userName, notas: aprobacionData.notes });

    state.status = 'approved';
    state.aprobacion = { ...aprobacionData, timestamp: new Date().toISOString() };
    state.history.push({ status: 'approved', timestamp: new Date().toISOString(), actor: aprobacionData.userName });

    await actualizarEstado(pr._id, 'approved', {
        approved_by: aprobacionData.userId,
        approval_notes: aprobacionData.notes,
    });
    await notificarAprobacion(pr, aprobacionData);
    log.info('⏳ [APPROVED] Esperando autorización...', { timeout: TIMEOUT_AUTORIZACION });

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 3: APPROVED → AUTHORIZED
    // ══════════════════════════════════════════════════════════════════════════
    const decisionAutorizacion = await condition(
        () => ctx.autorizacion !== null || ctx.rechazo !== null,
        TIMEOUT_AUTORIZACION,
    );

    const rechazoTrasAutorizacion = ctx.rechazo;
    const autorizacion = ctx.autorizacion;

    if (!decisionAutorizacion || rechazoTrasAutorizacion !== null) {
        return manejarRechazoOTimeout(pr, state, rechazoTrasAutorizacion, 'approved→authorized', 5, TIMEOUT_AUTORIZACION);
    }

    const autorizacionData = autorizacion!;
    log.info('🔐 PR autorizada', {
        por: autorizacionData.userName,
        fechaPago: autorizacionData.paymentDate,
        cuenta: autorizacionData.bankAccountName,
    });

    state.status = 'authorized';
    state.autorizacion = { ...autorizacionData, timestamp: new Date().toISOString() };
    state.history.push({ status: 'authorized', timestamp: new Date().toISOString(), actor: autorizacionData.userName });

    await actualizarEstado(pr._id, 'authorized', {
        authorized_by: autorizacionData.userId,
        payment_date: autorizacionData.paymentDate,
        debited_bank_account: autorizacionData.bankAccountId,
        authorization_notes: autorizacionData.notes,
    });
    await notificarAutorizacion(pr, autorizacionData);
    log.info('⏳ [AUTHORIZED] Esperando comprobante de pago...', { timeout: TIMEOUT_PAGO });

    // ══════════════════════════════════════════════════════════════════════════
    // PASO 4: AUTHORIZED → PAID
    // ══════════════════════════════════════════════════════════════════════════
    const decisionPago = await condition(
        () => ctx.pago !== null || ctx.rechazo !== null,
        TIMEOUT_PAGO,
    );

    const rechazoTrasPago = ctx.rechazo;
    const pago = ctx.pago;

    if (!decisionPago || rechazoTrasPago !== null) {
        return manejarRechazoOTimeout(pr, state, rechazoTrasPago, 'authorized→paid', 3, TIMEOUT_PAGO);
    }

    const pagoData = pago!;
    log.info('💚 PR pagada — COMPLETADA', {
        por: pagoData.userName,
        comprobante: pagoData.paymentProof,
    });

    state.status = 'paid';
    state.pago = { ...pagoData, timestamp: new Date().toISOString() };
    state.history.push({ status: 'paid', timestamp: new Date().toISOString(), actor: pagoData.userName });

    await actualizarEstado(pr._id, 'paid', {
        paid_by: pagoData.userId,
        payment_proof: pagoData.paymentProof,
        payment_notes: pagoData.notes,
    });
    await notificarPago(pr, pagoData);

    log.info('🏁 Workflow completado ✅', {
        id: pr._id,
        historial: state.history.map((h) => `${h.status} (${h.actor ?? 'sistema'})`).join(' → '),
    });

    return state;
}
