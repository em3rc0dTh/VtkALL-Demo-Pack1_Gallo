import mongoose from 'mongoose';
const { Schema } = mongoose;

const ServicioSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  icono: { type: String, default: '🔧' },
  team_asignado: { type: Schema.Types.ObjectId, ref: 'Team' },
  activo: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Servicio || mongoose.model('Servicio', ServicioSchema);
