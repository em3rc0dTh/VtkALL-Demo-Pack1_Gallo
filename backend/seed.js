import { conectarDB } from './config/db.js';
import mongoose from 'mongoose';
import Servicio from './models/Servicio.js';
import Producto from './models/Producto.js';
import Team from './models/Team.js';
import Trabajador from './models/Trabajador.js';

const runSeed = async () => {
  await conectarDB();
  
  await Servicio.deleteMany({});
  await Producto.deleteMany({});
  await Team.deleteMany({});
  await Trabajador.deleteMany({});
  
  console.log('🌱 Creando Teams y Trabajadores...');
  const teamMecanica = await Team.create({ nombre: 'Mecánica General', horario_referencial: 'Lun-Sáb 08:00 - 18:00 (Slots 30 min)', capacidad: 2 });

  const teamPlanchado = await Team.create({ nombre: 'Planchado y Pintura', horario_referencial: 'Lun-Vie 09:00 - 17:00 (Slots 60 min)', capacidad: 1 });
  await Team.create({ nombre: 'Atención al Cliente', horario_referencial: 'Lun-Sáb 08:00 - 18:00 (Continúo)', capacidad: 1 });

  await Trabajador.create({ nombre: 'Carlos Mendoza', rol: 'Experto Evaluador', contrato: 'Planilla', team: teamMecanica._id });
  await Trabajador.create({ nombre: 'Luis Flores', rol: 'Especialista', contrato: 'Recibo por Honorarios', team: teamPlanchado._id });

  console.log('🌱 Creando Servicios y Productos...');
  
  const s1 = await Servicio.create({ nombre: 'Planchado y Pintura', descripcion: 'Reparación de carrocería, abolladuras y pintura al horno.', icono: '🎨', team_asignado: teamPlanchado._id });
  await Producto.create({ nombre: 'Planchado Básico (Masilla)', precio: 150, duracion_minutos: 120, servicio_padre: s1._id });
  await Producto.create({ nombre: 'Pintura Paño Completo', precio: 350, duracion_minutos: 240, servicio_padre: s1._id });
  await Producto.create({ nombre: 'Planchado y Pintura General', precio: 1200, duracion_minutos: 1440, servicio_padre: s1._id });
  
  const s2 = await Servicio.create({ nombre: 'Mantenimiento', descripcion: 'Afinamiento, cambio de aceite y revisión de niveles.', icono: '🔧', team_asignado: teamMecanica._id });
  await Producto.create({ nombre: 'Afinamiento Menor', precio: 120, duracion_minutos: 60, servicio_padre: s2._id });
  await Producto.create({ nombre: 'Afinamiento Mayor', precio: 250, duracion_minutos: 120, servicio_padre: s2._id });
  await Producto.create({ nombre: 'Cambio de Aceite Sintético', precio: 180, duracion_minutos: 45, servicio_padre: s2._id });

  const s3 = await Servicio.create({ nombre: 'Diagnóstico', descripcion: 'Revisión general y escaneo computarizado para identificar fallas ocultas.', icono: '🔍', team_asignado: teamMecanica._id });
  await Producto.create({ nombre: 'Escaneo OBD2 Básico', precio: 80, duracion_minutos: 30, servicio_padre: s3._id });
  await Producto.create({ nombre: 'Diagnóstico de Motor Profundo', precio: 150, duracion_minutos: 90, servicio_padre: s3._id });

  const s4 = await Servicio.create({ nombre: 'Frenos y Suspensión', descripcion: 'Revisión y cambio de pastillas, discos, amortiguadores y terminales de dirección.', icono: '🛑', team_asignado: teamMecanica._id });
  await Producto.create({ nombre: 'Cambio de Pastillas Delanteras', precio: 120, duracion_minutos: 60, servicio_padre: s4._id });
  await Producto.create({ nombre: 'Rectificado de Discos', precio: 90, duracion_minutos: 60, servicio_padre: s4._id });
  await Producto.create({ nombre: 'Cambio de Amortiguadores (Par)', precio: 280, duracion_minutos: 120, servicio_padre: s4._id });

  const s5 = await Servicio.create({ nombre: 'Detailing', descripcion: 'Limpieza profunda, pulido y recubrimiento cerámico para máxima protección.', icono: '✨', team_asignado: teamPlanchado._id });
  await Producto.create({ nombre: 'Lavado Premium y Encerado', precio: 90, duracion_minutos: 90, servicio_padre: s5._id });
  await Producto.create({ nombre: 'Tratamiento Cerámico 9H', precio: 600, duracion_minutos: 360, servicio_padre: s5._id });
  
  const s6 = await Servicio.create({ nombre: 'Revisión precompra', descripcion: 'Inspección detallada antes de comprar un auto usado para garantizar tu inversión.', icono: '📋', team_asignado: teamMecanica._id });
  await Producto.create({ nombre: 'Revisión Precompra Integral', precio: 150, duracion_minutos: 90, servicio_padre: s6._id });

  console.log('✅ Seeding completado.');
  process.exit(0);
};

runSeed();
