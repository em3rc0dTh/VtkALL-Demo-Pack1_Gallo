import mongoose from 'mongoose';
import Cita from './models/Cita.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mecanica', { directConnection: true });
  const citas = await Cita.find({}).lean();
  console.log("CITAS TOTALES:", citas.length);
  const citasPendientes = citas.filter(c => c.estado_confirmacion === 'pendiente' || c.recordatorio_enviado === true || c.estado === 'pendiente_confirmacion');
  console.log(JSON.stringify(citasPendientes, null, 2));
  mongoose.disconnect();
}
run().catch(console.error);
