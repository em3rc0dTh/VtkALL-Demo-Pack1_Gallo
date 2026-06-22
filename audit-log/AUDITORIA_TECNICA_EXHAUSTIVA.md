# Auditoria tecnica exhaustiva - mecanica

Fecha: 2026-06-22  
Ruta auditada: `C:\Users\eduar\Desktop\ai-integrations\mecanica`

## Alcance y criterio

El repositorio mezcla codigo propio, dependencias instaladas, artefactos generados y copias/vendorizaciones grandes. Audite el codigo mantenible del producto: raiz operativa, `backend`, `frontend`, `qa-automation`, `temporal-suite/workflows/src`, configuracion Docker/Nginx y scripts auxiliares relevantes. No hice revision linea por linea de `node_modules`, `.next`, archivos multimedia, `openwa.tar.gz`, ni copias extensas de terceros dentro de `temporal-suite` porque no son fuente propia; deben auditarse por lockfiles, SBOM y escaneo de dependencias.

## Inventario del proyecto

### Estructura principal

```text
mecanica/
  backend/                 Express + Mongoose + chatbot + integraciones
    config/db.js
    middleware/auth.js
    middleware/rateLimiter.js
    models/*.js
    routes/*.js
    services/*.js
    utils/*.js
    upload_utils/          artefactos de usuario; no deberia vivir como codigo
  frontend/                Next.js 16 + React 19 + Tailwind
    app/
    components/dashboard/
    components/landing/
    components/ui/
    hooks/
    lib/api.js
    proxy.js
  temporal-suite/workflows/src/
    workflows y workers Temporal propios de demo/dominio
  qa-automation/
    Jest aislado para recordatorios
  openwa/
    servicio Nest/React separado, parece producto vendorizado o subproyecto
  docker-compose*.yml
  nginx*.conf
  scripts root *.js/*.py/*.sh
```

### Lenguajes, frameworks y dependencias

- Backend: Node.js ESM, Express, Mongoose, bcrypt, jsonwebtoken, multer, Twilio, OpenAI compatible Gemini, Temporal client.
- Frontend: Next.js App Router, React client components, Tailwind CSS, lucide-react, framer-motion, recharts, sweetalert2.
- Workflows: TypeScript, Temporal SDK.
- QA: Jest CommonJS con mocks manuales.
- Infra: Docker Compose, Nginx, MongoDB, Postgres, Temporal, OpenWA.

### Arquitectura encontrada

Es un monorepo pragmatico tipo "modular monolith distribuido por carpetas": frontend Next.js, backend Express, Temporal para procesos async, OpenWA para WhatsApp y MongoDB como almacenamiento principal. La arquitectura real del backend es MVC ligero: rutas HTTP contienen controladores y mucho dominio; modelos Mongoose actuan como entidades/anemicos; servicios concentran integraciones externas e IA. No hay capa de aplicacion clara, DTOs, validadores centrales, repositorios ni politicas de autorizacion granulares.

Puntos de entrada:

- Backend: `backend/index.js`
- Frontend: `frontend/app/page.js`, `frontend/app/admin/dashboard/page.js`, `frontend/app/admin/login/page.js`
- API cliente: `frontend/lib/api.js`
- Workflows: `temporal-suite/workflows/src/*/worker.ts` y `workflow(s).ts`
- Docker: `docker-compose.yml`, `docker-compose.prod.yml`

Archivos ignorados: `.gitignore` cubre `node_modules`, `.env` por subcarpetas y `openwa.tar.gz`, pero no cubre consistentemente `.next`, `backend/upload_utils`, `qa-automation/node_modules`, ni artefactos generados del frontend. Esto ya genero ruido operativo.

## Resumen ejecutivo

El proyecto tiene una base funcional con bastante producto construido: dashboard administrativo, landing configurable, chat asistido por IA, agendamiento, recordatorios, integracion WhatsApp/OpenWA/Twilio y workflows Temporal. La mayor deuda no esta en que "no funcione"; esta en que la frontera de confianza esta demasiado blanda para operar en produccion.

