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
    color:    String,
    historial_imagenes: [{
      url: String,
      fecha: { type: Date, default: Date.now },
      descripcion: { type: String, default: '' }
    }],
    reparaciones: [{
      titulo: { type: String, required: true },
      fecha: { type: Date, default: Date.now },
      kilometraje: Number,
      piezas_cambiadas: [String],
      imagen_antes: String,
      imagen_despues: String,
      comentarios: String,
      estado: { type: String, default: 'OK' },
      cita_id: { type: Schema.Types.ObjectId, ref: 'Cita' }
    }],
    proximo_mantenimiento: {
      kilometraje: Number,
      fecha_estimada: String,
      sugerencia: String
    }
  }],
  notas:        { type: String, default: '' },
  total_citas:  { type: Number, default: 0 },
  total_gastado:{ type: Number, default: 0 },
  deuda_actual: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.models.Cliente || mongoose.model('Cliente', ClienteSchema);
