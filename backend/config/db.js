import mongoose from 'mongoose';
import { env } from './env.js';

export const conectarDB = async () => {
  try {
    const conn = await mongoose.connect(env.mongodbUri);
    console.log(`🟢 MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🔴 Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};