Riesgos principales:

- Credenciales y usuarios por defecto en codigo y UI.
- Endpoints publicos que exponen historial, agendan, suben archivos e interactuan con Temporal sin firma o autorizacion robusta.
- Render de HTML configurable con `dangerouslySetInnerHTML`, riesgo XSS persistente.
- Autorizacion demasiado gruesa: casi cualquier usuario autenticado puede mutar datos sensibles.
- Logica de negocio grande dentro de rutas/servicios, dificil de probar y cambiar sin regresiones.
- Validacion parcial y sin DTOs/schema validation.
- Datos sensibles y artefactos de usuario servidos estaticamente desde el backend.

Calificaciones globales:

| Area | Nota |
|---|---:|
| Calidad de codigo | 5.5/10 |
| Arquitectura | 5/10 |
| Seguridad | 3/10 |
| Escalabilidad | 4.5/10 |
| Mantenibilidad | 4.5/10 |
| Performance | 5/10 |
| Testabilidad | 3.5/10 |

## Hallazgos criticos y altos

### 1. Usuarios y passwords por defecto en produccion

Referencias:

- `backend/index.js:209`, `backend/index.js:221`
- `backend/index.js:229`, `backend/index.js:241`
- `frontend/app/admin/login/page.js:167`

Se crean usuarios `admin@mecanicapro.com` y `soporte@mecanicapro.com` con passwords conocidos y se muestran credenciales de prueba en la pantalla de login.

Severidad: Critica.  
Riesgo: toma total del dashboard si el deploy conserva seed automatico.  
Escenario: atacante abre `/admin/login`, ve credenciales o las conoce por codigo, entra y modifica clientes, citas, mensajes, configuracion y contenido HTML.

Correccion:

```js
if (process.env.NODE_ENV !== 'production' && process.env.SEED_DEFAULT_USERS === 'true') {
  await seedDefaultUsers();
}

if (process.env.NODE_ENV === 'production' && !process.env.INITIAL_ADMIN_PASSWORD) {
  throw new Error('INITIAL_ADMIN_PASSWORD is required in production');
}
```

### 2. JWT con secreto hardcodeado

Referencia: `backend/utils/jwt.js:3`

Si `JWT_SECRET` falta, el sistema usa `supersecrettoken1234!`.

Severidad: Critica.  
Riesgo: falsificacion de cookies JWT.  
Correccion: fallar al iniciar en produccion si falta secreto y rotar todos los tokens.

```js
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 chars');
}
```

### 3. Cookie de sesion sin `secure` y sin hardening por ambiente

Referencia: `backend/routes/auth.js:30-32`

`secure: false` esta fijo. Con HTTPS debe ser `true`; tambien falta politica de expiracion/rotacion mas cuidada.

Severidad: Alta.  
Correccion:

```js
const isProd = process.env.NODE_ENV === 'production';
res.cookie('token', token, {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'lax' : 'strict',
  maxAge: 8 * 60 * 60 * 1000,
});
```

### 4. Endpoints Temporal sin autenticacion

Referencias:

- `backend/routes/temporal.js:18`
- `backend/routes/temporal.js:57`
- `backend/routes/temporal.js:93`

`/api/temporal/start`, `/baker-quote`, `/client-approve` no usan `protegerRuta`, firma HMAC ni token interno.

Severidad: Critica.  
Riesgo: cualquier cliente puede crear pedidos/workflows, aprobar o rechazar procesos y alterar precios/imagenes.  
Correccion: proteger endpoints internos con JWT admin o HMAC de servicio.

```js
router.post('/baker-quote', protegerRuta, soloAdmin, validate(bakerQuoteSchema), handler);
```

### 5. Fuga de historial de chat por telefono

Referencia: `backend/routes/webhook.js:347`

