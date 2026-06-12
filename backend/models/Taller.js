import mongoose from 'mongoose';
const { Schema } = mongoose;

const TallerSchema = new Schema({
  nombre_taller:   { type: String, required: true, default: 'Turagua' },
  slogan:          { type: String, default: 'Endulzamos con amor 💕' },
  direccion:       { type: String, default: 'San Miguel, Lima' },
  telefono:        { type: String, default: '955479450' },
  whatsapp:        { type: String, default: '51955479450' },  // número para el deep link de WhatsApp
  email:           { type: String, default: 'citas@turagua.thradex.com' },
  horarios: {
    lunes_viernes: { type: String, default: '10:00 - 19:00' },
    sabado:        { type: String, default: '10:00 - 16:00' },
    domingo:       { type: String, default: 'Cerrado' }
  },
  servicios: [{
    nombre:              { type: String, required: true },
    descripcion:         String,
    duracion_minutos:    { type: Number, default: 60 },
    precio_base:         Number,
    icono:               { type: String, default: '🎂' },
    activo:              { type: Boolean, default: true }
  }],
  sobre_nosotros:      { type: String, default: 'En Turagua brindamos servicio automotriz integral y especializado. Nos apasiona el detalle y el rendimiento, utilizando siempre repuestos de la mejor calidad.' },
  anos_experiencia:    { type: Number, default: 5 },
  clientes_atendidos:  { type: Number, default: 1500 },
  autos_reparados:     { type: Number, default: 3000 }, // Legacy stat - maybe change later
  galeria:             [{ type: String }],  // URLs de imágenes
  redes_sociales: {
    instagram: { type: String, default: 'https://instagram.com/turagua' },
    facebook:  { type: String, default: 'https://facebook.com/' },
    tiktok:    { type: String, default: 'https://tiktok.com/' }
  },
  config_agente: {
    nombre_agente:       { type: String, default: 'Esperanza' },
    mensaje_bienvenida:  { type: String, default: '¡Hola! 💕 Soy Esperanza, de {nombre_taller}. ¿En qué te puedo ayudar hoy? ✨' },
    avatar_url:          { type: String, default: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=200' },
    instrucciones_base:  { type: String, default: '' }
  },
  campos_dinamicos_reserva: { 
    type: [String], 
    default: ["Temática o Diseño", "Tipo de masa", "Sabor del relleno", "Cantidad de porciones", "Ejemplo/Referencia visual (opcional)"] 
  },
  config_citas: {
    hora_inicio:     { type: String, default: '10:00' },
    hora_fin:        { type: String, default: '19:00' },
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
        titulo: 'Promo del Mes: Box Degustación',
        descripcion: 'Realiza tu mantenimiento preventivo con revisión de 15 puntos clave gratis.',
        etiqueta: 'PROMO DEL MES',
        mensaje_chat: 'Hola, me interesa la Promo del Mes: Box Degustación',
        color_fondo: 'primary',
        activo: true
      },
      {
        titulo: 'Especial Eventos: 15% OFF',
        descripcion: 'Reserva la mesa de dulces para tu evento con un mes de anticipación y obtén 15% de descuento.',
        etiqueta: 'ESPECIAL EVENTOS',
        mensaje_chat: 'Hola, quiero el descuento del 15% para mi evento',
        color_fondo: 'navy',
        activo: true
      }
    ]
  },
  tema_global: {
    color:  { type: String, default: '#f36c84' },
    color_secundario: { type: String, default: '#00d1ff' },
    color_fondo: { type: String, default: '#2d2425' },
    nombre: { type: String, default: 'Turagua Bot' }
  },
  constructor_bloques: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Taller || mongoose.model('Taller', TallerSchema);
