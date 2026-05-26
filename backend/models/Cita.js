import mongoose from 'mongoose';
const { Schema } = mongoose;

const CitaSchema = new Schema({
  cliente:         { type: Schema.Types.ObjectId, ref: 'Cliente' },
  numero_telefono: { type: String, required: true, index: true },
  nombre_cliente:  String,   // desnormalizado para queries rápidas
  vehiculo: {
    marca:   String,
    modelo:  String,
    anio:    Number,
    patente: String
  },
  servicio:                 { type: String, required: true }, // Mantenido para retrocompatibilidad o nombre del servicio/producto
  producto_id:              { type: Schema.Types.ObjectId, ref: 'Producto' }, // Referencia opcional al paquete específico
  tipo_cita: { 
    type: String, 
    enum: ['Evaluación Presencial', 'Evaluación con Fotos', 'Llamada Directa'], 
    default: 'Evaluación Presencial' 
  },
  experto_asignado:         { type: Schema.Types.ObjectId, ref: 'Trabajador' }, // A quién se le asignó el time slot
  descripcion_trabajo:      String,
  fecha_cita:               { type: Date, required: true, index: true },
  duracion_estimada_minutos:{ type: Number, default: 60 },
  estado: {
    type:    String,
    enum:    ['pendiente', 'validada', 'pendiente_confirmacion', 'confirmada', 'evaluacion_en_curso', 'completada', 'cancelada'],
    default: 'pendiente',
    index:   true
  },
  notas_mecanico:  String,
  precio_estimado: Number,
  precio_final:    Number,
  origen:          { type: String, enum: ['whatsapp', 'dashboard', 'web'], default: 'whatsapp' },
  recordatorio_enviado: { type: Boolean, default: false },
  fecha_recordatorio:   Date,
  estado_confirmacion:  { type: String, enum: ['pendiente', 'confirmada_cliente', 'cancelada_cliente'], default: 'pendiente', index: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Cita || mongoose.model('Cita', CitaSchema);
