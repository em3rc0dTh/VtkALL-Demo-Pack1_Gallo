import { 
  proxyActivities, 
  defineSignal, 
  defineQuery, 
  setHandler, 
  condition, 
  log 
} from '@temporalio/workflow';
import type * as activitiesTypes from './activities';
import type { PedidoData, DetallesCotizacion } from './activities';

// Conectar con las actividades con reintentos configurados
const acts = proxyActivities<typeof activitiesTypes>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 5,
    initialInterval: '2 seconds',
    backoffCoefficient: 2,
    maximumInterval: '30 seconds',
  },
});

// Señales (Inputs externos)
// El maestro pastelero llena el formulario y envía estos detalles
export const bakerReviewSignal = defineSignal<[DetallesCotizacion]>('bakerReview');

// El cliente responde por WhatsApp
export const clientApprovalSignal = defineSignal<[boolean]>('clientApproval');

// Queries (Consultar estado interno del workflow)
export const getStatusQuery = defineQuery<string>('getStatus');

export async function pastryOrderWorkflow(data: PedidoData): Promise<void> {
  // Estado interno del workflow
  let status = 'INICIO';
  let cotizacionFinal: DetallesCotizacion | null = null;
  let clientApproved: boolean | null = null;

  // Registrar manejadores
  setHandler(getStatusQuery, () => status);

  setHandler(bakerReviewSignal, (detalles: DetallesCotizacion) => {
    log.info('Señal bakerReview recibida', { pedidoId: data.pedidoId });
    cotizacionFinal = detalles;
  });

  setHandler(clientApprovalSignal, (approved: boolean) => {
    log.info('Señal clientApproval recibida', { pedidoId: data.pedidoId, approved });
    clientApproved = approved;
  });

  try {
    // 1. Notificar al pastelero (asegurar estado inicial)
    status = 'ESPERANDO_PASTELERO';
    await acts.notificarPastelero(data);

    // 2. Esperar durablemente la cotización del pastelero (sin límite de tiempo)
    log.info('Esperando cotización del pastelero...');
    await condition(() => cotizacionFinal !== null);

    // 3. Enviar cotización por WhatsApp al cliente
    status = 'ESPERANDO_CLIENTE';
    log.info('Cotización recibida, enviando al cliente...');
    await acts.enviarCotizacionWhatsApp(data, cotizacionFinal!);

    // 4. Esperar respuesta del cliente (máximo 48 horas)
    log.info('Esperando respuesta del cliente por WhatsApp...');
    const clienteRespondio = await condition(() => clientApproved !== null, '48 hours');

    if (!clienteRespondio) {
      // Timeout
      log.info('El cliente no respondió a tiempo. Cancelando pedido.');
      status = 'CANCELADO_POR_TIMEOUT';
      await acts.marcarPedidoCancelado(data.pedidoId);
      return;
    }

    if (clientApproved === false) {
      log.info('El cliente rechazó la cotización.');
      status = 'RECHAZADO_POR_CLIENTE';
      await acts.marcarPedidoCancelado(data.pedidoId);
      return;
    }

    // 5. El cliente aceptó, mover a producción
    log.info('¡El cliente aceptó la cotización! Moviendo a producción.');
    status = 'PRODUCCION';
    await acts.marcarPedidoAprobado(data.pedidoId);

  } catch (err) {
    log.error('Error fatal en el workflow de pastelería', { error: err });
    status = 'ERROR_FATAL';
    throw err;
  }
}
