import mongoose from 'mongoose';
import Cliente from './models/Cliente.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mecanica', { directConnection: true });
  const cliente = await Cliente.findOne({ whatsapp_lid: '9754021736576@lid' }).lean();
  console.log("CLIENTE:", JSON.stringify(cliente, null, 2));
  mongoose.disconnect();
}
run().catch(console.error);
