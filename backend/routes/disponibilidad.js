import express from 'express';
import Disponibilidad from '../models/Disponibilidad.js';
import { protegerRuta } from '../middleware/auth.js';

const router = express.Router();

router.get('/:entidad_id', async (req, res) => {
  try {
    const { entidad_id } = req.params;
    const disponibilidad = await Disponibilidad.findOne({ entidad_id });
    res.json(disponibilidad);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
});

router.post('/', protegerRuta, async (req, res) => {
  try {
    const { entidad_id, tipo_entidad, duracion_slot_minutos, dias_laborables, hora_inicio, hora_fin } = req.body;
    let disponibilidad = await Disponibilidad.findOne({ entidad_id });
    
    if (disponibilidad) {
      disponibilidad.tipo_entidad = tipo_entidad;
      disponibilidad.duracion_slot_minutos = duracion_slot_minutos;
      disponibilidad.dias_laborables = dias_laborables;
      disponibilidad.hora_inicio = hora_inicio;
      disponibilidad.hora_fin = hora_fin;
      await disponibilidad.save();
    } else {
      disponibilidad = new Disponibilidad({ entidad_id, tipo_entidad, duracion_slot_minutos, dias_laborables, hora_inicio, hora_fin });
      await disponibilidad.save();
    }
    
    res.json({ ok: true, disponibilidad });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar disponibilidad' });
  }
});

export default router;
