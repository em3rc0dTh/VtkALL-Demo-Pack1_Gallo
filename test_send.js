import mongoose from 'mongoose';
import { enviarMensajeWhatsApp } from './services/twilio.js';

mongoose.connect('mongodb://mongo:27017/turagua').then(async () => {
    console.log("Conectado a Mongo. Enviando test de WhatsApp...");
    try {
        await enviarMensajeWhatsApp('+51933075200', '¡Hola! Este es un mensaje manual forzado por el sistema para verificar que la integración de Turagua a OpenWA funciona. 🔧');
        console.log('Hecho!');
    } catch(err) {
        console.error("Fallo:", err);
    }
    process.exit(0);
}).catch(console.error);
