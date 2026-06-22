import mongoose from 'mongoose';
const { Schema } = mongoose;

const TrabajadorSchema = new Schema({
  nombre: { type: String, required: true },
  rol: { type: String, required: true }, // e.g., "Experto Evaluador"
  contrato: { type: String, enum: ['Planilla', 'Recibo por Honorarios'], default: 'Recibo por Honorarios' },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  activo: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Trabajador || mongoose.model('Trabajador', TrabajadorSchema);
