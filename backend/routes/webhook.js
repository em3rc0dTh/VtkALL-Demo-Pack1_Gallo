import express from 'express';
import Cliente from '../models/Cliente.js';
import Mensaje from '../models/Mensaje.js';
import Taller from '../models/Taller.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { procesarMensajeIA } from '../services/gemini.js';
import { crearRespuestaTwiML } from '../services/twilio.js';

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
    const respuestaFinalIA = respuestaIA || `¡Hola! Soy ${nombreAgente}, el asistente virtual de ${nombreTaller}. ¿En qué te puedo ayudar hoy? 🔧`;

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

export default router;
