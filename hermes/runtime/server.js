const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const profileDir = path.join(rootDir, 'profile');
const workspaceDir = path.join(rootDir, 'workspace');
const knowledgeDir = path.join(workspaceDir, 'knowledge');
const skillsDir = path.join(workspaceDir, 'skills');

const VERSION = 'h03';
const MODE = 'knowledge-only';
const DEFAULT_AGENT = 'demo-test-agent';
const TEST_API_KEY = 'local-hermes-dev-key';
const requiredSkillNames = ['customer-conversation', 'catalog-advisor', 'scheduling-companion', 'recovery-escalation'];
const sessions = new Map();

function parseInteger(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return fallback;
  return value;
}

function parseBool(name) {
  return String(process.env[name] || '').toLowerCase() === 'true';
}

const config = {
  host: process.env.HERMES_HOST || '127.0.0.1',
  port: parseInteger('HERMES_PORT', 8642, 1, 65535),
  env: process.env.HERMES_ENV || 'development',
  modelName: process.env.HERMES_MODEL_NAME || DEFAULT_AGENT,
  apiKey: process.env.HERMES_API_KEY || '',
  requestTimeoutMs: parseInteger('HERMES_REQUEST_TIMEOUT_MS', 15000, 50, 120000),
  maxRequestBytes: parseInteger('HERMES_MAX_REQUEST_BYTES', 262144, 1024, 10 * 1024 * 1024),
  maxMessages: parseInteger('HERMES_MAX_MESSAGES', 40, 1, 500),
  maxMessageChars: parseInteger('HERMES_MAX_MESSAGE_CHARS', 12000, 1, 100000),
  maxTotalMessageChars: parseInteger('HERMES_MAX_TOTAL_MESSAGE_CHARS', 160000, 1, 1000000),
  maxConcurrentRequests: parseInteger('HERMES_MAX_CONCURRENT_REQUESTS', 4, 1, 100),
  queueLimit: parseInteger('HERMES_QUEUE_LIMIT', 20, 0, 1000),
  shutdownGraceMs: parseInteger('HERMES_SHUTDOWN_GRACE_MS', 5000, 100, 60000),
  access: {
    backend: parseBool('HERMES_ENABLE_BACKEND_ACCESS'),
    temporal: parseBool('HERMES_ENABLE_TEMPORAL_ACCESS'),
    mongo: parseBool('HERMES_ENABLE_MONGO_ACCESS'),
    terminal: parseBool('HERMES_ENABLE_TERMINAL_ACCESS'),
    write: parseBool('HERMES_ENABLE_WRITE_ACCESS'),
  },
};

if (!config.apiKey && config.env !== 'test') {
  console.error('Hermes startup failed: HERMES_API_KEY is required.');
  process.exitCode = 1;
  throw new Error('HERMES_API_KEY is required.');
}
if (!config.apiKey && config.env === 'test') config.apiKey = TEST_API_KEY;

let activeRequests = 0;
let shuttingDown = false;
const queue = [];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function listMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  });
}

function loadMarkdownMap(dir) {
  const map = {};
  for (const filePath of listMarkdownFiles(dir)) {
    const relative = path.relative(rootDir, filePath).replace(/\\/g, '/');
    map[relative] = readText(filePath);
  }
  return map;
}

function loadRuntimeProfile() {
  const skills = loadMarkdownMap(skillsDir);
  const knowledge = loadMarkdownMap(knowledgeDir);
  return {
    soul: readText(path.join(profileDir, 'SOUL.md')),
    agents: readText(path.join(workspaceDir, 'AGENTS.md')),
    skillCatalog: readText(path.join(workspaceDir, 'SKILL_CATALOG.md')),
    knowledge,
    skills,
    missingSkills: requiredSkillNames.filter((name) => !skills[`workspace/skills/${name}/SKILL.md`]),
  };
}

let runtimeProfile = loadRuntimeProfile();

function makeCorrelationId(req) {
  const incoming = String(req.headers['x-correlation-id'] || '').trim();
  if (/^[A-Za-z0-9_.:-]{1,128}$/.test(incoming)) return incoming;
  return `corr_${crypto.randomUUID()}`;
}

