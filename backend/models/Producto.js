import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductoSchema = new Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  duracion_minutos: { type: Number, default: 60 },
  servicio_padre: { type: Schema.Types.ObjectId, ref: 'Servicio', required: true },
  activo: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Producto || mongoose.model('Producto', ProductoSchema);
