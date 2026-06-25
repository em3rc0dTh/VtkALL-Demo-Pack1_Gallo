const { exec } = require('child_process');

console.log('🚀 Ejecutando stress_test_agent.js (esto tomará unos minutos mientras Ollama drena su cola)...');

exec('node backend/stress_test_agent.js', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error al ejecutar la prueba:', error.message);
    return;
  }
  
  console.log('✅ Prueba finalizada. Calculando estadísticas exactas...');
  
  const lines = stdout.split('\n').filter(l => l.includes('✅ OK | Rpta:'));
  let gemini = 0, defaultResp = 0, ollama = 0;
  
  for(let line of lines) {
    if (line.includes('Soy Iris, el especialista de atención')) {
      defaultResp++;
    } else if (line.includes('🔧 En **TURAGUA RACING PERÚ** ofrecemos') || line.includes('¿Qué tipo de falla o qué mantenimiento')) {
      ollama++;
    } else {
      gemini++;
    }
  }
  
  const total = lines.length;
  console.log('\n📊 RESULTADOS FINALES:');
  console.log('Total Peticiones:', total);
  
  if (total > 0) {
    console.log(`🧠 Gemini (Capa 1): ${gemini} (${((gemini/total)*100).toFixed(2)}%)`);
    console.log(`🦙 Ollama (Capa 2): ${ollama} (${((ollama/total)*100).toFixed(2)}%)`);
    console.log(`🛡️ Default (Capa 3): ${defaultResp} (${((defaultResp/total)*100).toFixed(2)}%)`);
  } else {
    console.log('No se obtuvieron respuestas válidas para analizar.');
    console.log(stdout.substring(0, 500));
  }
});
