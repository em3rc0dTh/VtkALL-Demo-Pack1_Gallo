import express from 'express';
import Mensaje from '../models/Mensaje.js';
import Cliente from '../models/Cliente.js';
import { protegerRuta } from '../middleware/auth.js';
import { enviarMensajeWhatsApp } from '../services/twilio.js';

const router = express.Router();

// GET /api/mensajes/conversaciones
router.get('/conversaciones', protegerRuta, async (req, res) => {
  try {
    const conversaciones = await Mensaje.aggregate([
      { $sort: { recibido_en: -1 } },
      {
        $group: {
          _id: '$numero_telefono',
          ultimo_mensaje: { $first: '$contenido' },
          remitente_ultimo: { $first: '$remitente' },
          recibido_en: { $first: '$recibido_en' },
          no_leidos: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$remitente', 'cliente'] }, { $eq: ['$procesado', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { recibido_en: -1 } }
    ]);

    // Buscar nombres de clientes
    const listado = await Promise.all(
      conversaciones.map(async (conv) => {
        const cliente = await Cliente.findOne({ numero_telefono: conv._id });
        return {
          numero_telefono: conv._id,
          nombre_cliente: cliente && cliente.nombre ? cliente.nombre : 'Cliente Nuevo',
          ultimo_mensaje: conv.ultimo_mensaje,
          remitente_ultimo: conv.remitente_ultimo,
          recibido_en: conv.recibido_en,
          no_leidos: conv.no_leidos
        };
      })
    );

    res.json({ conversaciones: listado });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({ error: 'Error del servidor al obtener conversaciones' });
  }
});

// GET /api/mensajes/:numero_telefono
router.get('/:numero_telefono', protegerRuta, async (req, res) => {
  try {
    const { numero_telefono } = req.params;
    
    // Obtener todos los mensajes
    const mensajes = await Mensaje.find({ numero_telefono }).sort({ recibido_en: 1 });
    
    // Buscar cliente asociado
    const cliente = await Cliente.findOne({ numero_telefono });

    // Marcar como leídos (procesados)
    await Mensaje.updateMany(
      { numero_telefono, remitente: 'cliente', procesado: false },
      { $set: { procesado: true } }
    );

    res.json({
      mensajes,
      cliente: cliente || { numero_telefono, nombre: 'Cliente Nuevo', vehiculos: [] }
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error del servidor al obtener mensajes' });
  }
});

// POST /api/mensajes/enviar-manual (envío desde el dashboard por parte del admin)
router.post('/enviar-manual', protegerRuta, async (req, res) => {
  try {
    const { numero_telefono, contenido } = req.body;
    if (!numero_telefono || !contenido) {
      return res.status(400).json({ error: 'Teléfono y contenido son requeridos' });
    }

    // Si es un número real, enviar vía WhatsApp real (OpenWA)
    const esTelefonoReal = !numero_telefono.startsWith('web_');
    if (esTelefonoReal) {
      await enviarMensajeWhatsApp(numero_telefono, contenido);
    }

    const mensaje = new Mensaje({
      numero_telefono,
      nombre_cliente: 'Dashboard Admin',
      contenido,
      remitente: 'asistente',
      procesado: true
    });
    await mensaje.save();

    res.status(201).json({ ok: true, mensaje });
  } catch (error) {
    console.error('Error al enviar mensaje manual:', error);
    res.status(500).json({ error: error.message || 'Error al enviar mensaje manual' });
  }
});

export default router;