`GET /api/webhook/historial/:telefono` es publico y devuelve mensajes y cliente. El frontend lo usa para sesiones web, pero no hay secreto de sesion, token corto, captcha, ni prueba de posesion del telefono.

Severidad: Alta.  
Escenario: enumerar telefonos y leer conversaciones.  
Correccion: separar historial web anonimo de historial por telefono real; usar `web_session_id` firmado y nunca aceptar telefonos arbitrarios publicamente.

### 6. Upload publico de archivos

Referencias:

- `backend/routes/upload.js:95`
- `backend/index.js:48`

`/api/upload/public` acepta archivos sin auth y `/upload_utils` sirve todo estaticamente.

Severidad: Alta.  
Riesgo: abuso de almacenamiento, hosting de contenido, exposicion de PDFs/cotizaciones, malware disfrazado si MIME no coincide con contenido.  
Correccion: validar magic bytes, autenticar o firmar flujo publico, limitar por IP/session, enviar a almacenamiento privado con URLs firmadas, y separar evidencia publica de documentos internos.

### 7. XSS persistente por HTML configurable

Referencias:

- `frontend/components/landing/EmbedBlock.js:19`
- `frontend/components/dashboard/FreeCanvasEditor.js:194`
- `frontend/components/landing/FreeCanvas.js:35`

Renderiza HTML desde configuracion/contenido sin sanitizacion.

Severidad: Alta.  
Escenario: usuario con acceso dashboard guarda `<script>` o atributos `onerror`; visitantes o admins ejecutan JS.  
Correccion: usar DOMPurify con allowlist estricta o reemplazar HTML libre por bloques estructurados.

```js
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(htmlContent, { ALLOWED_TAGS: ['b','strong','i','p','br','a'] });
```

### 8. Docker prod con credenciales por defecto y puertos sensibles

Referencias:

- `docker-compose.prod.yml:13-14`
- `docker-compose.prod.yml:27-32`
- `docker-compose.prod.yml:43`
- `docker-compose.prod.yml:72`, `86`, `97`, `120`, `140`

Produccion conserva `admin/admin`, `temporal/temporal`, Mongo Express expuesto y puertos de base/Temporal publicados.

Severidad: Critica si el servidor esta expuesto a Internet.  
Correccion: secrets externos, no publicar DB/Temporal/UI fuera de red privada, eliminar Mongo Express en prod o protegerlo por VPN/SSO.

### 9. Exposicion de stack trace al cliente

Referencia: `backend/routes/citas.js:417`

Devuelve `error.stack`.

Severidad: Media/Alta.  
Riesgo: filtrado de rutas, librerias, estructura interna.  
Correccion: log interno con correlation id y respuesta generica.

### 10. Autorizacion insuficiente en mutaciones

Patron en rutas: `clientes`, `citas`, `servicios`, `productos`, `teams`, `trabajadores`, `configuracion` usan `protegerRuta`, pero pocas usan `soloAdmin`. Un rol `soporte` o `recepcionista` podria modificar precios, deudas, citas, clientes y configuracion.

Severidad: Alta.  
Correccion: matriz RBAC por accion:

```js
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.usuario.rol) ? next() : res.status(403).json({ error: 'Forbidden' });
```

## Revision archivo por archivo

### Backend

