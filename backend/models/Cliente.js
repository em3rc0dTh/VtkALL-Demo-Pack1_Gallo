import mongoose from 'mongoose';
const { Schema } = mongoose;

const ClienteSchema = new Schema({
  nombre:          { type: String, default: '' },
  dni:             { type: String, default: '' },
  numero_telefono: { type: String, required: true, unique: true, index: true },
  email:           { type: String, default: '' },
  detalles_extra:  { type: Schema.Types.Mixed, default: {} },
  notas:        { type: String, default: '' },
  total_citas:  { type: Number, default: 0 },
  total_gastado:{ type: Number, default: 0 },
  deuda_actual: { type: Number, default: 0 },
  whatsapp_lid:  { type: String, index: true },         // Legacy: single LID (backward compat)
  whatsapp_lids: { type: [String], default: [], index: true } // Array of all known LIDs for this client
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
