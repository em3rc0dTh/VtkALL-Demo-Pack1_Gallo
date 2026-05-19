import mongoose from 'mongoose';
const { Schema } = mongoose;

const UsuarioSchema = new Schema({
  nombre:       { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },  // hash bcrypt
  rol:          { type: String, enum: ['soporte', 'admin', 'recepcionista'], default: 'recepcionista' },
  activo:       { type: Boolean, default: true },
  ultimo_login: Date
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
