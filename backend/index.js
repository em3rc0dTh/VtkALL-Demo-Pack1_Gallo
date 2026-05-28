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
import path from 'path';


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
          mensaje_bienvenida: '¡Hola! 👋 Soy Max, del equipo de MecánicaPro. ¿En qué te puedo ayudar hoy?'
        },
        tema_global: {
          color: '#00aeef',
          nombre: 'Azul Eléctrico (Default)'
        },
        constructor_bloques: [
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
            titulo: 'Cambio de Aceite + Diagnóstico Gratis',
            descripcion: 'Agenda tu cambio de aceite con nosotros este mes y recibe un escaneo computarizado de sensores OBD-II completamente gratis.',
            etiqueta: 'PROMO DEL MES',
            mensaje_chat: 'Hola, me interesa la Promo del Mes: Cambio de Aceite + Diagnóstico Gratis',
            color_fondo: 'primary',
            activo: true
          },
          {
            titulo: 'Especial Black Friday: 20% OFF',
            descripcion: 'Consigue un acabado impecable de fábrica con un 20% de descuento en trabajos completos de planchado y pintura automotriz al horno.',
            etiqueta: 'EDICIÓN LIMITADA',
            mensaje_chat: 'Hola, quiero reservar con el 20% de descuento del Especial Black Friday de Planchado y Pintura',
            color_fondo: 'navy',
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
    let teamMecanica, teamPlanchado;
    if (countTeams === 0) {
      console.log('🌱 Creando Teams y Trabajadores iniciales...');
      teamMecanica = await Team.create({ nombre: 'Mecánica General', horario_referencial: 'Lun-Sáb 08:00 - 18:00 (Slots 30 min)', capacidad: 2 });
      teamPlanchado = await Team.create({ nombre: 'Planchado y Pintura', horario_referencial: 'Lun-Vie 09:00 - 17:00 (Slots 60 min)', capacidad: 1 });
      await Team.create({ nombre: 'Atención al Cliente', horario_referencial: 'Lun-Sáb 08:00 - 18:00 (Continúo)', capacidad: 1 });

      await Trabajador.create({ nombre: 'Carlos Mendoza', rol: 'Experto Evaluador', contrato: 'Planilla', team: teamMecanica._id });
      await Trabajador.create({ nombre: 'Luis Flores', rol: 'Especialista', contrato: 'Recibo por Honorarios', team: teamPlanchado._id });
    }

    // 1.6 Seed Servicios y Productos
    const countServicios = await Servicio.countDocuments();
    if (countServicios === 0 && teamMecanica && teamPlanchado) {
      console.log('🌱 Creando Servicios y Productos iniciales...');
      const s1 = await Servicio.create({ nombre: 'Planchado y Pintura', descripcion: 'Reparación de carrocería, abolladuras y pintura al horno.', icono: '🚗', team_asignado: teamPlanchado._id });
      await Producto.create({ nombre: 'Planchado Básico (Masilla)', precio: 150, duracion_minutos: 120, servicio_padre: s1._id });
      await Producto.create({ nombre: 'Planchado Especial', precio: 300, duracion_minutos: 240, servicio_padre: s1._id });
      
      const s2 = await Servicio.create({ nombre: 'Mantenimiento Preventivo', descripcion: 'Afinamiento, cambio de aceite y revisión de niveles.', icono: '🔧', team_asignado: teamMecanica._id });
      await Producto.create({ nombre: 'Afinamiento Menor', precio: 120, duracion_minutos: 60, servicio_padre: s2._id });
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
