import mongoose from 'mongoose';
const { Schema } = mongoose;

const DisponibilidadSchema = new Schema({
  entidad_id: { type: Schema.Types.ObjectId, required: true }, // Referencia a Team o Trabajador
  tipo_entidad: { type: String, enum: ['Team', 'Trabajador'], required: true },
  duracion_slot_minutos: { type: Number, default: 30 }, // 30, 45, 60
  dias_laborables: { type: [Number], default: [1, 2, 3, 4, 5, 6] }, // 1=Lunes, 7=Domingo
  hora_inicio: { type: String, default: '08:00' },
  hora_fin: { type: String, default: '18:00' },
  excepciones: [{
    fecha: { type: Date }, // Fechas específicas (ej: feriados)
    bloqueado: { type: Boolean, default: true },
    motivo: { type: String }
  }]
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Disponibilidad || mongoose.model('Disponibilidad', DisponibilidadSchema);
