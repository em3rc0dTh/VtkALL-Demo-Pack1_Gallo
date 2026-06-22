// src/activities.ts
// Actividades: lógica real de negocio (llamadas a APIs, DB, emails, etc.)
// Temporal las ejecuta con reintentos automáticos si fallan.

import { log } from '@temporalio/activity';

export interface Pedido {
    id: string;
    cliente: string;
    producto: string;
    monto: number;
    moneda: string;
}

// Simula guardar el pedido en la base de datos
export async function guardarPedido(pedido: Pedido): Promise<void> {
    log.info('📦 Guardando pedido en la base de datos...', { pedidoId: pedido.id });
    // Aquí irías a tu DB real: await db.pedidos.create(pedido)
    await sleep(500);
    log.info('✅ Pedido guardado', { pedidoId: pedido.id });
}

// Simula enviar notificación al equipo de aprobación
export async function notificarAprobadores(pedido: Pedido): Promise<void> {
    log.info('📧 Enviando notificación a aprobadores...', { pedidoId: pedido.id });
    // Aquí enviarías email/Slack/WhatsApp real
    await sleep(300);
    log.info('📨 Notificación enviada', {
        mensaje: `Pedido #${pedido.id} de ${pedido.cliente} por ${pedido.monto} ${pedido.moneda} requiere aprobación`,
    });
}

// Simula procesar el pago después de aprobación
export async function procesarPago(pedido: Pedido): Promise<string> {
    log.info('💳 Procesando pago...', { pedidoId: pedido.id });
    await sleep(800);
    const transaccionId = `TXN-${Date.now()}`;
    log.info('✅ Pago procesado', { pedidoId: pedido.id, transaccionId });
    return transaccionId;
}

// Simula notificar al cliente del resultado
export async function notificarCliente(
    pedido: Pedido,
    aprobado: boolean,
    transaccionId?: string,
): Promise<void> {
    const estado = aprobado ? '✅ APROBADO' : '❌ RECHAZADO';
    log.info(`📲 Notificando al cliente: Pedido ${estado}`, {
        pedidoId: pedido.id,
        cliente: pedido.cliente,
    });
    await sleep(200);
}

// Simula cancelar el pedido
export async function cancelarPedido(pedido: Pedido, razon: string): Promise<void> {
    log.info('🚫 Cancelando pedido...', { pedidoId: pedido.id, razon });
    await sleep(300);
    log.info('🗑️ Pedido cancelado', { pedidoId: pedido.id });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
