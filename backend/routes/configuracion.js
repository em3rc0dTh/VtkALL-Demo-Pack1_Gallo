import express from 'express';
import Taller from '../models/Taller.js';
import Producto from '../models/Producto.js';
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

    let realizarConversion = false;
    let rate = 1;

    if (datos.moneda && taller.moneda !== datos.moneda && datos.convertir_catalogo) {
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${taller.moneda}`);
        const data = await response.json();
        if (data && data.rates && data.rates[datos.moneda]) {
          rate = data.rates[datos.moneda];
          realizarConversion = true;
        }
      } catch (e) {
        console.error('Error al obtener tasa de cambio:', e);
      }
    }

    // Campos generales editables por todos (admin y soporte)
    if (datos.slogan !== undefined) taller.slogan = datos.slogan;
    if (datos.direccion !== undefined) taller.direccion = datos.direccion;
    if (datos.telefono !== undefined) taller.telefono = datos.telefono;
    if (datos.whatsapp !== undefined) taller.whatsapp = datos.whatsapp;
    if (datos.email !== undefined) taller.email = datos.email;
    if (datos.moneda !== undefined) taller.moneda = datos.moneda;
    if (datos.dias_historial_chat !== undefined) taller.dias_historial_chat = Number(datos.dias_historial_chat);
    if (datos.sobre_nosotros !== undefined) taller.sobre_nosotros = datos.sobre_nosotros;
    if (datos.anos_experiencia !== undefined) taller.anos_experiencia = datos.anos_experiencia;
    if (datos.clientes_atendidos !== undefined) taller.clientes_atendidos = datos.clientes_atendidos;
    if (datos.autos_reparados !== undefined) taller.autos_reparados = datos.autos_reparados;
    if (datos.galeria !== undefined) taller.galeria = datos.galeria;
    if (datos.brochure_url !== undefined) taller.brochure_url = datos.brochure_url;
    if (datos.promociones !== undefined) {
      if (Array.isArray(datos.promociones) && datos.promociones.length > 4) {
        return res.status(400).json({ error: 'Solo se permiten un máximo de 4 promociones a la vez' });
      }
      taller.promociones = datos.promociones;
    }
    if (datos.tema_global !== undefined) taller.tema_global = datos.tema_global;
    if (datos.constructor_bloques !== undefined) taller.constructor_bloques = datos.constructor_bloques;

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

    // Config Citas (sub-documento)
    if (datos.config_citas) {
      if (!taller.config_citas) taller.config_citas = {};
      if (datos.config_citas.hora_inicio !== undefined) taller.config_citas.hora_inicio = datos.config_citas.hora_inicio;
      if (datos.config_citas.hora_fin !== undefined) taller.config_citas.hora_fin = datos.config_citas.hora_fin;
      if (datos.config_citas.dias_permitidos !== undefined) {
        taller.config_citas.dias_permitidos = datos.config_citas.dias_permitidos;
      }
    }

    // Campos restringidos únicamente a rol 'soporte'
    if (req.usuario.rol === 'soporte') {
      if (datos.nombre_taller !== undefined) taller.nombre_taller = datos.nombre_taller;
      if (datos.webhook_url !== undefined) taller.webhook_url = datos.webhook_url;
      if (datos.url_fondo !== undefined) taller.url_fondo = datos.url_fondo;
    }

    await taller.save();

    if (realizarConversion) {
      if (taller.servicios && taller.servicios.length > 0) {
        taller.servicios.forEach(s => {
          if (typeof s.precio_base === 'number') {
            s.precio_base = Math.round(s.precio_base * rate * 100) / 100;
          }
        });
      }
      
      const productos = await Producto.find();
      for (const p of productos) {
        if (typeof p.precio === 'number') {
          p.precio = Math.round(p.precio * rate * 100) / 100;
          await p.save();
        }
      }
    }

    await taller.save();
    res.json({ ok: true, taller });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración del taller' });
  }
});

export default router;