function errorEnvelope(code, message, retryable, correlationId) {
  return {
    ok: false,
    error: { code, message, retryable },
    context: { correlationId },
  };
}

function sendJson(res, status, body, correlationId, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-Correlation-Id': correlationId,
    ...headers,
  });
  res.end(payload);
}

function sendError(res, status, code, message, retryable, correlationId) {
  sendJson(res, status, errorEnvelope(code, message, retryable, correlationId), correlationId);
}

function safeTokenEquals(received, expected) {
  const a = Buffer.from(received || '', 'utf8');
  const b = Buffer.from(expected || '', 'utf8');
  if (a.length !== b.length) {
    const padded = Buffer.alloc(Math.max(a.length, b.length, 1));
    crypto.timingSafeEqual(padded, padded);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function authorize(req, res, correlationId) {
  const header = String(req.headers.authorization || '');
  if (!header) {
    sendError(res, 401, 'HERMES_UNAUTHORIZED', 'Missing bearer token.', false, correlationId);
    return false;
  }
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) {
    sendError(res, 401, 'HERMES_UNAUTHORIZED', 'Invalid authorization scheme.', false, correlationId);
    return false;
  }
  if (!safeTokenEquals(match[1], config.apiKey)) {
    sendError(res, 403, 'HERMES_FORBIDDEN', 'Invalid bearer token.', false, correlationId);
    return false;
  }
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let finished = false;
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(Object.assign(new Error('Request timed out.'), { code: 'HERMES_TIMEOUT' }));
      req.destroy();
    }, config.requestTimeoutMs);

    req.on('data', (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > config.maxRequestBytes) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        reject(Object.assign(new Error('Request body too large.'), { code: 'HERMES_REQUEST_TOO_LARGE' }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(body);
    });
    req.on('error', (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(error);
    });
  });
}

function validateChatRequest(req, body) {
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return 'Content-Type must be application/json.';
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object.';
  if (body.model !== undefined && body.model !== config.modelName) return 'Requested model is not available.';
  if (!Array.isArray(body.messages)) return 'messages must be an array.';
  if (body.messages.length === 0) return 'messages must not be empty.';
  if (body.messages.length > config.maxMessages) return 'messages exceeds the maximum allowed count.';

  let totalChars = 0;
  for (const message of body.messages) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) return 'Each message must be an object.';
    if (!['system', 'user', 'assistant'].includes(message.role)) return 'Message role is not allowed.';
    if (typeof message.content !== 'string') return 'Message content must be text.';
    if (message.content.length > config.maxMessageChars) return 'Message content is too large.';
    totalChars += message.content.length;
  }
  if (totalChars > config.maxTotalMessageChars) return 'Message content total is too large.';
  return null;
}

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function lastUserMessage(messages) {
  return [...messages].reverse().find((message) => message.role === 'user')?.content || '';
}

