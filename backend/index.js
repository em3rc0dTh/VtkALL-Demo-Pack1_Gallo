import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { conectarDB } from './config/db.js';

// Modelos
import Taller from './models/Taller.js';
import Usuario from './models/Usuario.js';

// Rutas
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import citasRoutes from './routes/citas.js';
import clientesRoutes from './routes/clientes.js';
import mensajesRoutes from './routes/mensajes.js';
import serviciosRoutes from './routes/servicios.js';
import configuracionRoutes from './routes/configuracion.js';


const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Next.js port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/configuracion', configuracionRoutes);

// Endpoint de Diagnóstico
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'online', time: new Date() });
});

// Función de Seeding para iniciar DB con datos por defecto
const inicializarDatos = async () => {
  try {
    // 1. Seed Taller (Configuración Única)
    let tallerExistente = await Taller.findOne();
    if (!tallerExistente) {
      console.log('🌱 Creando configuración inicial del taller para Perú...');
      const nuevoTaller = new Taller({
        nombre_taller: 'MecánicaPro',
        slogan: 'Tu vehículo en las mejores manos',
        direccion: 'Av. Javier Prado Este 2465, San Borja, Lima',
        telefono: '+51 1 617-6800',
        whatsapp: '51999888777',
        email: 'contacto@mecanicapro.com',
        sobre_nosotros: 'En MecánicaPro contamos con más de 10 años de trayectoria brindando servicios mecánicos integrales de alta calidad. Contamos con tecnología de diagnóstico computarizado avanzada y un equipo de profesionales apasionados por el cuidado de tu automóvil.',
        anos_experiencia: 12,
        clientes_atendidos: 840,
        autos_reparados: 2500,
        config_agente: {
          nombre_agente: 'Max',
          mensaje_bienvenida: '¡Hola! 👋 Soy Max, el asistente virtual de MecánicaPro. ¿En qué te puedo ayudar hoy?'
        },
        servicios: [
          { nombre: 'Cambio de Aceite', descripcion: 'Cambio de aceite sintético de alta calidad y filtros de aire/aceite.', duracion_minutos: 60, precio_base: 150, icono: '🛢️', activo: true },
          { nombre: 'Alineación y Balanceo', descripcion: 'Alineación láser 3D de cuatro ruedas y balanceo computarizado de llantas.', duracion_minutos: 90, precio_base: 120, icono: '🛞', activo: true },
          { nombre: 'Service de Frenos', descripcion: 'Inspección completa, cambio de pastillas de freno y rectificación de discos.', duracion_minutos: 120, precio_base: 250, icono: '🛑', activo: true },
          { nombre: 'Diagnóstico Computarizado', descripcion: 'Lectura de códigos de error con escáner OBD2 oficial y análisis de sensores.', duracion_minutos: 45, precio_base: 80, icono: '💻', activo: true },
          { nombre: 'Mantenimiento General', descripcion: 'Chequeo completo de 25 puntos clave de seguridad de tu vehículo.', duracion_minutos: 180, precio_base: 400, icono: '🔧', activo: true }
        ],
        galeria: [
          'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=800',
          'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800'
        ]
      });
      await nuevoTaller.save();
      console.log('🌱 Configuración del taller inicializada con éxito.');
    } else {
      if (tallerExistente.direccion.includes('Palermo') || tallerExistente.telefono.includes('+54')) {
        console.log('🔄 Actualizando configuración del taller para Perú...');
        tallerExistente.direccion = 'Av. Javier Prado Este 2465, San Borja, Lima';
        tallerExistente.telefono = '+51 1 617-6800';
        tallerExistente.whatsapp = '51999888777';
        tallerExistente.servicios = [
          { nombre: 'Cambio de Aceite', descripcion: 'Cambio de aceite sintético de alta calidad y filtros de aire/aceite.', duracion_minutos: 60, precio_base: 150, icono: '🛢️', activo: true },
          { nombre: 'Alineación y Balanceo', descripcion: 'Alineación láser 3D de cuatro ruedas y balanceo computarizado de llantas.', duracion_minutos: 90, precio_base: 120, icono: '🛞', activo: true },
          { nombre: 'Service de Frenos', descripcion: 'Inspección completa, cambio de pastillas de freno y rectificación de discos.', duracion_minutos: 120, precio_base: 250, icono: '🛑', activo: true },
          { nombre: 'Diagnóstico Computarizado', descripcion: 'Lectura de códigos de error con escáner OBD2 oficial y análisis de sensores.', duracion_minutos: 45, precio_base: 80, icono: '💻', activo: true },
          { nombre: 'Mantenimiento General', descripcion: 'Chequeo completo de 25 puntos clave de seguridad de tu vehículo.', duracion_minutos: 180, precio_base: 400, icono: '🔧', activo: true }
        ];
        await tallerExistente.save();
        console.log('🔄 Configuración del taller actualizada para Perú.');
      }
    }

    // 2. Seed Usuario Administrador
    const usuarioExistente = await Usuario.findOne({ email: 'admin@mecanicapro.com' });
    if (!usuarioExistente) {
      console.log('🌱 Creando usuario administrador inicial...');
      const hashedPassword = await bcrypt.hash('Admin1234!', 12);
      const nuevoAdmin = new Usuario({
        nombre: 'Administrador Principal',
        email: 'admin@mecanicapro.com',
        password: hashedPassword,
        rol: 'admin',
        activo: true
      });
      await nuevoAdmin.save();
      console.log('🔑 ==========================================');
      console.log('🔑 USUARIO ADMIN CREADO EN LA BASE DE DATOS:');
      console.log('   Email: admin@mecanicapro.com');
      console.log('   Contraseña: Admin1234!');
      console.log('🔑 ==========================================');
    }

    // 3. Seed Usuario Soporte
    const soporteExistente = await Usuario.findOne({ email: 'soporte@mecanicapro.com' });
    if (!soporteExistente) {
      console.log('🌱 Creando usuario soporte inicial...');
      const hashedPassword = await bcrypt.hash('Soporte1234!', 12);
      const nuevoSoporte = new Usuario({
        nombre: 'Soporte Técnico',
        email: 'soporte@mecanicapro.com',
        password: hashedPassword,
        rol: 'soporte',
        activo: true
      });
      await nuevoSoporte.save();
      console.log('🔑 ==========================================');
      console.log('🔑 USUARIO SOPORTE CREADO EN LA BASE DE DATOS:');
      console.log('   Email: soporte@mecanicapro.com');
      console.log('   Contraseña: Soporte1234!');
      console.log('🔑 ==========================================');
    }
  } catch (error) {
    console.error('🔴 Error durante el seeding de la base de datos:', error);
  }
};

// Iniciar Servidor
const arrancarServidor = async () => {
  await conectarDB();
  await inicializarDatos();
  app.listen(PORT, () => {
    console.log(`🚀 Backend listo en http://localhost:${PORT}`);
  });
};

arrancarServidor();
