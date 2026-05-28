import express from 'express';
import Cita from '../models/Cita.js';
import Cliente from '../models/Cliente.js';
import Taller from '../models/Taller.js';
import { protegerRuta, soloAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/citas
router.get('/', protegerRuta, async (req, res) => {
  try {
    const { fecha, estado, pagina = 1, limite = 20 } = req.query;
    const query = {};

    if (fecha) {
      const inicioDia = new Date(`${fecha}T00:00:00`);
      const finDia = new Date(`${fecha}T23:59:59`);
      query.fecha_cita = { $gte: inicioDia, $lte: finDia };
    }

    if (estado) {
      query.estado = estado;
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    
    const total = await Cita.countDocuments(query);
    const citas = await Cita.find(query)
      .populate('cliente', 'nombre dni numero_telefono email')
      .populate('experto_asignado', 'nombre rol')
      .populate('producto_id', 'nombre precio')
      .populate('team_asignado', 'nombre')
      .sort({ fecha_cita: 1 })
      .skip(skip)
      .limit(parseInt(limite));

    res.json({
      citas,
      total,
      pagina: parseInt(pagina),
      paginas_totales: Math.ceil(total / parseInt(limite))
    });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error del servidor al obtener citas' });
  }
});

// POST /api/citas (crear desde dashboard)
router.post('/', protegerRuta, async (req, res) => {
  try {
    const { 
      numero_telefono, 
      servicio, 
      fecha_cita,
      nombre_cliente,
      dni,
      vehiculo,
      descripcion_trabajo,
      precio_estimado,
      notas_mecanico,
      tipo_cita,
      producto_id,
      experto_asignado
    } = req.body;

    if (!numero_telefono || !fecha_cita) {
      return res.status(400).json({ error: 'Teléfono y fecha son requeridos' });
    }

    if (dni && !/^[0-9]{8,15}$/.test(dni)) {
      return res.status(400).json({ error: 'El documento de identidad debe contener solo números' });
    }

    const fechaCitaDate = new Date(fecha_cita);
    if (fechaCitaDate < new Date()) {
      return res.status(400).json({ error: 'La fecha de la cita debe ser futura' });
    }

    // Buscar o crear cliente
    let cliente = await Cliente.findOne({ numero_telefono });
    if (!cliente) {
      cliente = new Cliente({
        numero_telefono,
        nombre: nombre_cliente || 'Cliente de Dashboard',
        dni: dni || '',
        vehiculos: vehiculo ? [vehiculo] : []
      });
    } else {
      if (nombre_cliente) cliente.nombre = nombre_cliente;
      if (dni) cliente.dni = dni;
      if (vehiculo) {
        const existe = cliente.vehiculos.some(v => 
          v.marca?.toLowerCase() === vehiculo.marca?.toLowerCase() && 
          v.modelo?.toLowerCase() === vehiculo.modelo?.toLowerCase()
        );
        if (!existe) cliente.vehiculos.push(vehiculo);
      }
    }
    cliente.total_citas += 1;
    await cliente.save();

    // Crear cita
    const nuevaCita = new Cita({
      cliente: cliente._id,
      numero_telefono,
      nombre_cliente: nombre_cliente || cliente.nombre || 'Cliente de Dashboard',
      vehiculo: vehiculo || { marca: '', modelo: '', anio: null, patente: '' },
      servicio,
      descripcion_trabajo,
      fecha_cita: fechaCitaDate,
      estado: 'confirmada', // Confirmadas por defecto desde el dashboard
      notas_mecanico,
      precio_estimado: precio_estimado || 0,
      origen: 'dashboard',
      tipo_cita: tipo_cita || 'Evaluación Presencial',
      producto_id: producto_id || null,
      experto_asignado: experto_asignado || null
    });

    await nuevaCita.save();
    res.status(201).json({ ok: true, cita: nuevaCita });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error al crear la cita' });
  }
});

// PUT /api/citas/:id
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      estado, 
      notas_mecanico, 
      precio_final, 
      fecha_cita, 
      descripcion_trabajo, 
      tipo_cita, 
      experto_asignado,
      imagenes,
      team_asignado,
      duracion_estimada_minutos,
      estado_trabajo,
      nombre_cliente,
      numero_telefono,
      vehiculo
    } = req.body;

    const cita = await Cita.findById(id);
    if (!cita) {
      return res.status(404).json({ error: 'No se encontró la cita' });
    }

    if (estado) cita.estado = estado;
    if (notas_mecanico !== undefined) cita.notas_mecanico = notas_mecanico;
    if (precio_final !== undefined) cita.precio_final = precio_final;
    if (fecha_cita) cita.fecha_cita = new Date(fecha_cita);
    if (descripcion_trabajo !== undefined) cita.descripcion_trabajo = descripcion_trabajo;
    if (tipo_cita) cita.tipo_cita = tipo_cita;
    if (experto_asignado !== undefined) cita.experto_asignado = experto_asignado;
    if (imagenes !== undefined) cita.imagenes = imagenes;
    if (team_asignado !== undefined) cita.team_asignado = team_asignado || null;
    if (duracion_estimada_minutos !== undefined) cita.duracion_estimada_minutos = duracion_estimada_minutos;
    if (nombre_cliente !== undefined) cita.nombre_cliente = nombre_cliente;
    if (numero_telefono !== undefined) cita.numero_telefono = numero_telefono;
    if (vehiculo !== undefined) {
      cita.vehiculo = {
        ...cita.vehiculo,
        ...vehiculo
      };
    }
    const prevEstadoTrabajo = cita.estado_trabajo;
    if (estado_trabajo !== undefined) cita.estado_trabajo = estado_trabajo;

    if (estado === 'completada' && precio_final !== undefined) {
      cita.precio_final = Number(precio_final);
      if (cita.cliente) {
        await Cliente.findByIdAndUpdate(cita.cliente, {
          $inc: { total_gastado: Number(precio_final) }
        });
      }
    }

    if (estado_trabajo === 'finalizado' && cita.cliente) {
      const cliente = await Cliente.findById(cita.cliente);
      if (cliente) {
        let vehiculo = null;

        // 1. Intentar buscar por patente exacta
        if (cita.vehiculo?.patente) {
          vehiculo = cliente.vehiculos.find(v => 
            v.patente?.trim().toUpperCase() === cita.vehiculo.patente.trim().toUpperCase()
          );
        }

        // 2. Si no se encuentra, intentar buscar por marca y modelo
        if (!vehiculo && cita.vehiculo?.marca && cita.vehiculo?.modelo) {
          vehiculo = cliente.vehiculos.find(v => 
            v.marca?.trim().toLowerCase() === cita.vehiculo.marca?.trim().toLowerCase() && 
            v.modelo?.trim().toLowerCase() === cita.vehiculo.modelo?.trim().toLowerCase()
          );
        }

        // 3. Fallback: Si el cliente tiene un solo vehículo registrado, usar ese
        if (!vehiculo && cliente.vehiculos?.length === 1) {
          vehiculo = cliente.vehiculos[0];
        }

        // 4. Fallback: Si el cliente tiene múltiples vehículos y no hay coincidencia, pero la cita tiene datos parciales, crear uno nuevo
        if (!vehiculo && cita.vehiculo && (cita.vehiculo.marca || cita.vehiculo.modelo || cita.vehiculo.patente)) {
          cliente.vehiculos.push(cita.vehiculo);
          vehiculo = cliente.vehiculos[cliente.vehiculos.length - 1];
        }

        // 5. Fallback extremo: Si la cita no tiene datos de vehículo, pero el cliente tiene al menos un vehículo, usar el primero
        if (!vehiculo && cliente.vehiculos?.length > 0) {
          vehiculo = cliente.vehiculos[0];
        }

        if (vehiculo) {
          const existingRep = vehiculo.reparaciones.find(r => r.cita_id?.toString() === cita._id.toString());
          if (!existingRep) {
            const nuevaReparacion = {
              titulo: cita.servicio || 'Servicio de Taller',
              fecha: cita.fecha_cita || new Date(),
              piezas_cambiadas: [],
              imagen_antes: cita.imagenes?.[0] || '',
              imagen_despues: cita.imagenes?.length > 1 ? cita.imagenes[cita.imagenes.length - 1] : '',
              comentarios: cita.notas_mecanico || cita.descripcion_trabajo || '',
              estado: 'OK',
              cita_id: cita._id
            };
            vehiculo.reparaciones.push(nuevaReparacion);
            await cliente.save();
          } else {
            existingRep.titulo = cita.servicio || 'Servicio de Taller';
            existingRep.comentarios = cita.notas_mecanico || cita.descripcion_trabajo || '';
            existingRep.imagen_antes = cita.imagenes?.[0] || '';
            existingRep.imagen_despues = cita.imagenes?.length > 1 ? cita.imagenes[cita.imagenes.length - 1] : '';
            await cliente.save();
          }
        }
      }
    }

    await cita.save();
    res.json({ ok: true, cita });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: 'Error al actualizar la cita' });
  }
});

// DELETE /api/citas/:id (solo admin)
router.delete('/:id', protegerRuta, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const cita = await Cita.findByIdAndDelete(id);
    if (!cita) {
      return res.status(404).json({ error: 'No se encontró la cita' });
    }
    
    // Decrementar total de citas del cliente
    if (cita.cliente) {
      await Cliente.findByIdAndUpdate(cita.cliente, { $inc: { total_citas: -1 } });
    }

    res.json({ ok: true, mensaje: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ error: 'Error al eliminar la cita' });
  }
});

export default router;
