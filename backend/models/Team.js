import mongoose from 'mongoose';
const { Schema } = mongoose;

const TeamSchema = new Schema({
  nombre: { type: String, required: true },
  horario_referencial: { type: String }, // e.g., "Lun-Vie 08:00 - 18:00"
  capacidad: { type: Number, default: 1 },
  activo: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
