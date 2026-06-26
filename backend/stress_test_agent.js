import fetch from 'node-fetch';

const PORT = 4000;
const CONCURRENT_REQUESTS = 150; // 150 concurrent requests to severely stress test

const preguntas = [
  "Hola, quiero pedir un lomo saltado bien jugoso con papas fritas.",
  "¿A qué hora abren? Quiero reservar mesa para comer una paella de mariscos.",
  "Tengo mucho antojo de un ceviche mixto bien picante, ¿hacen delivery?",
  "¿Venden chaufa de pollo? Mi auto huele a comida y me antojé.",
  "Hola, ¿cuál es el menú de hoy? Quiero sopa seca con carapulcra.",
  "¿Hacen escaneo de motor? Ah no espera, me equivoqué, quería pedir una pizza hawaiana."
];

async function runStressTest() {
  console.log(`🚀 Iniciando prueba de sobreesfuerzo EXTREMA con ${CONCURRENT_REQUESTS} peticiones concurrentes...`);
  
  const promises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const delay = i * 10; // Reduced delay to increase pressure
    const preguntaAleatoria = preguntas[i % preguntas.length];
    
    const p = new Promise(resolve => setTimeout(resolve, delay)).then(() => {
      return fetch(`http://localhost:${PORT}/api/webhook/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `whatsapp:web_test_${i}_${Date.now()}`,
          body: `${preguntaAleatoria} Soy el cliente web de prueba extrema #${i}`,
          adjuntos: []
        })
      })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          successCount++;
          console.log(`[Request ${i}] ✅ OK | Rpta: ${data.respuesta ? data.respuesta.substring(0, 100) + '...' : 'Sin texto'}`);
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
