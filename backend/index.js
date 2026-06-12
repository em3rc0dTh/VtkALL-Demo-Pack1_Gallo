import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { conectarDB } from './config/db.js';
import { procesarRecordatoriosYCancelaciones } from './services/recordatorios.js';

// Modelos
import Taller from './models/Taller.js';
import Usuario from './models/Usuario.js';
import Servicio from './models/Servicio.js';
import Producto from './models/Producto.js';
import Team from './models/Team.js';
import Trabajador from './models/Trabajador.js';
import Disponibilidad from './models/Disponibilidad.js';

// Rutas
import authRoutes from './routes/auth.js';
import webhookRoutes from './routes/webhook.js';
import citasRoutes from './routes/citas.js';
import clientesRoutes from './routes/clientes.js';
import mensajesRoutes from './routes/mensajes.js';
import serviciosRoutes from './routes/servicios.js';
import productosRoutes from './routes/productos.js';
import teamsRoutes from './routes/teams.js';
import trabajadoresRoutes from './routes/trabajadores.js';
import disponibilidadRoutes from './routes/disponibilidad.js';
import configuracionRoutes from './routes/configuracion.js';
import uploadRoutes from './routes/upload.js';
import temporalRoutes from './routes/temporal.js';
import path from 'path';


const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Next.js port
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Servir archivos estáticos de uploads
app.use('/upload_utils', express.static(path.join(process.cwd(), 'upload_utils')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/temporal', temporalRoutes);

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
        nombre_taller: 'Turagua',
        slogan: 'Endulzamos con amor 💕',
        direccion: 'San Miguel, Lima',
        telefono: '955479450',
        whatsapp: '51955479450',
        email: 'pedidos@bateylate.com',
        sobre_nosotros: 'En Turagua brindamos servicio automotriz integral y especializado. Nos apasiona el detalle y el rendimiento, utilizando siempre repuestos de la mejor calidad.',
        anos_experiencia: 5,
        clientes_atendidos: 1500,
        autos_reparados: 3000,
        config_agente: {
          nombre_agente: 'Esperanza',
          mensaje_bienvenida: '¡Hola! 🚗 Soy Turagua Bot. ¿En qué te puedo ayudar hoy con tu vehículo? ✨'
        },
        tema_global: {
          color: '#ef4444',
          color_secundario: '#00d1ff',
          color_fondo: '#0f172a',
          nombre: 'Turagua Bot'
        },
        constructor_bloques: [
          { 
            id: 1, tipo: 'HeroBlock', titulo: 'Sección Principal (Hero)', activo: true, 
            conf: { tituloPrincipal: 'Tu vehículo en manos expertas.', subtitulo: 'Mantenimientos, reparaciones y servicios automotrices a tu medida.', tipoFondo: 'Video', overlayOpacidad: '40', tamanoFuente: 'Grande (XL)', alineacion: 'Centro', textoBoton: 'COTIZAR AHORA', estiloBoton: 'Solid (Relleno)', colorBoton: 'Primario' } 
          },
          { 
            id: 2, tipo: 'StatsBlock', titulo: 'Estadísticas del Negocio', activo: false, 
            conf: { estilo: 'Tarjetas Oscuras', columnas: '3', stat1_valor: '+10', stat1_label: 'Años Experiencia', stat2_valor: '+5000', stat2_label: 'Clientes Felices', stat3_valor: '+8000', stat3_label: 'Autos Reparados' } 
          },
          { 
            id: 3, tipo: 'ServicesBlock', titulo: 'Catálogo de Servicios', activo: true, 
            conf: { tituloSeccion: 'Nuestros Productos', subtitulo: 'Opciones dulces para cada ocasión especial.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true, mostrarTiempo: false, mostrarBotonAgendar: false } 
          },
          {
            id: 4, tipo: 'SobreNosotrosBlock', titulo: 'Sobre Nosotros', activo: true, conf: {}
          },
          {
            id: 5, tipo: 'ContactoBlock', titulo: 'Contacto y Horarios', activo: true, conf: {}
          }
        ]
      });
      await nuevoTaller.save();
      console.log('🌱 Configuración del taller inicializada con éxito.');
    } else {
      let modificado = false;
      if (!tallerExistente.promociones || tallerExistente.promociones.length === 0) {
        console.log('🌱 Inicializando promociones por defecto para taller existente...');
        tallerExistente.promociones = [
          {
            titulo: 'Catálogo Día de la Madre',
            descripcion: 'Descubre nuestros postres especiales para mamá. Mini tortas, cupcakes y alfajores personalizados.',
            etiqueta: 'PROMO DEL MES',
            mensaje_chat: 'Hola Esperanza, me interesa el Catálogo Día de la Madre 💕',
            color_fondo: 'primary',
            activo: true
          },
          {
            titulo: 'Plan Navideño de Girlies',
            descripcion: 'Arma tu box navideño con tus amigas. Incluye galletas decoradas y minipanetones.',
            etiqueta: 'EDICIÓN LIMITADA',
            mensaje_chat: 'Hola! Quiero información sobre el Plan Navideño de Girlies ✨',
            color_fondo: 'secondary',
            activo: true
          }
        ];
        modificado = true;
      }
      
      if (!tallerExistente.constructor_bloques || tallerExistente.constructor_bloques.length === 0) {
        console.log('🌱 Inicializando constructor_bloques y tema por defecto para taller existente...');
        tallerExistente.tema_global = {
          color: '#00aeef',
          nombre: 'Azul Eléctrico (Default)'
        };
        tallerExistente.constructor_bloques = [
          { 
            id: 1, tipo: 'HeroBlock', titulo: 'Sección Principal (Hero)', activo: true, 
            conf: { tituloPrincipal: 'Precisión de Alto Rendimiento.', subtitulo: 'El cuidado de alta fidelidad que tu vehículo merece, asistido las 24 horas por nuestro equipo de reservas.', tipoFondo: 'Video', overlayOpacidad: '60', tamanoFuente: 'Grande (XL)', alineacion: 'Centro', textoBoton: 'AGENDAR CITA', estiloBoton: 'Solid (Relleno)', colorBoton: 'Primario' } 
          },
          { 
            id: 2, tipo: 'StatsBlock', titulo: 'Estadísticas del Negocio', activo: false, 
            conf: { estilo: 'Tarjetas Oscuras', columnas: '3', stat1_valor: '+12', stat1_label: 'Años Experiencia', stat2_valor: '+840', stat2_label: 'Clientes Felices', stat3_valor: '+2500', stat3_label: 'Autos Reparados' } 
          },
          { 
            id: 3, tipo: 'ServicesBlock', titulo: 'Catálogo de Servicios', activo: true, 
            conf: { tituloSeccion: 'Nuestros Servicios', subtitulo: 'Soluciones integrales para cada necesidad de tu vehículo.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true, mostrarTiempo: true, mostrarBotonAgendar: false } 
          },
          {
            id: 4, tipo: 'SobreNosotrosBlock', titulo: 'Sobre Nosotros', activo: true, conf: {}
          },
          {
            id: 5, tipo: 'ContactoBlock', titulo: 'Contacto y Horarios', activo: true, conf: {}
          }
        ];
        modificado = true;
      }
      
      if (modificado) {
        await tallerExistente.save();
        console.log('🌱 Campos del constructor actualizados en taller existente.');
      }
    }

    // 1.5 Seed Teams y Trabajadores
    const countTeams = await Team.countDocuments();
    let teamPasteleria, teamAtencion;
    if (countTeams === 0) {
      console.log('🌱 Creando Teams y Trabajadores iniciales...');
      teamPasteleria = await Team.create({ nombre: 'Pastelería', horario_referencial: 'Lun-Sáb 10:00 - 19:00 (Slots 60 min)', capacidad: 2 });
      teamAtencion = await Team.create({ nombre: 'Atención al Cliente', horario_referencial: 'Lun-Sáb 10:00 - 19:00 (Continúo)', capacidad: 1 });

      await Trabajador.create({ nombre: 'Ana Pastelera', rol: 'Pastelera Principal', contrato: 'Planilla', team: teamPasteleria._id });
      await Trabajador.create({ nombre: 'María Ventas', rol: 'Atención', contrato: 'Recibo por Honorarios', team: teamAtencion._id });
    }

    // 1.6 Seed Servicios y Productos
    const countServicios = await Servicio.countDocuments();
    if (countServicios === 0 && teamPasteleria && teamAtencion) {
      console.log('🌱 Creando Servicios y Productos iniciales...');
      const s1 = await Servicio.create({ nombre: 'Tortas Personalizadas', descripcion: 'Tortas temáticas con fondant o buttercream.', icono: '🎂', team_asignado: teamPasteleria._id });
      await Producto.create({ nombre: 'Mini Torta', precio: 50, duracion_minutos: 60, servicio_padre: s1._id });
      await Producto.create({ nombre: 'Torta Kpop', precio: 120, duracion_minutos: 120, servicio_padre: s1._id });
      
      const s2 = await Servicio.create({ nombre: 'Box Sorpresa', descripcion: 'Desayunos y boxes de dulces para regalar.', icono: '🎁', team_asignado: teamAtencion._id });
      await Producto.create({ nombre: 'Box Girlies', precio: 80, duracion_minutos: 30, servicio_padre: s2._id });
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
  
  // Ejecutar recordatorios en el arranque y configurar intervalo de 1 hora
  procesarRecordatoriosYCancelaciones();
  setInterval(procesarRecordatoriosYCancelaciones, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`🚀 Backend listo en http://localhost:${PORT}`);
  });
};

arrancarServidor();