| Archivo | Proposito | Calidad | Observaciones |
|---|---|---:|---|
| `backend/index.js` | Boot Express, CORS, rutas, seed, cron | 4/10 | Hace demasiadas cosas: servidor, seed, datos demo, scheduling. Viola SRP. Riesgo critico por usuarios por defecto. |
| `backend/config/db.js` | Conexion Mongo | 6/10 | Simple y legible; debe validar URI en prod y no usar fallback silencioso. |
| `backend/middleware/auth.js` | Validar cookie JWT y rol admin | 6/10 | Correcto como minimo; falta RBAC granular y manejo de expiracion/rotacion. |
| `backend/middleware/rateLimiter.js` | Rate limit in-memory por IP/telefono | 4/10 | No escala multi-instancia, Map puede crecer sin limite, no protege endpoints criticos salvo webhook. Usar Redis/express-rate-limit. |
| `backend/utils/jwt.js` | Firmar/verificar JWT | 3/10 | Secreto hardcodeado. Falta exigir env fuerte. |
| `backend/utils/fechas.js` | Slots, formato y agenda | 6/10 | Dominio util; requiere pruebas de zona horaria, DST, solapamientos y capacidad. |
| `backend/models/*.js` | Modelos Mongoose | 5/10 | Rapidos de entender, pero abusan de `Schema.Types.Mixed`, hay poca validacion e indices parciales. |
| `backend/routes/auth.js` | Login/logout/me | 5/10 | Bcrypt bien; falta rate limit de login, secure cookie por ambiente, lockout y auditoria. |
| `backend/routes/citas.js` | CRUD y flujo financiero/agenda | 4/10 | Archivo grande, muchas responsabilidades, transacciones ausentes, expone stack, limite default 1000. |
| `backend/routes/clientes.js` | CRUD clientes, vehiculos, reparaciones, merge | 4/10 | Regex no escapado, N+1 en alias, merge/delete sin transaccion. Validacion insuficiente. |
| `backend/routes/configuracion.js` | Config publica y update admin | 5/10 | GET publico razonable; PUT permite contenido que despues se renderiza como HTML. Fetch externo sin timeout. |
| `backend/routes/disponibilidad.js` | Disponibilidad por entidad | 5/10 | GET publico por ID puede revelar capacidad/horarios internos; falta validacion ObjectId. |
| `backend/routes/mensajes.js` | Conversaciones dashboard | 5/10 | Agregaciones utiles; N+1 para nombres; falta paginacion por conversacion y RBAC. |
| `backend/routes/productos.js` | CRUD productos | 5/10 | Simple; `findByIdAndUpdate(req.body)` acepta campos arbitrarios. |
| `backend/routes/servicios.js` | CRUD servicios/productos agrupados | 5/10 | N+1 por productos; update abierto. |
| `backend/routes/teams.js` | CRUD equipos | 5/10 | Simple; falta validacion y roles. |
| `backend/routes/trabajadores.js` | CRUD trabajadores | 5/10 | Simple; falta validacion y roles. |
| `backend/routes/upload.js` | Upload local | 3/10 | Public upload, storage local, MIME trust, archivos servidos publicamente. |
| `backend/routes/webhook.js` | WhatsApp/OpenWA/web chat/agendamiento | 4/10 | Mucha logica, endpoints publicos sensibles, dedupe in-memory, posible fuga PII. |
| `backend/routes/temporal.js` | Bridge HTTP a Temporal | 2/10 | Sin auth. Ademas crea `Cita` con campos inconsistentes (`telefono_cliente` no existe, `numero_telefono` requerido). |
| `backend/services/gemini.js` | Agente IA y tools de BD | 3/10 | Archivo monolitico; IA puede ejecutar tools sensibles si prompt/flujo falla. Falta policy layer y validacion schema. |
| `backend/services/twilio.js` | Envio WhatsApp Twilio/OpenWA | 6/10 | Escapa TwiML correctamente; logs pueden exponer numeros/mensajes. Falta timeout/retry/backoff. |
| `backend/services/recordatorios.js` | Cron de recordatorios/cancelaciones | 5/10 | Funcional; no hay lock distribuido, transacciones ni idempotencia fuerte. |
| `backend/seed.js`, tests manuales | Utilidades dev | 4/10 | Deben moverse a `scripts/` y protegerse de ejecucion accidental. |

### Frontend

