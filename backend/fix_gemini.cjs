const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'eduar', 'Desktop', 'VTKALL', 'VtkALL-Demo-Pack1', 'backend', 'services', 'gemini.js');
let content = fs.readFileSync(filePath, 'utf8');

const anchor1 = `        disponibilidadTexto = \`\\n\\n🔴 No hay horarios disponibles para el \${fechaStr}. Por favor selecciona otra fecha.\`;`;
const targetCorrupted = `      return respuesta;`;

const missingContent = `      }
    }

    return \`Para agendar tu cita de \${servicioElegido || 'servicio'}, por favor facilítame los siguientes datos faltantes:
\${faltantes.map(f => \`- \${f}\`).join('\\n')}\${disponibilidadTexto}
Pacientes sin DNI pueden dejar este campo vacío.

Ejemplo: "Soy Juan Perez, mi placa es ABC-123, celular 999888777, quiero un Cambio de Aceite para mi Ford el 2026-05-25 a las 10:00"\`;
  }

  // 5. RESPUESTA DE BIENVENIDA O SALUDO DEFAULT
  let bienvenida = taller.config_agente?.mensaje_bienvenida || '¡Hola! 👋 Soy {nombre_agente}, el asistente de {nombre_taller}. ¿En qué te puedo ayudar hoy?';
  return bienvenida
    .replace(/{nombre_taller}/g, taller.nombre_taller)
    .replace(/{nombre_agente}/g, nombreAgente)
    .replace(/Max/g, nombreAgente);
};

// LISTA DE MODELOS GEMINI DISPONIBLES CON CUOTA ACTIVA
const MODELOS_FALLBACK = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

/**
 * Realiza una llamada a chat.completions.create con reintentos automáticos
 * usando una lista de modelos alternativos en caso de rate limits u otros errores.
 */
const llamarCompletionsConFallback = async (openaiClient, params) => {
  let ultimoError = null;
  for (const modelo of MODELOS_FALLBACK) {
    try {
      console.log(\`🤖 [Gemini API] Intentando llamada con modelo: \${modelo}...\`);
      const respuesta = await openaiClient.chat.completions.create({
        ...params,
        model: modelo
      });
      console.log(\`✅ [Gemini API] Éxito en llamada utilizando modelo: \${modelo}\`);
      return respuesta;`;

const lines = content.split('\n');
let newLines = [];
let foundAnchor = false;

for (let i = 0; i < lines.length; i++) {
  if (!foundAnchor) {
    newLines.push(lines[i]);
    if (lines[i].includes('No hay horarios disponibles para el ${fechaStr}')) {
      foundAnchor = true;
      newLines.push(missingContent);
    }
  } else {
    // Skip the corrupted part until we find the catch block
    if (lines[i].includes('} catch (err) {')) {
      newLines.push(lines[i]);
      foundAnchor = false; // Stop skipping
    }
  }
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log('File fixed.');
