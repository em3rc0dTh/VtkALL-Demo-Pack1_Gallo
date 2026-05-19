import mongoose from 'mongoose';
const { Schema } = mongoose;

const ClienteSchema = new Schema({
  nombre:          { type: String, default: '' },
  dni:             { type: String, default: '' },
  numero_telefono: { type: String, required: true, unique: true, index: true },
  email:           { type: String, default: '' },
  vehiculos: [{
    marca:    String,
    modelo:   String,
    anio:     Number,
    patente:  { type: String, uppercase: true, trim: true },
    color:    String
  }],
  notas:        { type: String, default: '' },
  total_citas:  { type: Number, default: 0 }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