| Archivo/grupo | Proposito | Calidad | Observaciones |
|---|---|---:|---|
| `frontend/lib/api.js` | Cliente HTTP | 6/10 | Centraliza bien; URLs hardcodeadas localhost, encode incompleto en path params, depende de redirects globales. |
| `frontend/hooks/useAuth.js` | Estado auth | 6/10 | Claro; depende de `/auth/me`; no distingue roles/permisos. |
| `frontend/proxy.js` | Proteccion dashboard por cookie | 5/10 | Solo comprueba presencia de cookie, no validez/rol; defensa UX, no seguridad real. |
| `frontend/app/layout.js` | Layout global y theme boot | 5/10 | Script inline con `dangerouslySetInnerHTML`; aceptable si constante, pero mejorar CSP nonce. Hardcode localhost. |
| `frontend/app/admin/login/page.js` | Login | 4/10 | UI usable; muestra credenciales por defecto, grave para prod. |
| `frontend/app/admin/dashboard/page.js` | Shell dashboard | 6/10 | Estructura clara; tabs client-side grandes. |
| `frontend/app/page.js` | Landing | 6/10 | Funcional y configurable; depende mucho de contenido remoto/localStorage. |
| `frontend/app/mission-control/[patente]/page.js` | Vista por patente | 5/10 | Revisar control de acceso: rutas con datos vehiculares no deben confiar en datos de cliente. |
| `frontend/components/dashboard/TabClientes.js` | Clientes/vehiculos/reparaciones | 3/10 | Archivo enorme (~127 KB), multiples responsabilidades, dificil de testear. |
| `frontend/components/dashboard/TabConstructor.js` | Constructor landing | 3/10 | Archivo enorme (~116 KB), HTML configurable, alto riesgo XSS y regresiones. |
| `frontend/components/dashboard/TabConfiguracion.js` | Config taller | 4/10 | Muy grande, mezcla fetch externo, formularios, preview y persistencia. |
| `frontend/components/dashboard/TabEjecuciones.js` | Ejecucion operativa | 4/10 | Mucha logica cliente; polling y agenda deberian tener servicios/hooks dedicados. |
| `frontend/components/dashboard/TabEvaluaciones.js` | Admision/citas | 4/10 | Logica rica pero acoplada al API y UI. |
| `frontend/components/dashboard/* restantes` | Tabs y componentes menores | 5-6/10 | Utiles, pero se repite patron de estado local + llamadas directas. |
| `frontend/components/landing/ChatAsistente.js` | Chat web | 4/10 | Estado complejo, localStorage como identidad, historial publico; dividir hook/API/UI. |
| `frontend/components/landing/BookingFlow.js` | Reserva publica | 5/10 | Flujo claro; falta validacion fuerte client/server y antiabuso. |
| `frontend/components/landing/EmbedBlock.js`, `FreeCanvas.js` | Render bloques libres | 2/10 | XSS persistente por HTML crudo. |
| `frontend/components/landing/* restantes` | Landing visual | 6/10 | Componentizacion aceptable; revisar assets pesados y accesibilidad. |
| `frontend/components/ui/*` | UI comun | 7/10 | Pequenios, cohesivos y reutilizables. |

### Temporal workflows propios

| Archivo/grupo | Proposito | Calidad | Observaciones |
|---|---|---:|---|
| `temporal-suite/workflows/src/workflows.ts` | Workflows demo/base | 5/10 | Correcto para demo; separar dominios reales de ejemplos. |
| `activities.ts`, `worker.ts`, `client.ts`, signals | Infra Temporal local | 5/10 | Falta configuracion segura, namespaces y observabilidad. |
| `pasteleria/*` | Workflow de pedidos | 5/10 | Encaja con dominio actual, pero nombres "pasteleria" chocan con mecanica/Turagua; deuda conceptual. |
| `cashRequest/*`, `paymentRequest/*`, `devolucion/*` | Workflows ejemplos/otros dominios | 4/10 | Parecen plantillas o demos. Si no son producto, excluir de deploy o mover a examples. |

