import mongoose from 'mongoose';
const { Schema } = mongoose;

const TallerSchema = new Schema({
  nombre_taller:   { type: String, required: true, default: 'MecánicaPro' },
  slogan:          { type: String, default: 'Tu vehículo en las mejores manos' },
  direccion:       { type: String, default: 'Av. Juan B. Justo 4500, Palermo, CABA' },
  telefono:        { type: String, default: '+54 11 4789-3210' },
  whatsapp:        { type: String, default: '5491147893210' },  // número para el deep link de WhatsApp
  email:           { type: String, default: 'contacto@mecanicapro.com' },
  horarios: {
    lunes_viernes: { type: String, default: '08:00 - 18:00' },
    sabado:        { type: String, default: '09:00 - 13:00' },
    domingo:       { type: String, default: 'Cerrado' }
  },
  servicios: [{
    nombre:              { type: String, required: true },
    descripcion:         String,
    duracion_minutos:    { type: Number, default: 60 },
    precio_base:         Number,
    icono:               { type: String, default: '🔧' },
    activo:              { type: Boolean, default: true }
  }],
  sobre_nosotros:      { type: String, default: 'En MecánicaPro contamos con más de 10 años de trayectoria brindando servicios mecánicos integrales de alta calidad. Contamos con tecnología de diagnóstico computarizado avanzada y un equipo de profesionales apasionados por el cuidado de tu automóvil.' },
  anos_experiencia:    { type: Number, default: 10 },
  clientes_atendidos:  { type: Number, default: 500 },
  autos_reparados:     { type: Number, default: 2000 },
  galeria:             [{ type: String }],  // URLs de imágenes
  redes_sociales: {
    instagram: { type: String, default: 'https://instagram.com/mecanicapro' },
    facebook:  { type: String, default: 'https://facebook.com/mecanicapro' },
    tiktok:    { type: String, default: 'https://tiktok.com/@mecanicapro' }
  },
  config_agente: {
    nombre_agente:       { type: String, default: 'Max' },
    mensaje_bienvenida:  { type: String, default: '¡Hola! 👋 Soy Max, el asistente de {nombre_taller}. ¿En qué te puedo ayudar hoy?' },
    avatar_url:          { type: String, default: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=200' },
  },
  config_citas: {
    hora_inicio:     { type: String, default: '11:00' },
    hora_fin:        { type: String, default: '13:00' },
    dias_permitidos: { type: [Number], default: [1, 2, 3, 4, 5, 6] } // 1=Lunes, 6=Sábado
  },
  webhook_url: { type: String, default: 'http://localhost:4000/api/webhook/whatsapp' },
  url_fondo:   { type: String, default: '/videos/PixVerse_V6_Image_Text_360P_Create_a_visually_ (2).mp4' },
  brochure_url: { type: String, default: '' },
  promociones: {
    type: [{
      titulo:       { type: String, required: true },
      descripcion:  { type: String, required: true },
      etiqueta:     { type: String, default: 'PROMO' },
      mensaje_chat: { type: String },
      color_fondo:  { type: String, default: 'primary' },
      activo:       { type: Boolean, default: true }
    }],
    default: [
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
    ]
  },
  tema_global: {
    color:  { type: String, default: '#00aeef' },
    nombre: { type: String, default: 'Azul Eléctrico (Default)' }
  },
  constructor_bloques: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Taller || mongoose.model('Taller', TallerSchema);
