import express from 'express';
import { env } from '../config/env.js';
import Cliente from '../models/Cliente.js';
import Mensaje from '../models/Mensaje.js';
import Taller from '../models/Taller.js';
import Cita from '../models/Cita.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { procesarMensajeIA, ejecutarTool } from '../services/gemini.js';
import { crearRespuestaTwiML, enviarMensajeWhatsApp } from '../services/twilio.js';
import { calcularSlots, formatearFechaHoraEsp } from '../utils/fechas.js';

const processedMessages = new Set();
setInterval(() => {
  processedMessages.clear();
}, 5 * 60 * 1000); // limpiar caché cada 5 minutos

const router = express.Router();

// Webhook endpoint (sin protección JWT, rate-limited por número)
router.post('/whatsapp', rateLimiter('telefono', 15, 60000), async (req, res) => {
  // 1. Detectar si es un webhook de OpenWA
  const isOpenwa = req.body.event === 'message' || req.body.event === 'message.received' || (req.body.type === 'message' && req.body.data);
  if (isOpenwa) {
    const payload = req.body.payload || req.body.data;
    if (payload && !payload.fromMe) {
      if (payload.id && processedMessages.has(payload.id)) {
        console.log(`ℹ️ [OpenWA Webhook] Omitiendo mensaje duplicado: ${payload.id}`);
        return res.json({ ok: true, note: 'duplicate_ignored' });
      }
      if (payload.id) {
        processedMessages.add(payload.id);
      }

      let numeroTelefono = payload.from.split('@')[0];
      const mensajeContenido = payload.body || payload.text;
      
      if (numeroTelefono && mensajeContenido) {
        // Si el remitente es un LID (ej. termina en @lid), intentar resolver su número de teléfono real
        if (payload.from && payload.from.endsWith('@lid')) {
          try {
            // 1. Intentar buscar primero en nuestra base de datos local el mapeo de LID
            // Puede haber más de un cliente con este LID si se creó uno "sucio" con numero = LID.
            const clientsWithLid = await Cliente.find({ 
              $or: [
                { whatsapp_lid: payload.from },
                { whatsapp_lids: payload.from }
              ] 
            });
            
            if (clientsWithLid && clientsWithLid.length > 0) {
              // Ordenar por longitud del numero_telefono ascendente (los reales son de 9-12 digitos, los LID son 14+)
              clientsWithLid.sort((a, b) => a.numero_telefono.length - b.numero_telefono.length);
              const bestClient = clientsWithLid[0];
              console.log(`ℹ️ [OpenWA Webhook] LID ${payload.from} resuelto vía DB local a teléfono: ${bestClient.numero_telefono}`);
              numeroTelefono = bestClient.numero_telefono;
            } else {
              // 2. Si no está en DB, hacer fallback consultando a la API de OpenWA
              const openwaUrl = env.openwaApiUrl;
              const openwaKey = env.openwaApiKey;
              const openwaSession = env.openwaSessionName;
              
              if (openwaUrl) {
                // Resolver UUID de la sesión
                let resolvedSessionId = openwaSession;
                const listRes = await fetch(`${openwaUrl}/sessions`, {
                  headers: { 'X-API-Key': openwaKey || '' }
                });
                if (listRes.ok) {
                  const sessions = await listRes.json();
                  const match = sessions.find(s => s.name === openwaSession);
                  if (match) {
                    resolvedSessionId = match.id;
                  }
                }
                
                // Consultar contacto
                const contactRes = await fetch(`${openwaUrl}/sessions/${resolvedSessionId}/contacts/${encodeURIComponent(payload.from)}`, {
                  headers: { 'X-API-Key': openwaKey || '' }
                });
                if (contactRes.ok) {
                  const contactData = await contactRes.json();
                  if (contactData && contactData.number) {
                    console.log(`ℹ️ [OpenWA Webhook] Resolviendo LID ${payload.from} a número de teléfono vía API: ${contactData.number}`);
                    if (contactData.number !== payload.from.split('@')[0]) {
                      numeroTelefono = contactData.number;
                    }
                  }
                } else {
                  console.warn(`⚠️ [OpenWA Webhook] Falló obtener contacto para LID ${payload.from}. Status: ${contactRes.status}`);
                }
              }
            }
          } catch (err) {
            console.error(`🔴 [OpenWA Webhook] Error resolviendo LID ${payload.from}:`, err);
          }
        }

        const isLid = payload.from && payload.from.endsWith('@lid');
        await procesarMensajeCompleto(numeroTelefono, mensajeContenido, res, false, true, [], isLid ? payload.from : null);
        return;
      }
    }
    return res.json({ ok: true, note: 'ignored_or_empty' });
  }

  // 2. Flujo de Twilio o Simulador
  const fromValue = req.body.From || '';
  const bodyValue = req.body.Body || '';
  
  if (!fromValue || !bodyValue) {
    // Si no es un webhook real de Twilio, tal vez es nuestro simulador mandando JSON
    const { from, body, adjuntos } = req.body;
    if (from && body) {
      return await procesarSimulacionInterna(from, body, res, adjuntos);
    }
    return res.status(400).send('Faltan parámetros From o Body');
  }

  const numeroTelefono = fromValue.replace('whatsapp:', '').trim();
  const mensajeContenido = bodyValue.trim();

  await procesarMensajeCompleto(numeroTelefono, mensajeContenido, res, true, false);
});