### QA y scripts

| Archivo/grupo | Proposito | Calidad | Observaciones |
|---|---|---:|---|
| `qa-automation/tests/cronjobs.test.js` | Prueba aislada de recordatorios | 4/10 | No importa el codigo real; duplica comportamiento, puede pasar aunque produccion falle. |
| Root `check_*.js`, `get_qr*.py`, `fix_*.sh`, dumps | Operacion/manual | 3/10 | Scripts utiles pero dispersos, sin contratos, muchos hardcodes. Mover a `scripts/` con README y env validation. |
| `docker-compose*.yml` | Infra local/prod | 3/10 | Credenciales, puertos, latest tags, falta secrets y perfiles por ambiente. |
| `nginx*.conf` | Proxy | 5/10 | Requiere revision de TLS, headers, body size, cache y rutas publicas. |

## Clean Code

Problemas principales:

- Metodos/archivos demasiado largos: `backend/services/gemini.js`, `backend/routes/citas.js`, `frontend/components/dashboard/TabClientes.js`, `TabConstructor.js`, `TabConfiguracion.js`, `ChatAsistente.js`.
- Multiples responsabilidades: rutas crean/validan datos, ejecutan reglas financieras, envian WhatsApp, inician Temporal y formatean respuestas.
- Hardcodes: credenciales, URLs localhost, horarios, textos de negocio, modelos de IA, puertos, defaults de Docker.
- Duplicacion: normalizacion de telefonos, manejo de vehiculos/patentes, fetch/update patterns, calendario/slots.
- Errores mal manejados: respuestas con stack, catches que silencian integraciones, fallbacks que pueden ocultar fallos reales.
- Dependencias ocultas: servicios leen `process.env` internamente, dificultando test.

Ejemplo de refactor recomendado para `citas.js`:

```js
router.put('/:id',
  protegerRuta,
  requireRole('admin', 'recepcionista'),
  validate(updateCitaSchema),
  asyncHandler(async (req, res) => {
    const result = await citaService.updateCita(req.params.id, req.body, req.usuario);
    res.json({ ok: true, cita: result });
  })
);
```

Beneficio: rutas finas, dominio testeable, validacion comun, permisos explicitos.

## SOLID

- SRP: incumplido en rutas grandes, `gemini.js`, tabs gigantes. Separar controladores, servicios de aplicacion, integraciones y presentacion.
- OCP: bajo. Agregar nuevos estados/reglas exige modificar switches y condicionales largos. Usar Strategy/State Machine para estados de cita/workflow.
- LSP: no aplica fuertemente; no hay jerarquias OO relevantes.
- ISP: bajo en frontend; componentes gigantes reciben/gestionan demasiadas preocupaciones. Dividir hooks y componentes por caso de uso.
- DIP: incumplido. Codigo depende directamente de Mongoose, fetch, Twilio/OpenWA, Temporal. Introducir puertos/adapters para test.

## Patrones actuales y oportunidades

Patrones presentes:

- MVC ligero: Express routes + Mongoose models + React views. Implementacion simple, pero controladores gruesos.
- Facade parcial: `frontend/lib/api.js` centraliza API.
- Worker/Workflow: Temporal modela procesos async, aunque la frontera HTTP no esta protegida.

Oportunidades:

- Repository o data access layer para Mongo.
- Service layer/Application services para citas, clientes, mensajes.
- Strategy/State para estados de cita y confirmacion.
- Adapter para OpenWA/Twilio/Gemini/Ollama.
- DTO + schema validation con Zod/Joi.
- Policy/RBAC centralizado.
- Outbox/idempotency para mensajes WhatsApp y workflows.

## Seguridad

Vulnerabilidades detectadas:

