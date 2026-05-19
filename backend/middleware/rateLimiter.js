const ipRequests = new Map();
const phoneRequests = new Map();

export const rateLimiter = (tipo = 'ip', limiteMax = 60, ventanaMs = 60000) => {
  return (req, res, next) => {
    let key = req.ip;
    
    if (tipo === 'telefono') {
      const fromField = req.body.From || '';
      key = fromField.replace('whatsapp:', '').trim() || req.ip;
    }

    const ahora = Date.now();
    const map = tipo === 'telefono' ? phoneRequests : ipRequests;

    if (!map.has(key)) {
      map.set(key, []);
    }

    const timestamps = map.get(key);
    // Filtrar los que están fuera de la ventana actual
    const validos = timestamps.filter(ts => ahora - ts < ventanaMs);
    
    if (validos.length >= limiteMax) {
      if (tipo === 'telefono') {
        // Formato TwiML de error o limitación
        res.set('Content-Type', 'text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message><Body>Has enviado demasiados mensajes seguidos. Esperá un minuto antes de volver a escribir. 🔧</Body></Message>
</Response>`);
      }
      return res.status(429).json({ error: 'Demasiadas peticiones. Por favor intenta más tarde.' });
    }

    validos.push(ahora);
    map.set(key, validos);
    next();
  };
};
