import mongoose from 'mongoose';

const URI = 'mongodb://localhost:27017/mecanica-pro-1';

async function clearDB() {
  try {
    await mongoose.connect(URI);
    const Mensaje = mongoose.model('Mensaje', new mongoose.Schema({}, {strict: false}), 'mensajes');
    const result = await Mensaje.deleteMany({
      contenido: "¡Hola! 👋 Soy Esperanza, secretaria de Turagua Racing Perú. ¿En qué te puedo ayudar hoy?"
    });
    console.log("Deleted", result.deletedCount, "simulated messages from the database.");
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

clearDB();
