import express from 'express';
import Servicio from '../models/Servicio.js';
import Producto from '../models/Producto.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

// GET /api/servicios
router.get('/', async (req, res) => {
  try {
    const servicios = await Servicio.find({ activo: true }).populate('team_asignado');
    // Para construir la vista agrupada con sus productos
    const serviciosConProductos = await Promise.all(servicios.map(async (s) => {
      const productos = await Producto.find({ servicio_padre: s._id, activo: true });
      return {
        ...s.toObject(),
        productos
      };
    }));
    res.json(serviciosConProductos);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

// POST /api/servicios
router.post('/', protegerRuta, async (req, res) => {
  try {
    const { nombre, descripcion, icono, team_asignado } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const servicio = new Servicio({ nombre, descripcion, icono, team_asignado });
    await servicio.save();
    res.status(201).json({ ok: true, servicio: { ...servicio.toObject(), productos: [] } });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

// PUT /api/servicios/:id
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, servicio });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// DELETE /api/servicios/:id
router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Servicio.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ ok: true, mensaje: 'Servicio desactivado con éxito' });
  } catch (error) {
    console.error('Error al desactivar servicio:', error);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
});

export default router;
