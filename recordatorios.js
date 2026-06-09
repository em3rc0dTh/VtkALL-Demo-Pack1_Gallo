import Cita from '../models/Cita.js';
import Mensaje from '../models/Mensaje.js';
import Taller from '../models/Taller.js';
import { enviarMensajeWhatsApp } from './twilio.js';
import { formatearFechaHoraEsp } from '../utils/fechas.js';

/**
 * Procesa el envío de recordatorios de citas de 14 a 26 horas antes de la misma,
 * y cancela automáticamente aquellas que no fueron confirmadas tras 10 horas del recordatorio.
 */
export const procesarRecordatoriosYCancelaciones = async () => {
  try {
    const taller = await Taller.findOne() || { nombre_taller: 'MecánicaPro' };
    const nombreTaller = taller.nombre_taller;

    // 1. ENVIAR RECORDATORIOS (Citas confirmadas por admin entre 14h y 26h en el futuro, no enviadas aún)
    const fechaInicio = new Date(Date.now() + 14 * 60 * 60 * 1000);
    const fechaFin = new Date(Date.now() + 26 * 60 * 60 * 1000);

    const citasParaNotificar = await Cita.find({
      fecha_cita: { $gte: fechaInicio, $lte: fechaFin },
      estado: 'confirmada', // Solo citas validadas/confirmadas por el admin
      recordatorio_enviado: false
    });

    for (const cita of citasParaNotificar) {
      const fechaFormateada = formatearFechaHoraEsp(cita.fecha_cita);
      const mensaje = `Hola ${cita.nombre_cliente}, te recordamos que tienes una cita de ${cita.servicio} para tu vehículo en ${nombreTaller} el ${fechaFormateada}. ¿Confirmas tu asistencia? Por favor responde SÍ para confirmar o NO para cancelar. Nota: Tienes un plazo de 10 horas para confirmar, de lo contrario liberaremos el horario. 🔧`;

      // Enviar WhatsApp
      await enviarMensajeWhatsApp(cita.numero_telefono, mensaje);

      // Actualizar cita
      cita.recordatorio_enviado = true;
      cita.fecha_recordatorio = new Date();
      cita.estado_confirmacion = 'pendiente';
      await cita.save();

      // Guardar el mensaje del asistente en el historial para visibilidad en el chat
      const msgHistorial = new Mensaje({
        numero_telefono: cita.numero_telefono,
        nombre_cliente: cita.nombre_cliente,
        contenido: mensaje,
        remitente: 'asistente'
      });
      await msgHistorial.save();

      console.log(`[Recordatorios] Recordatorio enviado a ${cita.nombre_cliente} (${cita.numero_telefono}) para cita de ${cita.servicio} el ${fechaFormateada}.`);
    }

    // 2. AUTO-CANCELACIÓN (Recordatorio enviado hace más de 10 horas y aún pendiente de responder por el cliente)
    const citasPendientesConfirmar = await Cita.find({
      recordatorio_enviado: true,
      estado_confirmacion: 'pendiente',
      estado: 'confirmada'
    });

    const ahora = new Date();
    for (const cita of citasPendientesConfirmar) {
      const horasDesdeRecordatorio = cita.fecha_recordatorio ? (ahora.getTime() - cita.fecha_recordatorio.getTime()) / (1000 * 60 * 60) : 0;

      // Si ha pasado más de 10 horas desde que se envió el recordatorio
      if (horasDesdeRecordatorio >= 10) {
        // Cancelar cita
        cita.estado = 'cancelada';
        cita.estado_confirmacion = 'cancelada_cliente';
        await cita.save();

        // Enviar WhatsApp de cancelación
        const mensajeCancelacion = `Hola ${cita.nombre_cliente}, debido a que no recibimos confirmación en las últimas 10 horas, hemos liberado y cancelado tu cita de ${cita.servicio} del ${formatearFechaHoraEsp(cita.fecha_cita)}. Si deseas agendar otro horario, no dudes en escribirnos. 🔧`;
        await enviarMensajeWhatsApp(cita.numero_telefono, mensajeCancelacion);

        // Guardar mensaje en historial
        const msgHistorial = new Mensaje({
          numero_telefono: cita.numero_telefono,
          nombre_cliente: cita.nombre_cliente,
          contenido: mensajeCancelacion,
          remitente: 'asistente'
        });
        await msgHistorial.save();

        console.log(`[Recordatorios] Cita de ${cita.nombre_cliente} (${cita.numero_telefono}) auto-cancelada por falta de confirmación tras 10 horas.`);
      }
    }
  } catch (err) {
    console.error(`🔴 [Recordatorios] Error en el procesamiento de recordatorios/cancelaciones:`, err);
  }
};
