// workflow.ts — Orquestador del flujo Cash Request
// Flujo: created → approved → authorized → paid
//        → expense_draft → submitted → under_review
//        → closed  (balance = 0)
//        → reimbursement → closed (gastado > autorizado)
//        → refund       → closed (gastado < autorizado)

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
    CashRequest,
    CRWorkflowState,
    CRStatus,
    AprobarCRPayload,
    AutorizarCRPayload,
    PagarCRPayload,
    SubmitExpensePayload,
    ReviewExpensePayload,
    RechazarCRPayload,
    ClosePayload,
} from './types';

// ── Actividades ───────────────────────────────────────────────────────────────
const {
    notificarCreacion,
    notificarAprobacion,
    notificarAutorizacion,
    notificarPago,
    notificarExpenseSubmit,
    notificarCierreDirecto,
    notificarReembolso,
    notificarDevolucion,
    notificarCierreFinal,
    notificarRechazo,
    notificarTimeout,
} = proxyActivities<typeof acts>({
    startToCloseTimeout: '60 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '2 seconds',
        backoffCoefficient: 2,
        maximumInterval: '30 seconds',
    },
});

// ── Señales ───────────────────────────────────────────────────────────────────
export const aprobarSignal      = defineSignal<[AprobarCRPayload]>('aprobar');
export const autorizarSignal    = defineSignal<[AutorizarCRPayload]>('autorizar');
export const pagarSignal        = defineSignal<[PagarCRPayload]>('pagar');
export const submitExpenseSignal= defineSignal<[SubmitExpensePayload]>('submit_expense');
export const reviewSignal       = defineSignal<[ReviewExpensePayload]>('iniciar_revision');
export const cerrarSignal       = defineSignal<[ClosePayload]>('cerrar');
export const rechazarSignal     = defineSignal<[RechazarCRPayload]>('rechazar');

// ── Query ─────────────────────────────────────────────────────────────────────
export const estadoQuery = defineQuery<CRWorkflowState>('estado');

// ── Timeouts ──────────────────────────────────────────────────────────────────
const TIMEOUT_APROBACION    = '5 days';
const TIMEOUT_AUTORIZACION  = '3 days';
const TIMEOUT_PAGO          = '2 days';
const TIMEOUT_SUBMIT        = '30 days'; // Flexible — admin sets period
const TIMEOUT_REVIEW        = '5 days';
const TIMEOUT_SETTLEMENT    = '3 days'; // Reimbursement or refund settlement

