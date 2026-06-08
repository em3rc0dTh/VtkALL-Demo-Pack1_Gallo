import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Cita from './models/Cita.js';
import Cliente from './models/Cliente.js';
import { procesarMensajeIA } from './services/gemini.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mecanica-pro';

async function test() {
  await mongoose.connect(mongoUri);
  console.log("Conectado a MongoDB");

  let cliente = await Cliente.findOne({ numero_telefono: "51933075200" });
  if (!cliente) {
    cliente = new Cliente({
      nombre: "Cliente Prueba",
      numero_telefono: "51933075200",
      vehiculos: []
    });
    await cliente.save();
  }

  const cita = new Cita({
    cliente: cliente._id,
    nombre_cliente: "Cliente Prueba",
    numero_telefono: "51933075200",
    servicio: "Planchado y Pintura",
    fecha_cita: new Date(Date.now() + 24 * 60 * 60 * 1000),
    estado: 'pendiente_confirmacion',
    recordatorio_enviado: true,
    estado_confirmacion: 'pendiente',
    fecha_recordatorio: new Date()
  });
  await cita.save();
  console.log("Cita creada:", cita._id);

  console.log("Simulando mensaje entrante de 'Sí'...");
  const reply = await procesarMensajeIA("51933075200", "Sí");
  console.log("Respuesta del bot:", reply);

  const updatedCita = await Cita.findById(cita._id);
  console.log("Estado de la cita después del mensaje:", updatedCita.estado);
  console.log("Confirmación de la cita después del mensaje:", updatedCita.estado_confirmacion);

  await Cita.findByIdAndDelete(cita._id);
  console.log("Cita de prueba eliminada");
  await mongoose.disconnect();
}

test().catch(console.error);
