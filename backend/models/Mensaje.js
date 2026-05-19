import mongoose from 'mongoose';
const { Schema } = mongoose;

const MensajeSchema = new Schema({
  numero_telefono: { type: String, required: true, index: true },
  nombre_cliente:  String,
  contenido:       { type: String, required: true },
  remitente:       { type: String, enum: ['cliente', 'asistente'], required: true },
  cita_generada:   { type: Schema.Types.ObjectId, ref: 'Cita' },  // poblado si el mensaje creó una cita
  procesado:       { type: Boolean, default: false }
}, { timestamps: { createdAt: 'recibido_en', updatedAt: false } });

export default mongoose.models.Mensaje || mongoose.model('Mensaje', MensajeSchema);
