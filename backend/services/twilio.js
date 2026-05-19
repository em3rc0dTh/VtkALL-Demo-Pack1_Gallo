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
