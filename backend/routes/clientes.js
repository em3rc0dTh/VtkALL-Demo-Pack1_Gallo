import express from 'express';
import Cliente from '../models/Cliente.js';
import Cita from '../models/Cita.js';
import { protegerRuta, soloAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/clientes
router.get('/', protegerRuta, async (req, res) => {
  try {
    const { busqueda, pagina = 1, limite = 20 } = req.query;
    const query = {};

    if (busqueda) {
      const regex = new RegExp(busqueda, 'i');
      
      // Buscar IDs de clientes asociados a citas cuyo nombre_cliente coincida con la búsqueda
      const citasCoincidentes = await Cita.find({ nombre_cliente: regex }).select('cliente');
      const clienteIdsDeCitas = citasCoincidentes.map(c => c.cliente).filter(Boolean);

      query.$or = [
        { nombre: regex },
        { dni: regex },
        { numero_telefono: regex },
        { email: regex },
        { 'vehiculos.patente': regex },
        { _id: { $in: clienteIdsDeCitas } }
      ];
    }

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    const total = await Cliente.countDocuments(query);
    const clientes = await Cliente.find(query)
      .sort({ creado_en: -1 })
      .skip(skip)
      .limit(parseInt(limite));

    // Agregar aliases (nombres en citas que difieren del nombre registrado del cliente)
    const clientesConAlias = await Promise.all(clientes.map(async (c) => {
      const citas = await Cita.find({ cliente: c._id }).select('nombre_cliente');
      const nombresCitas = [...new Set(citas.map(cit => cit.nombre_cliente).filter(Boolean))];
      const alias = nombresCitas.filter(n => n.toLowerCase() !== c.nombre?.toLowerCase());
      
      return {
        ...c.toObject(),
        alias
      };
    }));

    res.json({
      clientes: clientesConAlias,
      total,
      pagina: parseInt(pagina),
      paginas_totales: Math.ceil(total / parseInt(limite))
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// GET /api/clientes/:id
router.get('/:id', protegerRuta, async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Buscar historial de citas del cliente
    const citas = await Cita.find({ cliente: id }).sort({ fecha_cita: -1 });

    res.json({ cliente, citas });
  } catch (error) {
    console.error('Error al obtener detalle del cliente:', error);
    res.status(500).json({ error: 'Error al obtener detalles del cliente' });
  }
});

// POST /api/clientes
router.post('/', protegerRuta, async (req, res) => {
  try {
    const { nombre, dni, numero_telefono, email, vehiculos, notas, total_gastado, deuda_actual } = req.body;
    
    if (!numero_telefono) {
      return res.status(400).json({ error: 'El número de teléfono es requerido' });
    }

    const existe = await Cliente.findOne({ numero_telefono });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese número de teléfono' });
    }

    let vehiculosFormateados = [];
    if (vehiculos && vehiculos.length > 0) {
      vehiculosFormateados = vehiculos.map(v => ({
        ...v,
        patente: v.patente?.trim().toUpperCase() || ''
      }));
      const patentesNuevas = vehiculosFormateados.map(v => v.patente).filter(p => p);
      
      const tieneDuplicados = patentesNuevas.some((p, idx) => patentesNuevas.indexOf(p) !== idx);
      if (tieneDuplicados) {
        return res.status(400).json({ error: 'No se permiten vehículos con la misma placa' });
      }

      if (patentesNuevas.length > 0) {
        const patenteExistente = await Cliente.findOne({ 'vehiculos.patente': { $in: patentesNuevas } });
        if (patenteExistente) {
          return res.status(409).json({ error: 'Una de las placas ingresadas ya está registrada en el sistema' });
        }
      }
    }

    const nuevoCliente = new Cliente({
      nombre: nombre || '',
      dni: dni || '',
      numero_telefono,
      email: email || '',
      vehiculos: vehiculosFormateados,
      notas: notas || '',
      total_gastado: total_gastado !== undefined ? Number(total_gastado) : 0,
      deuda_actual: deuda_actual !== undefined ? Number(deuda_actual) : 0
    });

    await nuevoCliente.save();
    res.status(201).json({ ok: true, cliente: nuevoCliente });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', protegerRuta, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, dni, numero_telefono, email, vehiculos, notas, total_gastado, deuda_actual } = req.body;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (nombre !== undefined) cliente.nombre = nombre;
    if (dni !== undefined) cliente.dni = dni;
    if (numero_telefono !== undefined) {
      const duplicado = await Cliente.findOne({ numero_telefono, _id: { $ne: id } });
      if (duplicado) {
        return res.status(400).json({ error: 'Ya existe otro cliente con ese número de teléfono' });
      }
      cliente.numero_telefono = numero_telefono;
    }
    if (email !== undefined) cliente.email = email;
    if (vehiculos !== undefined) {
      const vehiculosFormateados = vehiculos.map(v => ({
        ...v,
        patente: v.patente?.trim().toUpperCase() || ''
      }));
      const patentesNuevas = vehiculosFormateados.map(v => v.patente).filter(p => p);

      const tieneDuplicados = patentesNuevas.some((p, idx) => patentesNuevas.indexOf(p) !== idx);
      if (tieneDuplicados) {
        return res.status(400).json({ error: 'No se permiten vehículos con la misma placa' });
      }

      if (patentesNuevas.length > 0) {
        const patenteExistente = await Cliente.findOne({ 
          _id: { $ne: id },
          'vehiculos.patente': { $in: patentesNuevas } 
        });
        if (patenteExistente) {
          return res.status(409).json({ error: 'Una de las placas ingresadas ya está registrada en el sistema' });
        }
      }
      cliente.vehiculos = vehiculosFormateados;
    }
    if (notas !== undefined) cliente.notas = notas;
    if (total_gastado !== undefined) cliente.total_gastado = Number(total_gastado);
    if (deuda_actual !== undefined) cliente.deuda_actual = Number(deuda_actual);

    await cliente.save();
    res.json({ ok: true, cliente });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE /api/clientes/:id (admin)
router.delete('/:id', protegerRuta, soloAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByIdAndDelete(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Eliminar las citas vinculadas
    await Cita.deleteMany({ cliente: id });

    res.json({ ok: true, mensaje: 'Cliente y sus citas asociadas han sido eliminados' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// POST /api/clientes/:id/vehiculos/:patente/reparaciones
router.post('/:id/vehiculos/:patente/reparaciones', protegerRuta, async (req, res) => {
  try {
    const { id, patente } = req.params;
    const { titulo, fecha, kilometraje, piezas_cambiadas, imagen_antes, imagen_despues, comentarios, estado } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'El título de la reparación es requerido' });
    }

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const vehiculo = cliente.vehiculos.find(v => v.patente?.toUpperCase() === patente.toUpperCase());
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado en este cliente' });
    }

    if (!vehiculo.reparaciones) {
      vehiculo.reparaciones = [];
    }

    const nuevaReparacion = {
      titulo,
      fecha: fecha ? new Date(fecha) : undefined,
      kilometraje: kilometraje ? Number(kilometraje) : undefined,
      piezas_cambiadas: Array.isArray(piezas_cambiadas) ? piezas_cambiadas : [],
      imagen_antes: imagen_antes || '',
      imagen_despues: imagen_despues || '',
      comentarios: comentarios || '',
      estado: estado || 'OK'
    };

    vehiculo.reparaciones.push(nuevaReparacion);
    await cliente.save();

    res.status(201).json({ ok: true, cliente, reparacion: nuevaReparacion });
  } catch (error) {
    console.error('Error al agregar reparación:', error);
    res.status(500).json({ error: 'Error del servidor al agregar reparación' });
  }
});

// PUT /api/clientes/:id/vehiculos/:patente/mantenimiento
router.put('/:id/vehiculos/:patente/mantenimiento', protegerRuta, async (req, res) => {
  try {
    const { id, patente } = req.params;
    const { kilometraje, fecha_estimada, sugerencia } = req.body;

    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const vehiculo = cliente.vehiculos.find(v => v.patente?.toUpperCase() === patente.toUpperCase());
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado en este cliente' });
    }

    vehiculo.proximo_mantenimiento = {
      kilometraje: kilometraje ? Number(kilometraje) : undefined,
      fecha_estimada: fecha_estimada || '',
      sugerencia: sugerencia || ''
    };

    await cliente.save();
    res.json({ ok: true, cliente, proximo_mantenimiento: vehiculo.proximo_mantenimiento });
  } catch (error) {
    console.error('Error al actualizar mantenimiento:', error);
    res.status(500).json({ error: 'Error del servidor al actualizar mantenimiento' });
  }
});

export default router;
