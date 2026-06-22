import mongoose from 'mongoose';
import Cliente from './models/Cliente.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mecanica', { directConnection: true });
  await Cliente.deleteOne({ whatsapp_lid: '9754021736576@lid' });
  console.log('Deleted corrupted client!');
  mongoose.disconnect();
}
run().catch(console.error);
