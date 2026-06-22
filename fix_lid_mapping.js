import mongoose from 'mongoose';
import Cliente from './models/Cliente.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mecanica', { directConnection: true });

  // El cliente real que tiene las 2 citas
  const clienteId = '6a27477412f00dd340b7cde8';
  // LID del número principal 933075200
  const lid1 = '65665855660142@lid';
  // LID del número secundario 941450146
  const lid2 = '9754021736576@lid';

  const updated = await Cliente.findByIdAndUpdate(
    clienteId,
    { $addToSet: { whatsapp_lids: { $each: [lid1, lid2] } } },
    { new: true }
  );

  if (updated) {
    console.log('✅ LIDs guardados en cliente:', updated.numero_telefono);
    console.log('   whatsapp_lids:', updated.whatsapp_lids);
  } else {
    console.error('❌ No se encontró el cliente con ID:', clienteId);
  }

  mongoose.disconnect();
}
run().catch(console.error);
