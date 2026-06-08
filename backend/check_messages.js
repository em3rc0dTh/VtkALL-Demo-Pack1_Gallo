import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Mensaje from './models/Mensaje.js';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mecanica-pro';

async function check() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Conectado a MongoDB");
    const messages = await Mensaje.find().sort({ recibido_en: -1 }).limit(10);
    console.log(messages);
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error checking messages in MongoDB:", error);
  }
}
check().catch(console.error);
