import express from 'express';
import Team from '../models/Team.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protegerRuta, async (req, res) => {
  try {
    const teams = await Team.find({ activo: true });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener teams' });
  }
});

router.post('/', protegerRuta, async (req, res) => {
  try {
    const { nombre, horario_referencial, capacidad } = req.body;
    const team = new Team({ nombre, horario_referencial, capacidad });
    await team.save();
    res.status(201).json({ ok: true, team });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear team' });
  }
});

router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, team });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar team' });
  }
});

router.delete('/:id', protegerRuta, async (req, res) => {
  try {
    await Team.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ ok: true, mensaje: 'Team desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar team' });
  }
});

export default router;
