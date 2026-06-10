import mongoose from 'mongoose';
import Cita from './models/Cita.js';
import Cliente from './models/Cliente.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mecanica', { directConnection: true });
  
  const originalLid = '9754021736576@lid';
  const numeroTelefono = '941450146';
  
  const numeroLimpio = numeroTelefono.replace(/[^0-9]/g, '');
  let numeroPeruano = numeroLimpio;
  if (numeroLimpio.length === 11 && numeroLimpio.startsWith('51')) {
    numeroPeruano = numeroLimpio.substring(2);
  }
  const telefonoProcesamiento = numeroTelefono;

  let cliente = await Cliente.findOne({ 
    $or: [
      { numero_telefono: numeroLimpio },
      { numero_telefono: numeroPeruano },
      { numero_telefono: '51' + numeroPeruano },
      { numero_telefono: '+' + numeroLimpio },
      { numero_telefono: '+51' + numeroPeruano },
      { whatsapp_lid: originalLid }
    ]
  });

  console.log("CLIENTE ENCONTRADO:", cliente ? cliente._id : "NUEVO");

  const query = {
    $or: [
      { cliente: cliente ? cliente._id : new mongoose.Types.ObjectId() },
      { numero_telefono: { $in: [telefonoProcesamiento, numeroPeruano, '51' + numeroPeruano, '+51' + numeroPeruano, '+' + telefonoProcesamiento] } }
    ],
    recordatorio_enviado: true,
    estado_confirmacion: 'pendiente',
    estado: { $in: ['confirmada', 'pendiente_confirmacion'] }
  };

  console.log("QUERY DE CITA:", JSON.stringify(query, null, 2));

  const citasRecordatorio = await Cita.find(query);
  console.log("CITAS ENCONTRADAS:", citasRecordatorio.length);

  mongoose.disconnect();
}
run().catch(console.error);
