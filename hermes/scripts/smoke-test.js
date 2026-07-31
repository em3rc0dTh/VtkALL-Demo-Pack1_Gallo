const assert = require('assert');

const baseUrl = process.env.HERMES_API_BASE_URL || 'http://localhost:8642';
const apiKey = process.env.HERMES_API_KEY || 'local-hermes-dev-key';
const model = process.env.HERMES_MODEL_NAME || 'demo-test-agent';

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const json = await response.json();
  return { response, json };
}

async function main() {
  const health = await fetch(`${baseUrl}/healthz`);
  assert.equal(health.status, 200, 'healthz must return 200');
  const healthJson = await health.json();
  assert.equal(healthJson.profileLoaded, true, 'profile must be loaded');
  assert.equal(healthJson.backendAccess, false, 'Hermes must not have backend access in HERMES-01');

  const first = await request('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model,
      session_id: 'smoke-session',
      messages: [
        { role: 'user', content: 'Hola, quien eres y como puedes ayudarme?' },
      ],
    }),
  });
  assert.equal(first.response.status, 200, 'chat must return 200');
  const firstText = first.json.choices?.[0]?.message?.content || '';
  assert(firstText.includes('Hermes'), 'response must identify Hermes');
  assert(firstText.includes('backend'), 'response must state backend boundary');

  const second = await request('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model,
      session_id: 'smoke-session',
      messages: [
        { role: 'user', content: 'Soy Ricardo.' },
        { role: 'assistant', content: firstText },
        { role: 'user', content: 'Quiero agendar una cita.' },
      ],
    }),
  });
  assert.equal(second.response.status, 200, 'second chat must return 200');
  const secondText = second.json.choices?.[0]?.message?.content || '';
  assert(secondText.includes('Ricardo'), 'response must preserve visible name from conversation history');
  assert(/reserva|acciones/i.test(secondText), 'response must preserve scheduling boundary');
  assert.equal(second.json.hermes.backendAccess, false, 'response metadata must keep backend disabled');

  console.log('hermes smoke: PASS');
  console.log(firstText);
  console.log(secondText);
}

main().catch((error) => {
  console.error('hermes smoke: FAIL');
  console.error(error);
  process.exit(1);
});
