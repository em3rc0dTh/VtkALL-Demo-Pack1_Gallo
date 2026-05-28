import express from 'express';
import Cliente from '../models/Cliente.js';
import Mensaje from '../models/Mensaje.js';
import Taller from '../models/Taller.js';
import Cita from '../models/Cita.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { procesarMensajeIA, ejecutarTool } from '../services/gemini.js';
import { crearRespuestaTwiML } from '../services/twilio.js';
import { calcularSlots, formatearFechaHoraEsp } from '../utils/fechas.js';

const router = express.Router();

// Webhook endpoint (sin protección JWT, rate-limited por número)
router.post('/whatsapp', rateLimiter('telefono', 15, 60000), async (req, res) => {
  const fromValue = req.body.From || '';
  const bodyValue = req.body.Body || '';
  
  if (!fromValue || !bodyValue) {
    // Si no es un webhook real de Twilio, tal vez es nuestro simulador mandando JSON
    const { from, body } = req.body;
    if (from && body) {
      return await procesarSimulacionInterna(from, body, res);
    }
    return res.status(400).send('Faltan parámetros From o Body');
  }

  const numeroTelefono = fromValue.replace('whatsapp:', '').trim();
  const mensajeContenido = bodyValue.trim();

  await procesarMensajeCompleto(numeroTelefono, mensajeContenido, res, true);
});

// Función de conveniencia para simulaciones internas desde el dashboard/chat local
const procesarSimulacionInterna = async (from, body, res) => {
  const numeroTelefono = from.replace('whatsapp:', '').trim();
  const mensajeContenido = body.trim();
  await procesarMensajeCompleto(numeroTelefono, mensajeContenido, res, false);
};

const procesarMensajeCompleto = async (numeroTelefono, mensajeContenido, res, esXML) => {
  try {
    // 1. Buscar o crear cliente
    let cliente = await Cliente.findOne({ numero_telefono: numeroTelefono });
    if (!cliente) {
      cliente = new Cliente({
        numero_telefono: numeroTelefono,
        nombre: '',
        vehiculos: []
      });
      await cliente.save();
    }

    // 2. Guardar el mensaje del cliente en la base de datos
    const mensajeCliente = new Mensaje({
      numero_telefono: numeroTelefono,
      nombre_cliente: cliente.nombre || 'Cliente',
      contenido: mensajeContenido,
      remitente: 'cliente'
    });
    await mensajeCliente.save();

    // 3. Procesar el mensaje con Gemini/chatbot simulado
    const respuestaIA = await procesarMensajeIA(numeroTelefono, mensajeContenido);

    // 3.5 Verificar si hubo migración de sesión web a teléfono real
    let telefonoFinal = numeroTelefono;
    let clienteFinal = cliente;
    try {
      const msgVerificado = await Mensaje.findById(mensajeCliente._id);
      if (msgVerificado && msgVerificado.numero_telefono !== numeroTelefono) {
        telefonoFinal = msgVerificado.numero_telefono;
        const clienteReal = await Cliente.findOne({ numero_telefono: telefonoFinal });
        if (clienteReal) {
          clienteFinal = clienteReal;
        }
      }
    } catch (checkErr) {
      console.error('Error al verificar migración de teléfono:', checkErr);
    }

    // Obtener información básica de taller para respuesta por defecto
    const tallerInfo = await Taller.findOne();
    const nombreAgente = tallerInfo?.config_agente?.nombre_agente || 'Max';
    const nombreTaller = tallerInfo?.nombre_taller || 'nuestro taller';
    const respuestaFinalIA = respuestaIA || `¡Hola! Soy ${nombreAgente}, del equipo de ${nombreTaller}. ¿En qué te puedo ayudar hoy? 🔧`;

    // 4. Guardar la respuesta del asistente en la base de datos
    const mensajeAsistente = new Mensaje({
      numero_telefono: telefonoFinal,
      nombre_cliente: clienteFinal.nombre || 'Cliente',
      contenido: respuestaFinalIA,
      remitente: 'asistente'
    });
    await mensajeAsistente.save();

    // 5. Devolver la respuesta en el formato correspondiente
    if (esXML) {
      res.set('Content-Type', 'text/xml');
      return res.send(crearRespuestaTwiML(respuestaFinalIA));
    } else {
      return res.json({
        ok: true,
        cliente: {
          nombre: clienteFinal.nombre,
          numero_telefono: telefonoFinal
        },
        respuesta: respuestaFinalIA
      });
    }
  } catch (error) {
    console.error(`🔴 Error procesando mensaje de WhatsApp para ${numeroTelefono}:`, error);
    
    const taller = await Taller.findOne();
    const telefonoTaller = taller?.telefono || '+54 11 4789-3210';
    const fallbackMensaje = `Disculpá, estoy teniendo inconvenientes técnicos. Llamanos al ${telefonoTaller} o volvé a escribir en unos minutos. 🔧`;
    
    if (esXML) {
      res.set('Content-Type', 'text/xml');
      return res.send(crearRespuestaTwiML(fallbackMensaje));
    } else {
      return res.status(500).json({ ok: false, error: fallbackMensaje });
    }
  }
};

