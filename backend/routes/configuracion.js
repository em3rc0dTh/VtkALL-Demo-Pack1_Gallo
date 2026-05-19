import express from 'express';
import Taller from '../models/Taller.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// GET /api/configuracion (Público)
router.get('/', async (req, res) => {
  try {
    const taller = await Taller.findOne();
    if (!taller) {
      return res.status(404).json({ error: 'Configuración del taller no encontrada' });
    }
    res.json(taller);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del taller' });
  }
});

// PUT /api/configuracion (Protegido)
router.put('/', protegerRuta, async (req, res) => {
  try {
    const datos = req.body;
    
    let taller = await Taller.findOne();
    if (!taller) {
      taller = new Taller();
    }

    // Campos generales editables por todos (admin y soporte)
    if (datos.slogan !== undefined) taller.slogan = datos.slogan;
    if (datos.direccion !== undefined) taller.direccion = datos.direccion;
    if (datos.telefono !== undefined) taller.telefono = datos.telefono;
    if (datos.whatsapp !== undefined) taller.whatsapp = datos.whatsapp;
    if (datos.email !== undefined) taller.email = datos.email;
    if (datos.sobre_nosotros !== undefined) taller.sobre_nosotros = datos.sobre_nosotros;
    if (datos.anos_experiencia !== undefined) taller.anos_experiencia = datos.anos_experiencia;
    if (datos.clientes_atendidos !== undefined) taller.clientes_atendidos = datos.clientes_atendidos;
    if (datos.autos_reparados !== undefined) taller.autos_reparados = datos.autos_reparados;
    if (datos.galeria !== undefined) taller.galeria = datos.galeria;

    // Redes sociales (sub-documento)
    if (datos.redes_sociales) {
      if (!taller.redes_sociales) taller.redes_sociales = {};
      if (datos.redes_sociales.instagram !== undefined) taller.redes_sociales.instagram = datos.redes_sociales.instagram;
      if (datos.redes_sociales.facebook !== undefined) taller.redes_sociales.facebook = datos.redes_sociales.facebook;
      if (datos.redes_sociales.tiktok !== undefined) taller.redes_sociales.tiktok = datos.redes_sociales.tiktok;
    }

    // Config Agente (sub-documento)
    if (datos.config_agente) {
      if (!taller.config_agente) taller.config_agente = {};
      if (datos.config_agente.mensaje_bienvenida !== undefined) taller.config_agente.mensaje_bienvenida = datos.config_agente.mensaje_bienvenida;
      if (datos.config_agente.instrucciones_base !== undefined) taller.config_agente.instrucciones_base = datos.config_agente.instrucciones_base;
      if (datos.config_agente.avatar_url !== undefined) taller.config_agente.avatar_url = datos.config_agente.avatar_url;
      
      // Nombre de agente solo editable por soporte
      if (req.usuario.rol === 'soporte' && datos.config_agente.nombre_agente !== undefined) {
        taller.config_agente.nombre_agente = datos.config_agente.nombre_agente;
      }
    }

    // Campos restringidos únicamente a rol 'soporte'
    if (req.usuario.rol === 'soporte') {
      if (datos.nombre_taller !== undefined) taller.nombre_taller = datos.nombre_taller;
      if (datos.webhook_url !== undefined) taller.webhook_url = datos.webhook_url;
    }

    await taller.save();
    res.json({ ok: true, taller });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración del taller' });
  }
});

export default router;
