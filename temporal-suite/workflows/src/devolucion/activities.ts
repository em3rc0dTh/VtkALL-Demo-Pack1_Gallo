// activities.ts — Actividades de Solicitud de Devolución

import { log } from '@temporalio/activity';
import type {
    SolicitudDevolucion,
    AprobarDevolucionPayload,
    CompletarDevolucionPayload,
    RechazarDevolucionPayload,
    TipoDevolucion,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string): string {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

function labelTipo(tipo: TipoDevolucion): string {
    return tipo === 'reembolso'
        ? '💰 REEMBOLSO (empresa → trabajador)'
        : '↩️  DEVOLUCIÓN (trabajador → empresa)';
}

// ─── Persistencia ─────────────────────────────────────────────────────────────

export async function guardarSolicitudDevolucion(sol: SolicitudDevolucion): Promise<void> {
    log.info('💾 [DB] Guardando SolicitudDevolucion', {
        id: sol._id,
        tipo: labelTipo(sol.tipo),
        prRef: sol.paymentRequestRef,
        diferencia: fmt(sol.diferencia, sol.currency),
        status: sol.status,
    });
    // REAL: await tenantDB.collection('solicitudes_devolucion').insertOne(sol)
    await sleep(300);
    log.info('✅ [DB] SolicitudDevolucion guardada', { id: sol._id });
}

export async function actualizarEstadoDevolucion(
    solId: string,
    status: string,
    updates: Record<string, unknown>,
): Promise<void> {
    log.info(`🔄 [DB] Actualizando estado → ${status.toUpperCase()}`, { id: solId, ...updates });
    // REAL: await tenantDB.collection('solicitudes_devolucion').updateOne(...)
    await sleep(200);
    log.info(`✅ [DB] Estado actualizado`, { id: solId, status });
}

// ─── Notificaciones por email ─────────────────────────────────────────────────

export async function notificarCreacionDevolucion(sol: SolicitudDevolucion): Promise<void> {
    const tipo = labelTipo(sol.tipo);
    const descripcion =
        sol.tipo === 'reembolso'
            ? `La empresa debe reembolsar ${fmt(sol.diferencia, sol.currency)} al trabajador`
            : `El trabajador debe devolver ${fmt(sol.diferencia, sol.currency)} a la empresa`;

    log.info('📧 [EMAIL] Notificando creación de solicitud de devolución', {
        tipo,
        descripcion,
        monto_original: fmt(sol.montoOriginalPagado, sol.currency),
        monto_real: fmt(sol.montoRealRequerido, sol.currency),
        diferencia: fmt(sol.diferencia, sol.currency),
    });

    // Email al TRABAJADOR (confirmación de que su solicitud fue registrada)
    log.info('  → Trabajador: solicitud registrada', {
        para: sol.trabajadorEmail,
        asunto: `[GoDigital] 📋 Solicitud de ${sol.tipo === 'reembolso' ? 'Reembolso' : 'Devolución'} registrada`,
        pr: sol.paymentRequestRef,
        diferencia: fmt(sol.diferencia, sol.currency),
    });

    // Email al PROJECT OWNER (acción requerida: aprobar)
    log.info('  → Project Owner: acción requerida — REVISAR Y APROBAR', {
        para: sol.projectOwnerEmail,
        asunto: `[GoDigital] 🔔 Revisar diferencia de pago — ${sol.paymentRequestRef}`,
        tipo,
        descripcion,
        url: `https://godigital.app/devolucion/${sol._id}/review`,
    });

    await sleep(500);
    log.info('✅ [EMAIL] Notificaciones de creación enviadas');
}

export async function notificarAprobacionDevolucion(
    sol: SolicitudDevolucion,
    data: AprobarDevolucionPayload,
): Promise<void> {
    const accion =
        sol.tipo === 'reembolso'
            ? 'Procesa el pago adicional al trabajador'
            : 'Confirma la devolución del excedente';

    log.info('📧 [EMAIL] Notificando aprobación', {
        aprobadoPor: data.userName,
        tipo: labelTipo(sol.tipo),
    });

    log.info('  → Trabajador: solicitud aprobada', {
        para: sol.trabajadorEmail,
        asunto: `[GoDigital] ✅ Solicitud aprobada — pendiente de procesamiento`,
        diferencia: fmt(sol.diferencia, sol.currency),
        instruccion:
            sol.tipo === 'devolucion'
                ? `Por favor realiza la devolución de ${fmt(sol.diferencia, sol.currency)} y sube el comprobante`
                : `La diferencia de ${fmt(sol.diferencia, sol.currency)} será procesada pronto`,
    });

    log.info('  → Project Owner: acción requerida — COMPLETAR', {
        para: sol.projectOwnerEmail,
        asunto: `[GoDigital] 🟣 Acción requerida: ${accion}`,
        url: `https://godigital.app/devolucion/${sol._id}/complete`,
        monto: fmt(sol.diferencia, sol.currency),
    });

    await sleep(500);
    log.info('✅ [EMAIL] Notificaciones de aprobación enviadas');
}

export async function notificarCompletadoDevolucion(
    sol: SolicitudDevolucion,
    data: CompletarDevolucionPayload,
): Promise<void> {
    const titulo =
        sol.tipo === 'reembolso'
            ? `💚 Reembolso procesado — ${fmt(sol.diferencia, sol.currency)}`
            : `✅ Devolución confirmada — ${fmt(sol.diferencia, sol.currency)}`;

    const detalleAccion =
        sol.tipo === 'reembolso'
            ? `Se te transfirieron ${fmt(sol.diferencia, sol.currency)} como reembolso de diferencia de pago.`
            : `Recibimos la devolución de ${fmt(sol.diferencia, sol.currency)}. Gracias.`;

    log.info('📧 [EMAIL] Notificando completado ✅', {
        tipo: labelTipo(sol.tipo),
        comprobante: data.comprobante,
        fechaEfectiva: data.fechaEfectiva,
    });

    log.info('  → Trabajador: solicitud completada', {
        para: sol.trabajadorEmail,
        asunto: `[GoDigital] ${titulo}`,
        detalle: detalleAccion,
        comprobante: data.comprobante,
        fecha: data.fechaEfectiva,
    });

    log.info('  → Project Owner: confirmación de cierre', {
        para: sol.projectOwnerEmail,
        asunto: `[GoDigital] 🔒 Solicitud cerrada — ${sol.paymentRequestRef}`,
        resumen: `${labelTipo(sol.tipo)} de ${fmt(sol.diferencia, sol.currency)} procesado el ${data.fechaEfectiva}`,
        comprobante: data.comprobante,
    });

    await sleep(500);
    log.info('✅ [EMAIL] Notificaciones de completado enviadas');
}

export async function notificarRechazoDevolucion(
    sol: SolicitudDevolucion,
    data: RechazarDevolucionPayload,
): Promise<void> {
    log.info('📧 [EMAIL] Notificando rechazo de solicitud', {
        rechazadoPor: data.userName,
        motivo: data.reason,
    });

    log.info('  → Trabajador: solicitud rechazada', {
        para: sol.trabajadorEmail,
        asunto: `[GoDigital] ❌ Solicitud de ${sol.tipo === 'reembolso' ? 'reembolso' : 'devolución'} rechazada`,
        motivo: data.reason,
        pr: sol.paymentRequestRef,
    });

    await sleep(400);
    log.info('✅ [EMAIL] Notificación de rechazo enviada');
}

export async function notificarTimeoutDevolucion(
    sol: SolicitudDevolucion,
    etapa: string,
): Promise<void> {
    log.warn(`⏰ [EMAIL] Timeout en solicitud de devolución — etapa: ${etapa}`, {
        id: sol._id,
        diferencia: fmt(sol.diferencia, sol.currency),
    });

    log.info('  → Project Owner + Trabajador: solicitud expirada', {
        etapa,
        diferencia: fmt(sol.diferencia, sol.currency),
    });

    await sleep(300);
    log.info('✅ [EMAIL] Notificación de timeout enviada');
}