| Tipo | Severidad | Evidencia | Recomendacion |
|---|---|---|---|
| Hardcoded secrets/default users | Critica | `index.js`, `jwt.js`, login page | Eliminar defaults en prod, exigir secretos, rotar credenciales. |
| Broken access control | Critica/Alta | Temporal, historial, upload, mutaciones con solo `protegerRuta` | RBAC + HMAC + sesion publica firmada. |
| XSS persistente | Alta | `dangerouslySetInnerHTML` en bloques configurables | Sanitizar o bloquear HTML libre. |
| Information disclosure | Alta | historial publico, stack trace, upload static | Minimizar datos y no devolver internals. |
| CSRF | Media | cookie auth + mutaciones | SameSite ayuda, pero agregar CSRF token para dashboard si hay dominios cruzados. |
| NoSQL/ReDoS | Media | regex desde `busqueda` | Escapar regex y limitar longitud. |
| SSRF/supply risk | Media | URLs configurables/fetch externos | Allowlist, timeout, no fetch a redes internas. |
| File upload abuse | Alta | public upload local | Magic bytes, AV scan, quota, signed URLs. |
| Prompt/tool abuse | Alta | IA ejecuta tools de BD | Policy layer: tool calls validadas y autorizadas por contexto. |

## Performance y escalabilidad

- `backend/routes/citas.js:16` default `limite = 1000`; alto payload y memoria. Cambiar a 20/50 max 100.
- `clientes.js` usa regex no indexable en varios campos y N+1 para alias. Crear endpoint de busqueda con indices/text index y agregacion.
- `servicios.js` hace N+1 productos por servicio. Usar aggregate `$lookup` o query unica por `servicio_padre`.
- Rate limiter in-memory no escala horizontal.
- Cron de recordatorios corre en cada instancia; requiere lock distribuido.
- Upload local no escala multi-contenedor; usar object storage.
- Frontend tiene componentes enormes que afectaran build, bundle y mantenibilidad. Dividir por lazy tabs/hooks.

Complejidades relevantes:

- Busqueda clientes actual: O(CitasCoincidentes + ClientesPagina * CitasPorCliente) con regex potencialmente costoso.
- Agrupacion mensajes: agregacion sobre coleccion completa si no hay indices adecuados. Asegurar indices `{numero_telefono, recibido_en}`, `{remitente, procesado}`.
- Dedupe webhook con `Set`: O(1), pero solo por proceso y se pierde al reiniciar.

## Base de datos

Fortalezas: indices basicos en telefono, fecha, estado. Modelos simples.

Riesgos:

- Uso extensivo de `Mixed` para vehiculos, detalles y constructor. Reduce validacion, migraciones y consultas confiables.
- Transacciones ausentes en operaciones que modifican cliente+cita+mensaje.
- Unicidad de patente se valida en codigo, no con indice robusto.
- `deleteMany` de citas al borrar cliente puede perder historial sin soft delete.
- No hay estrategia de migraciones Mongo.

Recomendaciones:

- Schemas embebidos para vehiculo/reparacion/bloques.
- Transacciones para merge, deuda, finalizacion y agendamiento.
- Soft deletes y auditoria para entidades criticas.
- Indices compuestos: `Cita({fecha_cita, estado, team_asignado})`, `Mensaje({numero_telefono, recibido_en})`, `Cliente({numero_telefono})`, posible normalized plate index.

## APIs

Problemas:

- Sin versionado (`/api/v1`).
- Sin contratos OpenAPI.
- Validacion manual dispersa.
- Error shape inconsistente.
- Paginacion parcial; algunos endpoints publicos devuelven demasiado.
- Idempotencia ausente en agendamiento, uploads y webhooks.

Recomendacion: definir `v1`, schemas Zod, middleware `validate`, `asyncHandler`, error envelope comun y request id.

## Concurrencia y asincronia

- Recordatorios con `setInterval` en cada instancia: duplicados en despliegue horizontal.
- Updates financieros en `citas.js` usan `$inc` sin transaccion ligada al estado de cita; condiciones de carrera pueden duplicar deuda/gasto.
- `processedMessages` in-memory dedupe se pierde al reiniciar y no protege multiples pods.
- Upload local puede colisionar poco probable por timestamp/random, pero no hay atomicidad ni limpieza.

