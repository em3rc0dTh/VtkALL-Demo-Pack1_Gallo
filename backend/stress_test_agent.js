import fetch from 'node-fetch';

const PORT = 4000;
const CONCURRENT_REQUESTS = 60; // 60 concurrent requests should trigger Gemini's rate limits

async function runStressTest() {
  console.log(`🚀 Iniciando prueba de sobreesfuerzo con ${CONCURRENT_REQUESTS} peticiones concurrentes...`);
  
  const promises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    // Small delay to prevent local socket exhaustion, but fast enough to trigger rate limits
    const delay = i * 20; 
    
    const p = new Promise(resolve => setTimeout(resolve, delay)).then(() => {
      return fetch(`http://localhost:${PORT}/api/webhook/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `whatsapp:web_test_${i}_${Date.now()}`,
          body: `Hola, ¿cuánto cuesta un cambio de aceite para mi auto? Soy el cliente web de prueba #${i}`,
          adjuntos: []
        })
      })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          successCount++;
          console.log(`[Request ${i}] ✅ OK | Rpta: ${data.respuesta ? data.respuesta.substring(0, 60) + '...' : 'Sin texto de respuesta'}`);
        } else {
          const text = await res.text();
          failCount++;
          console.log(`[Request ${i}] ❌ HTTP ${res.status} | ${text.substring(0, 60)}`);
        }
      })
      .catch(err => {
        failCount++;
        console.log(`[Request ${i}] 💥 Network Error: ${err.message}`);
      });
    });
    
    promises.push(p);
  }
  
  await Promise.all(promises);
  console.log(`\n🏁 Prueba finalizada. Éxitos: ${successCount}, Fallos: ${failCount}`);
  console.log(`Revisa la consola de tu backend (http://localhost:4000) para ver si los fallbacks a Ollama y Agente Simulado se activaron correctamente.`);
}

runStressTest();