// ── Workflow principal ────────────────────────────────────────────────────────
export async function cashRequestWorkflow(cr: CashRequest): Promise<CRWorkflowState> {

    // ── Contexto mutable ──────────────────────────────────────────────────────
    const ctx: {
        aprobacion?: AprobarCRPayload;
        autorizacion?: AutorizarCRPayload;
        pago?: PagarCRPayload;
        expenseSubmit?: SubmitExpensePayload;
        review?: ReviewExpensePayload;
        closure?: ClosePayload;
        rechazo?: RechazarCRPayload;
    } = {};

    let status: CRStatus = 'created';
    const history: CRWorkflowState['history'] = [
        { status: 'created', timestamp: new Date().toISOString() },
    ];

    // Helpers
    const pushHistory = (s: CRStatus, actor?: string) => {
        status = s;
        history.push({ status: s, timestamp: new Date().toISOString(), actor });
    };

    const makeState = (): CRWorkflowState => ({
        status,
        cr,
        aprobacion:    ctx.aprobacion   ? { ...ctx.aprobacion,   timestamp: history.find(h => h.status === 'approved')?.timestamp   ?? '' } : undefined,
        autorizacion:  ctx.autorizacion ? { ...ctx.autorizacion, timestamp: history.find(h => h.status === 'authorized')?.timestamp ?? '' } : undefined,
        pago:          ctx.pago         ? { ...ctx.pago,         timestamp: history.find(h => h.status === 'paid')?.timestamp        ?? '' } : undefined,
        expenseSubmit: ctx.expenseSubmit? { ...ctx.expenseSubmit,timestamp: history.find(h => h.status === 'submitted')?.timestamp   ?? '' } : undefined,
        review:        ctx.review       ? { ...ctx.review,       timestamp: history.find(h => h.status === 'under_review')?.timestamp?? '' } : undefined,
        closure:       ctx.closure      ? { ...ctx.closure,      timestamp: history.find(h => h.status === 'closed')?.timestamp      ?? '' } : undefined,
        rechazo:       ctx.rechazo      ? { ...ctx.rechazo,      timestamp: history.find(h => h.status === 'rejected')?.timestamp    ?? '' } : undefined,
        history,
    });

    // ── Registrar señales ─────────────────────────────────────────────────────
    setHandler(aprobarSignal,       (p) => { ctx.aprobacion    = p; });
    setHandler(autorizarSignal,     (p) => { ctx.autorizacion  = p; });
    setHandler(pagarSignal,         (p) => { ctx.pago          = p; });
    setHandler(submitExpenseSignal, (p) => { ctx.expenseSubmit = p; });
    setHandler(reviewSignal,        (p) => { ctx.review        = p; });
    setHandler(cerrarSignal,        (p) => { ctx.closure       = p; });
    setHandler(rechazarSignal,      (p) => { ctx.rechazo       = p; });

    // ── Query ─────────────────────────────────────────────────────────────────
    setHandler(estadoQuery, makeState);

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 0: Creación — notificar al empleado y supervisor
    // ═════════════════════════════════════════════════════════════════════════
    log.info('🚀 CashRequest iniciado', { id: cr._id });
    await notificarCreacion(cr);

    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: Esperar aprobación del supervisor
    // ════════════════════════════════════════════════════════════════════════
    await condition(
        () => !!(ctx.aprobacion || ctx.rechazo),
        TIMEOUT_APROBACION,
    );

    if (ctx.rechazo || !ctx.aprobacion) {
        const rechazoFinal = ctx.rechazo ?? { userId: 'sistema', userName: 'Sistema', reason: `Sin respuesta del supervisor en ${TIMEOUT_APROBACION}` };
        pushHistory('rejected', rechazoFinal.userName);
        if (ctx.rechazo) {
            await notificarRechazo(cr, ctx.rechazo);
        } else {
            await notificarTimeout(cr, 'approval', 5);
        }
        return makeState();
    }

    pushHistory('approved', ctx.aprobacion.userName);
    await notificarAprobacion(cr, ctx.aprobacion!);

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 2: Esperar autorización del SuperAdmin (monto + período)
    // ═════════════════════════════════════════════════════════════════════════
    ctx.rechazo = undefined;

    await condition(
        () => !!(ctx.autorizacion || ctx.rechazo),
        TIMEOUT_AUTORIZACION,
    );

    if (ctx.rechazo || !ctx.autorizacion) {
        const rechazoFinal = ctx.rechazo ?? { userId: 'sistema', userName: 'Sistema', reason: 'Timeout' };
        pushHistory('rejected', rechazoFinal.userName);
        if (ctx.rechazo) {
            await notificarRechazo(cr, ctx.rechazo);
        } else {
            await notificarTimeout(cr, 'authorization', 3);
        }
        return makeState();
    }

    pushHistory('authorized', ctx.autorizacion.userName);
    await notificarAutorizacion(cr, ctx.autorizacion!);

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 3: Esperar pago/desembolso del Tesorero (SuperAdmin)
    // ═════════════════════════════════════════════════════════════════════════
    ctx.rechazo = undefined;

    await condition(
        () => !!(ctx.pago || ctx.rechazo),
        TIMEOUT_PAGO,
    );

    if (ctx.rechazo || !ctx.pago) {
        const rechazoFinal = ctx.rechazo ?? { userId: 'sistema', userName: 'Sistema', reason: 'Timeout' };
        pushHistory('rejected', rechazoFinal.userName);
        if (ctx.rechazo) {
            await notificarRechazo(cr, ctx.rechazo);
        } else {
            await notificarTimeout(cr, 'payment', 2);
        }
        return makeState();
    }

    pushHistory('paid', ctx.pago.userName);
    await notificarPago(cr, ctx.pago!);

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 4: Expense Draft — esperar que el empleado haga submit
    // El período de uso está definido por el administrador (expensePeriodDays)
    // ═════════════════════════════════════════════════════════════════════════
    pushHistory('expense_draft');

    const expensePeriodDays = ctx.autorizacion!.expensePeriodDays ?? 7;
    // condition() only accepts ms number or ISO duration string — convert days
    const expenseTimeoutMs = expensePeriodDays * 24 * 60 * 60 * 1000;

    ctx.rechazo = undefined;

    await condition(
        () => !!(ctx.expenseSubmit || ctx.rechazo),
        expenseTimeoutMs,
    );

    if (ctx.rechazo || !ctx.expenseSubmit) {
        const rechazoFinal = ctx.rechazo ?? { userId: 'sistema', userName: 'Sistema', reason: 'Timeout' };
        pushHistory('rejected', rechazoFinal.userName);
        if (ctx.rechazo) {
            await notificarRechazo(cr, ctx.rechazo);
        } else {
            await notificarTimeout(cr, 'expense submission', expensePeriodDays);
        }
        return makeState();
    }

    pushHistory('submitted', ctx.expenseSubmit.userName);
    await notificarExpenseSubmit(cr, ctx.expenseSubmit!);

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 5: Esperar revisión del admin → determinar balance
    // ═════════════════════════════════════════════════════════════════════════
    ctx.rechazo = undefined;

    await condition(
        () => !!(ctx.review || ctx.rechazo),
        TIMEOUT_REVIEW,
    );

    if (ctx.rechazo || !ctx.review) {
        const rechazoFinal = ctx.rechazo ?? { userId: 'sistema', userName: 'Sistema', reason: 'Timeout' };
        pushHistory('rejected', rechazoFinal.userName);
        if (ctx.rechazo) {
            await notificarRechazo(cr, ctx.rechazo);
        } else {
            await notificarTimeout(cr, 'admin review', 5);
        }
        return makeState();
    }

    pushHistory('under_review', ctx.review!.userName);

    const balance = ctx.review!.balance; // positive = company owes, negative = employee returns

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 6A: Balance = 0 → cierre directo
    // ═════════════════════════════════════════════════════════════════════════
    if (balance === 0) {
        pushHistory('closed', ctx.review!.userName);
        await notificarCierreDirecto(cr, ctx.review!);
        return makeState();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 6B: Reembolso (gastado > autorizado) — empresa paga diferencia
    // ═════════════════════════════════════════════════════════════════════════
    if (balance > 0) {
        pushHistory('reimbursement', ctx.review!.userName);
        await notificarReembolso(cr, ctx.review!);

        const settled = await condition(() => !!(ctx.closure), TIMEOUT_SETTLEMENT);
        if (!settled) {
            log.warn('⏰ Reimbursement settlement timed out', { id: cr._id });
        }
        const closureActor = ctx.closure?.userName ?? 'Sistema';
        pushHistory('closed', closureActor);
        await notificarCierreFinal(cr, ctx.closure ?? { userId: 'system', userName: 'Sistema' });
        return makeState();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PASO 6C: Devolución (gastado < autorizado) — empleado devuelve diferencia
    // ═════════════════════════════════════════════════════════════════════════
    pushHistory('refund', ctx.review!.userName);
    await notificarDevolucion(cr, ctx.review!);

    const settled2 = await condition(() => !!(ctx.closure), TIMEOUT_SETTLEMENT);
    if (!settled2) {
        log.warn('⏰ Refund settlement timed out', { id: cr._id });
    }
    const closureActor2 = ctx.closure?.userName ?? 'Sistema';
    pushHistory('closed', closureActor2);
    await notificarCierreFinal(cr, ctx.closure ?? { userId: 'system', userName: 'Sistema' });

    return makeState();
}
