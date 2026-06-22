import express from 'express';
import Trabajador from '../models/Trabajador.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protegerRuta, async (req, res) => {
  try {
    const trabajadores = await Trabajador.find({ activo: true }).populate('team');
    res.json(trabajadores);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

router.post('/', protegerRuta, async (req, res) => {
  try {
    const { nombre, rol, contrato, team } = req.body;
    const trabajador = new Trabajador({ nombre, rol, contrato, team });
    await trabajador.save();
    res.status(201).json({ ok: true, trabajador });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const trabajador = await Trabajador.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, trabajador });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Trabajador.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ ok: true, mensaje: 'Trabajador desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar trabajador' });
  }
});

export default router;
