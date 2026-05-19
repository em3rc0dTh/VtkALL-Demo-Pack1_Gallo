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
  webhook_url: { type: String, default: 'http://localhost:4000/api/webhook/whatsapp' }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Taller || mongoose.model('Taller', TallerSchema);
