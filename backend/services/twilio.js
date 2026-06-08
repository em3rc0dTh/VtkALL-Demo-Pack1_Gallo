import twilio from 'twilio';
import Cliente from '../models/Cliente.js';

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
  const openwaUrl = process.env.OPENWA_API_URL;
  const openwaKey = process.env.OPENWA_API_KEY;
  const openwaSession = process.env.OPENWA_SESSION_NAME || 'mecanica-bot';

  if (openwaUrl) {
    try {
      let numeroLimpio = numero_telefono.replace(/[^0-9]/g, '');
      // Si es un número celular de Perú de 9 dígitos, le anteponemos el código de país '51'
      if (numeroLimpio.length === 9 && numeroLimpio.startsWith('9')) {
        numeroLimpio = '51' + numeroLimpio;
      }

      // 1. Intentar resolver si el cliente ya tiene un whatsapp_lid guardado en la DB
      let resolvedChatId = `${numeroLimpio}@c.us`;
      try {
        const clientObj = await Cliente.findOne({
          $or: [
            { whatsapp_lid: numero_telefono },
            { numero_telefono: numero_telefono },
            { numero_telefono: numeroLimpio },
            { numero_telefono: numeroLimpio.substring(2) }
          ]
        });
        if (clientObj && clientObj.whatsapp_lid) {
          resolvedChatId = clientObj.whatsapp_lid;
          console.log(`ℹ️ [OpenWA] Usando LID guardado para enviar mensaje: ${resolvedChatId}`);
        }
      } catch (dbErr) {
        console.warn(`⚠️ [OpenWA] No se pudo consultar el LID del cliente en la DB:`, dbErr.message);
      }
      
      // Resolve the database session UUID from the configured session name
      let resolvedSessionId = openwaSession;
      try {
        const listRes = await fetch(`${openwaUrl}/sessions`, {
          headers: {
            'X-API-Key': openwaKey || ''
          }
        });
        if (listRes.ok) {
          const sessions = await listRes.json();
          const match = sessions.find(s => s.name === openwaSession);
          if (match) {
            resolvedSessionId = match.id;
          }
        }
      } catch (lookupErr) {
        console.warn(`⚠️ [OpenWA] No se pudo obtener la lista de sesiones, usando '${openwaSession}' como ID:`, lookupErr.message);
      }

      const url = `${openwaUrl}/sessions/${resolvedSessionId}/messages/send-text`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': openwaKey || ''
        },
        body: JSON.stringify({
          chatId: resolvedChatId,
          text: mensaje
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenWA respondió con código ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const messageId = data.messageId || data.id;
      console.log(`✅ [OpenWA] Mensaje saliente enviado con éxito. ID:`, messageId);

      // 2. Extraer y guardar el mapeo del LID si el ID contiene @lid
      if (messageId && typeof messageId === 'string') {
        const parts = messageId.split('_');
        if (parts.length >= 2 && parts[1].endsWith('@lid')) {
          const resolvedLid = parts[1];
          try {
            const updated = await Cliente.findOneAndUpdate(
              {
                $or: [
                  { whatsapp_lid: resolvedLid },
                  { numero_telefono: numero_telefono },
                  { numero_telefono: numeroLimpio },
                  { numero_telefono: numeroLimpio.substring(2) }
                ]
              },
              { $set: { whatsapp_lid: resolvedLid } },
              { new: true }
            );
            if (updated) {
              console.log(`✅ [OpenWA] Guardado mapeo LID ${resolvedLid} para cliente ${updated.nombre || updated.numero_telefono}`);
            }
          } catch (saveErr) {
            console.error('Error al guardar el mapping LID en la DB:', saveErr);
          }
        }
      }

      return { sid: messageId || 'OPENWA_SID', status: 'sent' };
    } catch (error) {
      console.error(`🔴 [OpenWA] Error al enviar mensaje a ${numero_telefono}:`, error);
      throw error;
    }
  }

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