// GET /api/webhook/historial/:telefono
router.get('/historial/:telefono', async (req, res) => {
  try {
    const { telefono } = req.params;
    const mensajes = await Mensaje.find({ numero_telefono: telefono }).sort({ recibido_en: 1 });
    const cliente = await Cliente.findOne({ numero_telefono: telefono });
    res.json({ ok: true, mensajes, cliente });
  } catch (error) {
    console.error('Error al obtener historial público:', error);
    res.status(500).json({ error: 'Error del servidor al obtener historial' });
  }
});

// GET /api/webhook/disponibilidad
router.get('/disponibilidad', async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha es requerida' });
    }
    const inicioDia = new Date(`${fecha}T00:00:00`);
    const finDia = new Date(`${fecha}T23:59:59`);
    
    const citas = await Cita.find({
      fecha_cita: { $gte: inicioDia, $lte: finDia },
      estado: { $ne: 'cancelada' }
    });
    
    const taller = await Taller.findOne();
    const slots = calcularSlots(fecha, citas, taller);
    res.json({ ok: true, ...slots });
  } catch (error) {
    console.error('Error al obtener disponibilidad pública:', error);
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

// POST /api/webhook/agendar
router.post('/agendar', async (req, res) => {
  try {
    const {
      numero_telefono,
      nombre_cliente,
      dni,
      servicio,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_anio,
      fecha_cita,
      evaluation_type,
      imagenes,
      _session_telefono
    } = req.body;

    if (!numero_telefono || !nombre_cliente || !dni || !servicio || !fecha_cita) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Traducir evaluation_type (modality) a tipo_cita
    let tipo_cita = 'Evaluación Presencial';
    if (evaluation_type === 'VIRTUAL_FOTOS') {
      tipo_cita = 'Evaluación con Fotos';
    } else if (evaluation_type === 'LLAMADA_CIEGAS') {
      tipo_cita = 'Llamada Directa';
    }

    // Usar la función agendar_cita del ejecutor de base de datos
    const resAgendamiento = await ejecutarTool('agendar_cita', {
      numero_telefono,
      nombre_cliente,
      dni,
      servicio,
      descripcion_trabajo: 'Cita agendada vía Calendario Interactivo Web',
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_anio: vehiculo_anio ? parseInt(vehiculo_anio) : undefined,
      fecha_cita,
      tipo_cita,
      imagenes: imagenes || [],
      _session_telefono
    });

    if (resAgendamiento.error) {
      return res.status(400).json({ error: resAgendamiento.error });
    }

    const telefonoFinal = numero_telefono;

    // Registrar en el chat la solicitud del cliente y la confirmación del asistente
    const msgCliente = new Mensaje({
      numero_telefono: telefonoFinal,
      nombre_cliente: nombre_cliente,
      contenido: `[Reserva por Calendario] Solicito turno para ${servicio} el día ${formatearFechaHoraEsp(fecha_cita)}.`,
      remitente: 'cliente',
      procesado: true
    });
    await msgCliente.save();

     const msgAsistente = new Mensaje({
      numero_telefono: telefonoFinal,
      nombre_cliente: nombre_cliente,
      contenido: `¡Excelente elección! He registrado tu solicitud de cita para ${servicio} el día ${formatearFechaHoraEsp(fecha_cita)}. Queda pendiente de confirmación por el administrador del taller. El precio estimado es de S/. ${resAgendamiento.cita.precio_estimado || 0}. ¡Te avisaremos pronto! 🚗🔧`,
      remitente: 'asistente',
      procesado: true
    });
    await msgAsistente.save();

    res.json({ ok: true, cita: resAgendamiento.cita });
  } catch (error) {
    console.error('Error al agendar cita pública:', error);
    res.status(500).json({ error: 'Error del servidor al agendar la cita' });
  }
});

export default router;
