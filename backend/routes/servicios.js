import express from 'express';
import Taller from '../models/Taller.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// GET /api/servicios (Público - Landing page)
router.get('/', async (req, res) => {
  try {
    const taller = await Taller.findOne();
    if (!taller) {
      return res.json([]);
    }
    // Devolver solo los activos
    const activos = taller.servicios.filter(s => s.activo);
    res.json(activos);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// POST /api/servicios (Protegido)
router.post('/', protegerRuta, async (req, res) => {
  try {
    let taller = await Taller.findOne();
    if (!taller) {
      taller = new Taller({ servicios: [] });
    }

    if (Array.isArray(req.body)) {
      // Creación masiva
      const creados = [];
      for (const item of req.body) {
        const { nombre, descripcion, precio_base, duracion_minutos, icono } = item;
        if (!nombre || precio_base === undefined || precio_base === null || isNaN(parseFloat(precio_base))) {
          return res.status(400).json({ error: 'Nombre y precio base numérico son requeridos para todos los servicios' });
        }
        taller.servicios.push({
          nombre,
          descripcion,
          precio_base: parseFloat(precio_base),
          duracion_minutos: parseInt(duracion_minutos) || 60,
          icono: icono || '🔧',
          activo: true
        });
        creados.push(taller.servicios[taller.servicios.length - 1]);
      }
      await taller.save();
      res.status(201).json({ ok: true, servicios: creados });
    } else {
      // Creación individual
      const { nombre, descripcion, precio_base, duracion_minutos, icono } = req.body;
      
      if (!nombre || precio_base === undefined || precio_base === null || isNaN(parseFloat(precio_base))) {
        return res.status(400).json({ error: 'Nombre y precio base numérico son requeridos' });
      }

      taller.servicios.push({
        nombre,
        descripcion,
        precio_base: parseFloat(precio_base),
        duracion_minutos: parseInt(duracion_minutos) || 60,
        icono: icono || '🔧',
        activo: true
      });

      await taller.save();
      
      const creado = taller.servicios[taller.servicios.length - 1];
      res.status(201).json({ ok: true, servicio: creado });
    }
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// PUT /api/servicios/:id (Protegido)
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio_base, duracion_minutos, icono, activo } = req.body;

    const taller = await Taller.findOne();
    if (!taller) {
      return res.status(404).json({ error: 'Taller no configurado' });
    }

    const servicio = taller.servicios.id(id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (nombre !== undefined) servicio.nombre = nombre;
    if (descripcion !== undefined) servicio.descripcion = descripcion;
    if (precio_base !== undefined) servicio.precio_base = precio_base;
    if (duracion_minutos !== undefined) servicio.duracion_minutos = duracion_minutos;
    if (icono !== undefined) servicio.icono = icono;
    if (activo !== undefined) servicio.activo = activo;

    await taller.save();
    res.json({ ok: true, servicio });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// DELETE /api/servicios/:id (Protegido - soft delete)
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    const { id } = req.params;
    const taller = await Taller.findOne();
    if (!taller) {
      return res.status(404).json({ error: 'Taller no configurado' });
    }

    const servicio = taller.servicios.id(id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Marcamos como inactivo en vez de eliminar para mantener referencias en citas
    servicio.activo = false;
    await taller.save();
    
    res.json({ ok: true, mensaje: 'Servicio desactivado con éxito' });
  } catch (error) {
    console.error('Error al desactivar servicio:', error);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
});

export default router;
