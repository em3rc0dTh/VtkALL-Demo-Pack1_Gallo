import twilio from 'twilio';

export const crearRespuestaTwiML = (mensaje) => {
  // Escapar caracteres especiales de XML para evitar problemas de parsing
  const mensajeEscapado = mensaje
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Body>${mensajeEscapado}</Body>
  </Message>
</Response>`;
};

/**
 * Envía un mensaje de WhatsApp proactivo al cliente.
 * Si las credenciales son de prueba (mock) o no están configuradas, simula el envío en la consola.
 */
export const enviarMensajeWhatsApp = async (numero_telefono, mensaje) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE_NUMBER || '+14155238886'; // default Twilio sandbox number

  const esMock = !accountSid || accountSid.includes('xxxxx') || accountSid.includes('ACxxxxx') || !authToken || authToken.includes('xxxxx');

  if (esMock) {
    console.log(`\n📱 [Twilio MOCK] Enviando mensaje WhatsApp...`);
    console.log(`   De: whatsapp:${phone}`);
    console.log(`   Para: whatsapp:${numero_telefono}`);
    console.log(`   Mensaje: "${mensaje}"\n`);
    return { sid: 'MOCK_SID_' + Math.random().toString(36).substr(2, 9), status: 'sent_mock' };
  }

  try {
    const client = twilio(accountSid, authToken);
    const res = await client.messages.create({
      from: `whatsapp:${phone}`,
      to: `whatsapp:${numero_telefono}`,
      body: mensaje
    });
    console.log(`✅ [Twilio] Mensaje saliente enviado con éxito. SID: ${res.sid}`);
    return res;
  } catch (error) {
    console.error(`🔴 [Twilio] Error al enviar mensaje de WhatsApp a ${numero_telefono}:`, error);
    throw error;
  }
};