// Función de conveniencia para simulaciones internas desde el dashboard/chat local
const procesarSimulacionInterna = async (from, body, res, adjuntos = []) => {
  const numeroTelefono = from.replace('whatsapp:', '').trim();
  const mensajeContenido = body.trim();
  await procesarMensajeCompleto(numeroTelefono, mensajeContenido, res, false, false, adjuntos);
};

const procesarMensajeCompleto = async (numeroTelefono, mensajeContenido, res, esXML, enviarProactivo = false, adjuntos = [], originalLid = null) => {
  try {
    // Normalizar número de teléfono (quitar caracteres no numéricos y prefijo 51 de país si existe para la búsqueda)
    const numeroLimpio = numeroTelefono.replace(/[^0-9]/g, '');
    let numeroPeruano = numeroLimpio;
    if (numeroLimpio.length === 11 && numeroLimpio.startsWith('51')) {
      numeroPeruano = numeroLimpio.substring(2);
    }

    // 1. Buscar cliente usando coincidencia flexible (exacto, peruano local, con prefijo o LID)
    const clienteQuery = {
      $or: [
        { numero_telefono: numeroTelefono },
        { numero_telefono: numeroPeruano },
        { numero_telefono: '51' + numeroPeruano }
      ]
    };
    // Solo agregar búsqueda por LID si tenemos un LID real
    if (originalLid) {
      // Buscar en el array whatsapp_lids (nuevo) y en whatsapp_lid (legacy)
      clienteQuery.$or.unshift({ whatsapp_lids: originalLid });
      clienteQuery.$or.unshift({ whatsapp_lid: originalLid });
    }
    let cliente = await Cliente.findOne(clienteQuery);
    
    if (!cliente) {
      cliente = new Cliente({
        numero_telefono: numeroPeruano,
        nombre: '',
        whatsapp_lids: originalLid ? [originalLid] : [],
        whatsapp_lid: originalLid || undefined,
        vehiculos: []
      });
      await cliente.save();
    } else if (originalLid) {
      // Agregar LID al array si no está ya (nunca sobreescribir)
      const needsUpdate = !cliente.whatsapp_lids?.includes(originalLid);
      if (needsUpdate) {
        await Cliente.findByIdAndUpdate(cliente._id, {
          $addToSet: { whatsapp_lids: originalLid }
        });
        if (!cliente.whatsapp_lids) cliente.whatsapp_lids = [];
        cliente.whatsapp_lids.push(originalLid);
      }
    }

    // Usar el número oficial del cliente para todo el flujo interno y chatbot
    const telefonoProcesamiento = cliente.numero_telefono;

    // 2. Guardar el mensaje del cliente en la base de datos usando el número unificado
    const mensajeCliente = new Mensaje({
      numero_telefono: telefonoProcesamiento,
      nombre_cliente: cliente.nombre || 'Cliente',
      contenido: mensajeContenido,
      remitente: 'cliente',
      adjuntos: adjuntos || []
    });
    await mensajeCliente.save();

    // 3. Procesar el mensaje
    let respuestaFinalIA = '';
    
    if (enviarProactivo) {
      // Flujo simplificado para WhatsApp
      const msgClean = mensajeContenido.toLowerCase().trim();
      const esConfirmacion = ['sí', 'si', 'confirmar', 'confirmo', 'correcto', 'ok', 'dale', 'afirmativo'].includes(msgClean) || msgClean === 'si' || msgClean === 'sí' || msgClean.startsWith('si ') || msgClean.startsWith('sí ') || msgClean.includes('confirmar') || msgClean.includes('confirmada') || msgClean.includes('confirmado');
      const esCancelacion = ['no', 'cancelar', 'cancelo', 'rechazar', 'no iré', 'no ire', 'negativo'].includes(msgClean) || msgClean === 'no' || msgClean.startsWith('no ') || msgClean.includes('cancelar') || msgClean.includes('cancela') || msgClean.includes('cancelo');

      const tallerInfo = await Taller.findOne();
      const nombreAgente = tallerInfo?.config_agente?.nombre_agente || 'Esperanza';

      if (esConfirmacion || esCancelacion) {
        // Buscar todas las citas activas para este cliente que tengan recordatorio enviado y confirmación pendiente
        const citasRecordatorio = await Cita.find({
          $or: [
            { cliente: cliente._id },
            { numero_telefono: { $in: [telefonoProcesamiento, numeroPeruano, '51' + numeroPeruano, '+51' + numeroPeruano, '+' + telefonoProcesamiento] } }
          ],
          recordatorio_enviado: true,
          estado_confirmacion: 'pendiente',
          estado: { $in: ['confirmada', 'pendiente_confirmacion'] }
        }).sort({ fecha_cita: 1 });

        if (citasRecordatorio && citasRecordatorio.length > 0) {
          if (esConfirmacion) {
            // Confirmar todas las citas encontradas
            for (const cita of citasRecordatorio) {
              cita.estado_confirmacion = 'confirmada_cliente';
              if (cita.estado === 'pendiente_confirmacion') {
                cita.estado = 'confirmada';
              }
              await cita.save();
            }

            if (citasRecordatorio.length === 1) {
              respuestaFinalIA = `¡Muchas gracias! Tu asistencia para el día ${formatearFechaHoraEsp(citasRecordatorio[0].fecha_cita)} ha sido confirmada con éxito. Te esperamos. 🚗🔧`;
            } else {
              const fechasCitas = citasRecordatorio.map(c => `- ${formatearFechaHoraEsp(c.fecha_cita)}`).join('\n');
              respuestaFinalIA = `¡Muchas gracias! Tus asistencias han sido confirmadas con éxito para las siguientes citas:\n${fechasCitas}\nTe esperamos. 🚗🔧`;
            }
          } else {
            // Cancelar todas las citas encontradas
            for (const cita of citasRecordatorio) {
              cita.estado = 'cancelada';
              cita.estado_confirmacion = 'cancelada_cliente';
              await cita.save();
            }

            if (citasRecordatorio.length === 1) {
              respuestaFinalIA = `Entendido, tu cita para el día ${formatearFechaHoraEsp(citasRecordatorio[0].fecha_cita)} ha sido cancelada. Gracias por avisar. 🔧`;
            } else {
              const fechasCitas = citasRecordatorio.map(c => `- ${formatearFechaHoraEsp(c.fecha_cita)}`).join('\n');
              respuestaFinalIA = `Entendido, tus citas para las siguientes fechas han sido canceladas:\n${fechasCitas}\nGracias por avisar. 🔧`;
            }
          }
        } else {
          // No se encontró ninguna cita pendiente para confirmar/cancelar
          respuestaFinalIA = `Para cualquier consulta o reprogramación, por favor ingresa a nuestra página web o comunícate con ${nombreAgente}, parte de nuestro equipo de soporte al cliente.`;
        }
      } else {
        // Cualquier otro mensaje diferente de Sí/No
        respuestaFinalIA = `Para cualquier consulta o reprogramación, por favor ingresa a nuestra página web o comunícate con ${nombreAgente}, parte de nuestro equipo de soporte al cliente.`;
      }
    } else {
      // Flujo conversacional completo con Gemini (para el simulador local)
      respuestaFinalIA = await procesarMensajeIA(telefonoProcesamiento, mensajeContenido, adjuntos || []);
    }

    // 3.5 Verificar si hubo migración de sesión web a teléfono real
    let telefonoFinal = telefonoProcesamiento;
    let clienteFinal = cliente;
    try {
      const msgVerificado = await Mensaje.findById(mensajeCliente._id);
      if (msgVerificado && msgVerificado.numero_telefono !== telefonoProcesamiento) {
        telefonoFinal = msgVerificado.numero_telefono;
        const phoneClean = telefonoFinal.replace(/[^0-9]/g, '');
        const phonePeru = phoneClean.length === 11 && phoneClean.startsWith('51') ? phoneClean.substring(2) : phoneClean;
        const clienteReal = await Cliente.findOne({
          $or: [
            { numero_telefono: telefonoFinal },
            { numero_telefono: phonePeru },
            { numero_telefono: '51' + phonePeru }
          ]
        });
        if (clienteReal) {
          clienteFinal = clienteReal;
        }
      }
    } catch (checkErr) {
      console.error('Error al verificar migración de teléfono:', checkErr);
    }

    // Obtener información básica de taller para respuesta por defecto si no se definió una antes
    if (!respuestaFinalIA) {
      const tallerInfo = await Taller.findOne();
      const nombreAgente = tallerInfo?.config_agente?.nombre_agente || 'Max';
      const nombreTaller = tallerInfo?.nombre_taller || 'nuestro taller';
      respuestaFinalIA = `¡Hola! Soy ${nombreAgente}, del equipo de ${nombreTaller}. ¿En qué te puedo ayudar hoy? 🔧`;
    }

    // 4. Guardar la respuesta del asistente en la base de datos
    const mensajeAsistente = new Mensaje({
      numero_telefono: telefonoFinal,
      nombre_cliente: clienteFinal.nombre || 'Cliente',
      contenido: respuestaFinalIA,
      remitente: 'asistente'
    });
    await mensajeAsistente.save();

    // 5. Devolver la respuesta en el formato correspondiente
    if (enviarProactivo) {
      try {
        await enviarMensajeWhatsApp(telefonoFinal, respuestaFinalIA, clienteFinal._id, originalLid);
      } catch (sendErr) {
        console.error('Error al enviar respuesta proactiva por WhatsApp (OpenWA):', sendErr);
      }
    }

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
    console.error(`🔴 Error procesando mensaje de WhatsApp para ${telefonoProcesamiento}:`, error);
    
    const taller = await Taller.findOne();
    const telefonoTaller = taller?.telefono || '+54 11 4789-3210';
    const fallbackMensaje = `Disculpá, estoy teniendo inconvenientes técnicos. Llamanos al ${telefonoTaller} o volvé a escribir en unos minutos. 🔧`;
    
    if (enviarProactivo) {
      try {
        await enviarMensajeWhatsApp(telefonoProcesamiento, fallbackMensaje);
      } catch (sendErr) {
        console.error('Error al enviar mensaje de error proactivo por WhatsApp (OpenWA):', sendErr);
      }
    }

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
      producto_id,
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_patente,
      vehiculo_anio,
      fecha_cita,
      evaluation_type,
      imagenes,
      _session_telefono
    } = req.body;

    if (!numero_telefono || !nombre_cliente || !servicio || !fecha_cita || !vehiculo_marca || !vehiculo_modelo || !vehiculo_patente) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (Teléfono, Nombre, Servicio, Fecha, Marca, Modelo y Placa son requeridos)' });
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
      dni: dni || '',
      servicio,
      producto_id,
      descripcion_trabajo: 'Cita agendada vía Calendario Interactivo Web',
      vehiculo_marca,
      vehiculo_modelo,
      vehiculo_patente,
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
