import mongoose from 'mongoose';

export const conectarDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mecanica-pro');
    console.log(`🟢 MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🔴 Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};
