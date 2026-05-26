import express from 'express';
import Producto from '../models/Producto.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).populate('servicio_padre');
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/', protegerRuta, async (req, res) => {
  try {
    const { nombre, precio, duracion_minutos, servicio_padre } = req.body;
    const producto = new Producto({ nombre, precio, duracion_minutos, servicio_padre });
    await producto.save();
    res.status(201).json({ ok: true, producto });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, producto });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Producto.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ ok: true, mensaje: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar producto' });
  }
});

export default router;