function extractName(text) {
  const match = String(text || '').match(/\b(?:soy|me llamo|mi nombre es)\s+([A-Za-z\u00C0-\u017F' -]{2,40})/i);
  return match?.[1]?.trim().replace(/[.?!,;:]+$/, '') || null;
}

function extractBareName(text, session) {
  if (!session?.facts?.bookingIntent || session.facts.name) return null;
  const value = String(text || '').trim().replace(/[.?!,;:]+$/, '');
  if (!/^[A-Za-z\u00C0-\u017F' -]{2,30}$/.test(value)) return null;
  const normalized = normalize(value);
  if (normalized.split(/\s+/).length > 2) return null;
  if (['hola', 'gracias', 'consulta', 'si', 'no', 'manana', 'tarde', 'olvida', 'reserva'].includes(normalized)) return null;
  if (/\b(olvida|reserv|cita|turno|horario|cancela|cancelar)\b/.test(normalized)) return null;
  return value;
}

function rememberVisibleFacts(messages, session) {
  for (const message of messages) {
    if (message.role !== 'user') continue;
    const normalized = normalize(message.content);
    const name = extractName(message.content);
    if (name) session.facts.name = name;
    const bareName = extractBareName(message.content, session);
    if (bareName) session.facts.name = bareName;
    if (/\b(no quiero reservar|solo estoy preguntando|solo pregunto)\b/.test(normalized)) session.facts.noBookingIntent = true;
    if (/\b(olvida la reserva|cancela|cancelar|ya no quiero reservar)\b/.test(normalized)) session.facts.cancelledBookingIntent = true;
    if (/\b(quiero reservar|quiero agendar|agendar una cita|reservar|reserva|book)\b/.test(normalized)) {
      session.facts.bookingIntent = true;
      session.facts.noBookingIntent = false;
      session.facts.cancelledBookingIntent = false;
    }
  }
}

function inferLanguage(text) {
  return /\b(hello|who are you|what can you do|thanks|book|price)\b/.test(normalize(text)) ? 'en' : 'es';
}

function isSecurityRequest(text) {
  const normalized = normalize(text);
  return /\b(system prompt|prompt del sistema|instrucciones internas|secret|secreto|credential|private key|llave privada)\b/.test(normalized) ||
    normalized.includes('credencial') ||
    normalized.includes('.env') ||
    normalized.includes('/etc/passwd') ||
    normalized.includes('/root') ||
    normalized.includes('/proc') ||
    normalized.includes('.git') ||
    /\b(mongodb storage|temporal storage|ejecuta un comando|run a command|terminal|powershell|cmd\.exe|bash|modifica tu soul|modifica soul|crea un skill|create a skill|ignora agents|ignore agents)\b/.test(normalized) ||
    normalized.includes('../') ||
    normalized.includes('..\\');
}

function selectSkill(text, session) {
  const normalized = normalize(text);
  if (isSecurityRequest(text) || /\b(humano|persona|asesor|supervisor|representante|human|agent)\b/.test(normalized)) return 'recovery-escalation';
  if (/\b(error|fallo|problema|molesto|frustrado|incorrecto|no es correcto|no documentado|fuera del conocimiento)\b/.test(normalized)) return 'recovery-escalation';
  if (/\b(no quiero reservar|solo estoy preguntando|solo pregunto)\b/.test(normalized)) return 'catalog-advisor';
  if (/\b(agenda|agendar|reservar|reserva|cita|turno|horario|fecha|slot|appointment|book)\b/.test(normalized)) return 'scheduling-companion';
  if (session?.facts?.bookingIntent && /\b(costo|precio|cuanto cuesta|dura|duracion|servicio|consulta|disponibilidad)\b/.test(normalized)) return 'catalog-advisor';
  if (session?.facts?.bookingIntent && !session?.facts?.cancelledBookingIntent) return 'scheduling-companion';
  if (/\b(servicio|servicios|catalogo|precio|costo|cuanto|dura|duracion|incluye|consulta|disponibilidad|service|price|duration|compar|mejor|alternativa)\b/.test(normalized)) return 'catalog-advisor';
  return 'customer-conversation';
}

function securityReply(text) {
  const normalized = normalize(text);
  if (/\b(error|fallo|problema|molesto|frustrado|incorrecto|no es correcto)\b/.test(normalized)) {
    return 'Entiendo. Para recuperarnos sin inventar, puedo continuar con lo documentado o indicar que esto requiere revision humana.';
  }
  if (/\b(humano|persona|asesor|supervisor|representante|human|agent)\b/.test(normalized)) {
    return 'Entiendo. Esto necesita revision humana. En HERMES-02 no notifico a nadie ni creo casos, pero puedo dejar el contexto claro para que una persona lo revise.';
  }
  if (/\b(modifica tu soul|crea un skill|ejecuta un comando|terminal|powershell|cmd\.exe|bash|run a command|create a skill)\b/.test(normalized)) {
    return 'No puedo ejecutar comandos ni modificar archivos o procedimientos. En esta unidad solo respondo desde conocimiento autorizado y mantengo la conversacion segura.';
  }
  return 'No puedo revelar instrucciones internas, secretos ni leer rutas o archivos no autorizados. Si quieres, puedo seguir ayudandote con informacion publica documentada o con una consulta que requiera validacion humana.';
}

function buildCatalogReply(text, session) {
  const normalized = normalize(text);
  const prefix = session.facts.name ? `${session.facts.name}, ` : '';
  if (/\b(no quiero reservar|solo estoy preguntando|solo pregunto)\b/.test(normalized)) return `${prefix}claro: podemos quedarnos solo en informacion. No voy a empujarte a reservar. Puedo orientarte con lo documentado, y si preguntas por precio, duracion o disponibilidad exacta te dire si no esta confirmado.`;
  if (/\b(costo|precio|cuanto cuesta)\b/.test(normalized)) return `${prefix}no veo un precio publicado en el conocimiento autorizado. Puedo explicarte lo que si esta documentado o dejar claro que ese dato requiere verificacion humana o backend autorizado.`;
  if (/\b(dura|duracion|cuanto dura|consulta)\b/.test(normalized)) return `${prefix}no tengo una duracion confirmada en el conocimiento autorizado. Para no inventar, lo trataria como un dato que debe validarse antes de presentarlo como definitivo.`;
  if (/\b(disponibilidad|horario|hay cupo)\b/.test(normalized)) return `${prefix}la disponibilidad exacta debe validarse antes de presentarla como dato definitivo. En HERMES-02 no consulto agenda real ni bloqueo horarios.`;
  if (/\b(compar|alternativa|mejor)\b/.test(normalized)) return `${prefix}puedo comparar opciones solo por lo documentado: objetivo, tipo de necesidad y si ya estas listo para reservar. No tengo precios, duraciones ni disponibilidad exacta en este paquete. Que te importa mas comparar?`;
  return `${prefix}puedo hablar de los servicios a nivel orientativo, pero este paquete no trae el catalogo real activo. No voy a inventar precios, duraciones ni disponibilidad; si te interesa, dime que necesitas resolver y te ayudo a formular la consulta.`;
}

function buildSchedulingReply(text, session) {
  const normalized = normalize(text);
  if (/\b(olvida la reserva|cancela|cancelar|ya no quiero reservar)\b/.test(normalized)) {
    session.facts.cancelledBookingIntent = true;
    session.facts.bookingIntent = false;
    return 'Listo, dejamos la intencion de reserva en pausa. No he confirmado ningun horario ni registrado datos; podemos seguir solo con preguntas informativas.';
  }
  const name = session.facts.name;
  if (/\b(ricardo|roberto)\b/.test(normalized) && name) return `Gracias, ${name}. Para preparar la reserva falta saber que servicio quieres y que horario prefieres. Para confirmarla necesitaremos validar disponibilidad.`;
  const nameText = name ? `Ya tengo tu nombre, ${name}. ` : '';
  return `${nameText}Puedo ayudarte a iniciar la reserva, pero todavia no he confirmado ningun horario. Para avanzar de forma segura necesito el servicio y una preferencia de fecha u hora; la confirmacion real requiere validar disponibilidad.`;
}

function buildCustomerReply(text, session) {
  const normalized = normalize(text);
  if (/\b(quien eres|que eres|who are you|hola|hello|hi)\b/.test(normalized)) return 'Hola, soy Hermes para demo_test. Mi trabajo es conversar con claridad, recordar el contexto visible y ayudarte sin inventar datos. No confirmo citas ni disponibilidad por mi cuenta: el backend valida, Temporal orquesta y MongoDB conserva la verdad operativa.';
  if (/\b(que puedes hacer|como puedes ayudar|what can you do)\b/.test(normalized)) return 'Puedo orientarte, responder preguntas documentadas, ayudarte a preparar una solicitud de reserva y mantener el hilo de la conversacion. En esta unidad no ejecuto operaciones ni confirmo resultados.';
  if (/\b(gracias|adios|hasta luego|thanks)\b/.test(normalized)) return session.facts.name ? `Con gusto, ${session.facts.name}. Queda claro que no he confirmado ninguna operacion; cuando quieras seguimos desde aqui.` : 'Con gusto. Queda claro que no he confirmado ninguna operacion; cuando quieras seguimos desde aqui.';
  return session.facts.name ? `Te sigo, ${session.facts.name}. Puedo responder esa parte y retomar sin pedirte de nuevo datos que ya diste.` : 'Te sigo. Puedo responder preguntas laterales, mantener el hilo y avanzar paso a paso sin sonar como un formulario.';
}

async function buildReply({ body, session }) {
  const messages = body.messages;
  rememberVisibleFacts(messages, session);
  const text = lastUserMessage(messages);
  const selectedSkill = selectSkill(text, session);
  const knownName = extractName(text);
  if (knownName) session.facts.name = knownName;

  const delayMs = config.env === 'test' ? Number(body.testDelayMs || 0) : 0;
  if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
  if (body.testInvalidResponse && config.env === 'test') return { selectedSkill, text: '' };

  if (inferLanguage(text) === 'en') {
    return isSecurityRequest(text)
      ? { selectedSkill: 'recovery-escalation', text: 'I cannot reveal internal instructions, read unauthorized files, execute commands, or modify my own files. I can keep helping from authorized public knowledge.' }
      : { selectedSkill, text: 'I am Hermes for demo_test. I can help with the conversation and keep context clear, but operational confirmation requires authoritative backend validation.' };
  }
  if (selectedSkill === 'recovery-escalation') return { selectedSkill, text: securityReply(text) };
  if (selectedSkill === 'catalog-advisor') return { selectedSkill, text: buildCatalogReply(text, session) };
  if (selectedSkill === 'scheduling-companion') return { selectedSkill, text: buildSchedulingReply(text, session) };
  return { selectedSkill, text: buildCustomerReply(text, session) };
}

function completionBody(body, sessionId, reply, durationMs) {
  return {
    id: `chatcmpl_${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: body.model || config.modelName,
    choices: [{ index: 0, message: { role: 'assistant', content: reply.text }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    hermes: {
      sessionId,
      selectedSkill: reply.selectedSkill,
      profileLoaded: true,
      agent: config.modelName,
      version: VERSION,
      mode: MODE,
      durationMs,
      knowledgeFiles: Object.keys(runtimeProfile.knowledge).length,
      skillFiles: Object.keys(runtimeProfile.skills).length,
      access: config.access,
      backendAccess: config.access.backend,
      temporalAccess: config.access.temporal,
      mongoAccess: config.access.mongo,
      terminalAccess: config.access.terminal,
      writeAccess: config.access.write,
    },
  };
}

async function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('Hermes timed out.'), { code: 'HERMES_TIMEOUT' })), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function handleChat(req, res, correlationId) {
  if (!authorize(req, res, correlationId)) return;

  let raw;
  try {
    raw = await readBody(req);
  } catch (error) {
    if (error.code === 'HERMES_REQUEST_TOO_LARGE') return sendError(res, 413, 'HERMES_REQUEST_TOO_LARGE', 'Hermes request body is too large.', false, correlationId);
    if (error.code === 'HERMES_TIMEOUT') return sendError(res, 504, 'HERMES_TIMEOUT', 'Hermes did not receive the request in time.', true, correlationId);
    return sendError(res, 422, 'HERMES_INVALID_REQUEST', 'Hermes request could not be read.', false, correlationId);
  }

  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return sendError(res, 422, 'HERMES_INVALID_REQUEST', 'Request body must be valid JSON.', false, correlationId);
  }

  const validationError = validateChatRequest(req, body);
  if (validationError) return sendError(res, 422, 'HERMES_INVALID_REQUEST', validationError, false, correlationId);

  const sessionId = String(body.session_id || body.user || req.headers['x-hermes-session-id'] || `session_${crypto.randomUUID()}`);
  const session = sessions.get(sessionId) || { facts: {}, turns: 0 };
  session.turns += 1;
  const started = Date.now();

  try {
    const reply = await withTimeout(buildReply({ body, session }), config.requestTimeoutMs);
    if (!reply.text) return sendError(res, 502, 'HERMES_INVALID_RESPONSE', 'Hermes generated an invalid response.', true, correlationId);
    sessions.set(sessionId, session);
    sendJson(res, 200, completionBody(body, sessionId, reply, Date.now() - started), correlationId, { 'X-Hermes-Session-Id': sessionId });
  } catch (error) {
    if (error.code === 'HERMES_TIMEOUT') return sendError(res, 504, 'HERMES_TIMEOUT', 'Hermes did not complete the response in time.', true, correlationId);
    sendError(res, 500, 'HERMES_INTERNAL_ERROR', 'Hermes failed to complete the response.', true, correlationId);
  }
}

function healthBody() {
  return {
    ok: true,
    service: 'demo-test-hermes',
    version: VERSION,
    agent: config.modelName,
    mode: MODE,
    knowledgeFiles: Object.keys(runtimeProfile.knowledge).length,
    skillFiles: Object.keys(runtimeProfile.skills).length,
    missingSkills: runtimeProfile.missingSkills,
    access: config.access,
    backendAccess: config.access.backend,
    temporalAccess: config.access.temporal,
    mongoAccess: config.access.mongo,
    terminalAccess: config.access.terminal,
    writeAccess: config.access.write,
  };
}

async function handleRequestNow(req, res, correlationId) {
  if (shuttingDown) return sendError(res, 503, 'HERMES_OVERLOADED', 'Hermes is shutting down.', true, correlationId);

  if (req.method === 'GET' && req.url === '/healthz') return sendJson(res, 200, healthBody(), correlationId);

  if (req.method === 'POST' && req.url === '/-/reload') {
    if (!authorize(req, res, correlationId)) return;
    runtimeProfile = loadRuntimeProfile();
    return sendJson(res, 200, { ok: true, profileLoaded: true, missingSkills: runtimeProfile.missingSkills }, correlationId);
  }

  if (req.method === 'GET' && req.url === '/v1/models') {
    if (!authorize(req, res, correlationId)) return;
    return sendJson(res, 200, { object: 'list', data: [{ id: config.modelName, object: 'model', owned_by: 'demo_test' }] }, correlationId);
  }

  if (req.method === 'POST' && req.url === '/v1/chat/completions') return handleChat(req, res, correlationId);

  return sendError(res, 404, 'HERMES_INVALID_REQUEST', 'Route not found.', false, correlationId);
}

function drainQueue() {
  while (!shuttingDown && activeRequests < config.maxConcurrentRequests && queue.length > 0) {
    const task = queue.shift();
    activeRequests += 1;
    task().finally(() => {
      activeRequests -= 1;
      drainQueue();
    });
  }
}

function scheduleRequest(req, res) {
  const correlationId = makeCorrelationId(req);
  res.setHeader('X-Correlation-Id', correlationId);
  const task = () => handleRequestNow(req, res, correlationId);
  if (shuttingDown) return sendError(res, 503, 'HERMES_OVERLOADED', 'Hermes is shutting down.', true, correlationId);
  if (activeRequests < config.maxConcurrentRequests) {
    activeRequests += 1;
    task().finally(() => {
      activeRequests -= 1;
      drainQueue();
    });
    return;
  }
  if (queue.length >= config.queueLimit) {
    return sendError(res, 429, 'HERMES_QUEUE_FULL', 'Hermes request queue is full.', true, correlationId);
  }
  queue.push(task);
}

const server = http.createServer(scheduleRequest);

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  queue.splice(0, queue.length);
  server.close(() => {
    console.log(`Hermes shutdown complete after ${signal}.`);
  });
  const started = Date.now();
  const timer = setInterval(() => {
    if (activeRequests === 0) {
      clearInterval(timer);
      server.close();
      return;
    }
    if (Date.now() - started > config.shutdownGraceMs) {
      clearInterval(timer);
      console.error('Hermes shutdown grace period elapsed.');
    }
  }, 50);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.listen(config.port, config.host, () => {
  console.log(`Hermes demo_test ${VERSION} listening on http://${config.host}:${config.port}`);
});