## Testing

Estado actual: muy bajo. `qa-automation/tests/cronjobs.test.js` prueba una copia simplificada de la funcion, no el codigo real.

Pruebas prioritarias:

- Auth: login, cookie flags por ambiente, secret requerido, roles.
- Seguridad publica: historial no debe devolver datos de telefono arbitrario.
- Upload: rechazar MIME falso, limite, no auth.
- Citas: transiciones de deuda y finalizacion con transacciones.
- Webhook: idempotencia por message id.
- Gemini tools: no ejecutar tool sensible sin contexto validado.
- Frontend: XSS regression para bloques configurables.

Ejemplo:

```js
test('prod refuses to boot without JWT_SECRET', async () => {
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  await expect(import('../utils/jwt.js')).rejects.toThrow(/JWT_SECRET/);
});
```

## Top 20 problemas por impacto

1. Usuarios/passwords por defecto.
2. JWT secret hardcodeado.
3. Docker prod con credenciales y puertos sensibles.
4. Temporal endpoints sin auth.
5. Historial publico por telefono.
6. Upload publico + static serving de artefactos.
7. XSS persistente por HTML configurable.
8. RBAC insuficiente en mutaciones.
9. Logica financiera sin transacciones.
10. Cron sin lock distribuido.
11. IA con tools de BD sin policy layer fuerte.
12. Stack traces al cliente.
13. Validacion dispersa y parcial.
14. Modelos `Mixed` excesivos.
15. Componentes frontend gigantes.
16. Rutas backend gigantes.
17. Regex de busqueda no escapado/no limitado.
18. N+1 queries en clientes/servicios/mensajes.
19. Artefactos generados/dependencias dentro del workspace.
20. Tests no ejercitan codigo real.

## Roadmap de mejoras

### Corto plazo (1-2 semanas)

- Eliminar credenciales visibles y seed automatico en prod.
- Exigir `JWT_SECRET`, `MONGODB_URI`, secrets fuertes y rotar tokens.
- Proteger Temporal con JWT admin/HMAC.
- Desactivar Mongo Express y puertos DB/Temporal publicos en prod.
- Sanitizar o deshabilitar HTML libre.
- Bloquear historial publico por telefono real.
- Agregar rate limit a login, upload, agendar e historial.
- Quitar `stack` de respuestas.
- Actualizar `.gitignore` para `.next`, `backend/upload_utils`, `qa-automation/node_modules`.

### Mediano plazo (1-2 meses)

- Introducir Zod/Joi DTOs y middleware de validacion.
- Crear `services/citaService`, `clienteService`, `messageService`.
- RBAC central por accion.
- Migrar upload a object storage privado.
- Implementar transacciones Mongo en merge/deuda/agendamiento.
- Tests de integracion backend con DB de prueba.
- Separar componentes frontend gigantes en hooks/componentes.
- OpenAPI y contratos.

### Largo plazo (3-6 meses)

- Modular monolith claro con dominios: Auth, Clientes, Citas, Mensajes, Catalogo, Configuracion, Workflows.
- Outbox para WhatsApp/Temporal.
- Observabilidad: request id, structured logs, metrics, tracing.
- SBOM y CI security gates.
- Multi-tenant readiness si habra mas talleres.
- Event-driven real para recordatorios/agendamiento.

## Conclusion

El sistema tiene una cantidad considerable de funcionalidad y una direccion de producto clara. Para operarlo con confianza durante cinco anios, el siguiente salto debe ser de "app que funciona" a "sistema con fronteras": secretos obligatorios, autorizacion explicita, validacion formal, dominio separado de transporte, workflows protegidos, artefactos fuera del repo y pruebas sobre el codigo real.

