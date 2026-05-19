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
  servicio:                 { type: String, required: true },
  descripcion_trabajo:      String,
  fecha_cita:               { type: Date, required: true, index: true },
  duracion_estimada_minutos:{ type: Number, default: 60 },
  estado: {
    type:    String,
    enum:    ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'],
    default: 'pendiente',
    index:   true
  },
  notas_mecanico:  String,
  precio_estimado: Number,
  precio_final:    Number,
  origen:          { type: String, enum: ['whatsapp', 'dashboard', 'web'], default: 'whatsapp' }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Cita || mongoose.model('Cita', CitaSchema);
