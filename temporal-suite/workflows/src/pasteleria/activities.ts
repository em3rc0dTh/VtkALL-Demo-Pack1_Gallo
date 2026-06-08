import { log } from '@temporalio/activity';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785/api';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'your-secret-api-key';
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';

export interface DetallesCotizacion {
  precioFinal: number;
  ingredientes: string;
  fechaEntrega: string;
  imagenUrl?: string;
  detallesExtra?: string;
}

export interface PedidoData {
  pedidoId: string;
  numeroWhatsApp: string;
  clienteNombre: string;
  descripcionInicial: string;
}

/**
 * Llama al backend para actualizar el estado del pedido a 'revision_maestro'
 */
export async function notificarPastelero(data: PedidoData): Promise<void> {
  log.info('Notificando al pastelero sobre nuevo pedido', { pedidoId: data.pedidoId });
  try {
    await axios.put(`${BACKEND_URL}/api/citas/${data.pedidoId}`, {
      estado: 'revision_maestro'
    });
  } catch (error) {
    log.error('Error notificando pastelero', { error });
    // Lanzar el error para que Temporal reintente
    throw new Error('Fallo al contactar el backend');
  }
}

/**
 * Llama al API de openwa para enviar la cotización por WhatsApp al cliente
 */
export async function enviarCotizacionWhatsApp(
  data: PedidoData, 
  cotizacion: DetallesCotizacion
): Promise<void> {
  log.info('Enviando cotización por WhatsApp', { numero: data.numeroWhatsApp, pedidoId: data.pedidoId });
  
  // Dar formato al número (openwa normalmente requiere el sufijo @c.us o formato internacional puro)
  let chatId = data.numeroWhatsApp;
  if (!chatId.includes('@c.us')) {
    chatId = `${chatId.replace(/[^0-9]/g, '')}@c.us`;
  }

  const mensajeTexto = `¡Hola ${data.clienteNombre}! 🍰\n\nAquí tienes la cotización de tu pastel:\n\n*Detalles:*\n${data.descripcionInicial}\n\n*Ingredientes/Receta:*\n${cotizacion.ingredientes}\n\n*Fecha Confirmada de Entrega:*\n${cotizacion.fechaEntrega}\n\n*Costo Final:*\nS/. ${cotizacion.precioFinal.toFixed(2)}\n\n¿Estás de acuerdo con esta cotización para poder agendarlo y empezar a prepararlo? Responde con *Sí acepto* para confirmar.`;

  try {
    // 1. Enviar imagen si existe
    if (cotizacion.imagenUrl) {
      await axios.post(
        `${OPENWA_API_URL}/sessions/${OPENWA_SESSION_ID}/messages/send-image`,
        {
          chatId,
          url: cotizacion.imagenUrl,
          caption: 'Referencia del pastel'
        },
        { headers: { 'X-API-Key': OPENWA_API_KEY } }
      );
    }

    // 2. Enviar mensaje de texto
    await axios.post(
      `${OPENWA_API_URL}/sessions/${OPENWA_SESSION_ID}/messages/send-text`,
      {
        chatId,
        text: mensajeTexto
      },
      { headers: { 'X-API-Key': OPENWA_API_KEY } }
    );
    log.info('WhatsApp enviado correctamente');
  } catch (error: any) {
    log.error('Error enviando mensaje por openwa', { error: error?.response?.data || error.message });
    throw new Error('Fallo al enviar WhatsApp con openwa');
  }
}

/**
 * Llama al backend para actualizar el estado del pedido a 'produccion'
 */
export async function marcarPedidoAprobado(pedidoId: string): Promise<void> {
  log.info('Marcando pedido como aprobado/producción', { pedidoId });
  try {
    await axios.put(`${BACKEND_URL}/api/citas/${pedidoId}`, {
      estado: 'produccion', // Mover a la bandeja de ejecución/producción
      estado_trabajo: 'pendiente'
    });
  } catch (error) {
    log.error('Error marcando pedido como aprobado', { error });
    throw new Error('Fallo al contactar el backend');
  }
}

/**
 * Llama al backend para actualizar el estado del pedido a 'cancelado' (o archivado)
 */
export async function marcarPedidoCancelado(pedidoId: string): Promise<void> {
  log.info('Marcando pedido como cancelado', { pedidoId });
  try {
    await axios.put(`${BACKEND_URL}/api/citas/${pedidoId}`, {
      estado: 'cancelado'
    });
  } catch (error) {
    log.error('Error marcando pedido como cancelado', { error });
    throw new Error('Fallo al contactar el backend');
  }
}
