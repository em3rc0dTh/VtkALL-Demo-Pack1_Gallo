import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import mongoose from 'mongoose';
import Cita from './models/Cita.js';
import Cliente from './models/Cliente.js';
import Taller from './models/Taller.js';

// We import the webhook router and extract the procesarMensajeCompleto function
// Wait, procesarMensajeCompleto is not exported from webhook.js!
// Let's write a quick mock call or test using fetch or by calling it internally.
// We can just simulate the exact logic here or modify webhook.js to export it for testing,
// or we can test by sending a local HTTP request using fetch if the backend is running.
// Wait, is the backend server running on port 4000? Let's check!

const PORT = 4000;

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mecanica-pro');
  console.log("Conectado a MongoDB");

  // Ensure Taller config exists
  let taller = await Taller.findOne();
  if (!taller) {
    taller = new Taller({
      nombre_taller: "Turagua Racing Perú",
      config_agente: { nombre_agente: "Esperanza" }
    });
    await taller.save();
  }

  // 1. Create a client
  let cliente = await Cliente.findOne({ numero_telefono: "51933075200" });
  if (!cliente) {
    cliente = new Cliente({
      nombre: "Eduardo Farid",
      numero_telefono: "51933075200",
      vehiculos: []
    });
    await cliente.save();
  }

  // 2. Create a pending citation
  const cita = new Cita({
    cliente: cliente._id,
    nombre_cliente: "Eduardo Farid",
    numero_telefono: "51933075200",
    servicio: "Planchado y Pintura",
    fecha_cita: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
    estado: 'pendiente_confirmacion',
    recordatorio_enviado: true,
    estado_confirmacion: 'pendiente',
    fecha_recordatorio: new Date()
  });
  await cita.save();
  console.log("Cita de prueba creada con ID:", cita._id);

  try {
    // Perform a POST request to the local webhook
    const response = await fetch(`http://localhost:${PORT}/api/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'message.received',
        payload: {
          id: 'test_msg_id_' + Math.random().toString(36).substr(2, 9),
          from: '51933075200@c.us',
          to: 'bot@c.us',
          body: 'Sí',
          type: 'chat',
          timestamp: Date.now(),
          fromMe: false,
          isGroup: false
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Respuesta de la API de Webhook (para 'Sí'):", data);
      
      const updatedCita = await Cita.findById(cita._id);
      console.log("Estado de la cita después de 'Sí':", updatedCita.estado);
      console.log("Confirmación de la cita después de 'Sí':", updatedCita.estado_confirmacion);
    } else {
      console.error("Error al llamar al webhook:", response.status, await response.text());
    }

    // Test non-confirm/cancel message (default template redirection)
    const responseHelp = await fetch(`http://localhost:${PORT}/api/webhook/whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'message.received',
        payload: {
          id: 'test_msg_id_' + Math.random().toString(36).substr(2, 9),
          from: '51933075200@c.us',
          to: 'bot@c.us',
          body: '¿Tienen citas los sábados?',
          type: 'chat',
          timestamp: Date.now(),
          fromMe: false,
          isGroup: false
        }
      })
    });

    if (responseHelp.ok) {
      const dataHelp = await responseHelp.json();
      console.log("Respuesta de la API de Webhook (para pregunta genérica):", dataHelp.respuesta);
    }

  } catch (err) {
    console.error("Error en la ejecución de la petición local. Asegúrese de que el servidor backend esté corriendo en el puerto 4000.", err);
  } finally {
    await Cita.findByIdAndDelete(cita._id);
    console.log("Cita de prueba eliminada.");
    await mongoose.disconnect();
  }
}

runTest();
