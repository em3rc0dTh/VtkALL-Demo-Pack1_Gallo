════════════════════════════════════════════════════════════════
MecánicaPro — Sistema Web + Agente IA para Talleres Mecánicos
════════════════════════════════════════════════════════════════

## SECCIÓN 01 — CONTEXTO

Construí un sistema completo para talleres mecánicos que resuelve tres problemas simultáneos: la ausencia o mala calidad de su presencia web, la falta de gestión de citas/reservas, y la ausencia de atención automatizada por WhatsApp. El sistema tiene tres capas: una landing page pública configurable (el sitio web del taller), un dashboard administrativo para el equipo del taller, y un agente de IA por WhatsApp que atiende clientes 24/7.

**Usuarios:**
- Clientes del taller: consultan servicios, agendan y cancelan citas vía WhatsApp o web
- Personal del taller (admin/recepcionista): gestiona citas, clientes y mensajes vía Dashboard
- Mecánicos: consultan las citas asignadas del día (rol de solo lectura)

**Flujo principal de valor:**
1. Cliente envía "Buenos días" por WhatsApp
2. El agente "Max" responde al instante, consulta qué necesita y guía la conversación
3. Si el cliente quiere una cita, Max verifica disponibilidad y la agenda en la DB
4. El personal ve la cita confirmada en el Dashboard en tiempo real

---

## SECCIÓN 02 — STACK TECNOLÓGICO

```
Frontend:      Next.js 14 (App Router) — SSR/SSG para SEO + routing nativo
Estilos:       Tailwind CSS, Shadcn/ui, lucide-react — utilities directamente en JSX, configuración mínima
Animaciones:   Framer Motion — animaciones de entrada, hover y transiciones del dashboard
Backend:       Node.js + Express — API REST independiente del frontend
Base de datos: MongoDB + Mongoose — esquemas flexibles, ideal para datos de talleres variables
Auth:          JWT (httpOnly cookies) + bcrypt — seguro, sin estado en servidor
WhatsApp:      Twilio (webhook) — integración estándar de la industria
IA:            Gemini 2.5 flash (api-key: [GCP_API_KEY]) — agente conversacional con acciones reales
Idioma del código y UI: Español
```

---

## SECCIÓN 03 — ESTRUCTURA DEL PROYECTO

```
mecanica-pro/
├── backend/
│   ├── index.js                       ← Entry point: Express + middleware global + conexión DB
│   ├── config/
│   │   └── db.js                      ← Conexión MongoDB con Mongoose, logs de estado
│   ├── models/
│   │   ├── Taller.js                  ← Schema: configuración completa del taller (único doc)
│   │   ├── Usuario.js                 ← Schema: usuarios admin/recepcionista con bcrypt
│   │   ├── Cliente.js                 ← Schema: clientes con vehículos y historial
│   │   ├── Cita.js                    ← Schema: citas con estado, vehículo y servicio
│   │   └── Mensaje.js                 ← Schema: mensajes WhatsApp por número de teléfono
│   ├── routes/
│   │   ├── auth.js                    ← POST /login, POST /logout, GET /me
│   │   ├── webhook.js                 ← POST /webhook/whatsapp (Twilio, sin auth JWT)
│   │   ├── citas.js                   ← CRUD citas (protegido)
│   │   ├── clientes.js                ← CRUD clientes (protegido)
│   │   ├── mensajes.js                ← GET mensajes + conversaciones (protegido)
│   │   ├── servicios.js               ← CRUD servicios del taller (protegido)
│   │   └── configuracion.js           ← GET/PUT configuración del taller (protegido)
│   ├── middleware/
│   │   ├── auth.js                    ← Verificar JWT de httpOnly cookie en rutas protegidas
│   │   └── rateLimiter.js             ← Rate limiting por IP y por número de teléfono
│   ├── services/
│   │   ├── gemini.js                  ← Agente Max: system prompt dinámico + function calling
│   │   └── twilio.js                  ← Formato de respuesta TwiML
│   └── utils/
│       ├── fechas.js                  ← Helpers: formatear fechas en español, calcular slots
│       └── jwt.js                     ← Generar y verificar tokens JWT
├── frontend/
│   ├── app/
│   │   ├── layout.jsx                 ← Layout raíz: fuentes Google, metadata SEO global
│   │   ├── page.jsx                   ← Landing page pública del taller (datos desde API)
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.jsx           ← Login administrativo con JWT
│   │   │   └── dashboard/
│   │   │       └── page.jsx           ← Dashboard con 5 pestañas
│   │   └── globals.css                ← Variables CSS, fuentes, reset
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.jsx               ← Hero full-viewport con animación Framer Motion
│   │   │   ├── StatsBar.jsx           ← Barra de estadísticas con contadores animados
│   │   │   ├── Servicios.jsx          ← Grid de servicios con hover naranja
│   │   │   ├── SobreNosotros.jsx      ← Split layout texto + imagen
│   │   │   ├── ComofFunciona.jsx      ← 3 pasos para agendar una cita
│   │   │   ├── Galeria.jsx            ← Grid de trabajos del taller
│   │   │   ├── Contacto.jsx           ← Datos de contacto + CTA WhatsApp flotante
│   │   │   └── Footer.jsx             ← Links, redes sociales, copyright
│   │   ├── dashboard/
│   │   │   ├── TabCitas.jsx           ← Toggle calendario/lista/kanban de citas
│   │   │   ├── TabClientes.jsx        ← Tabla searchable de clientes con perfil modal
│   │   │   ├── TabMensajes.jsx        ← Bandeja de conversaciones WhatsApp
│   │   │   ├── TabServicios.jsx       ← CRUD servicios del taller
│   │   │   └── TabConfiguracion.jsx   ← Config del taller + webhook Twilio
│   │   └── ui/
│   │       ├── Navbar.jsx             ← Navbar pública con scroll effect
│   │       ├── EstadoBadge.jsx        ← Badge de estado con color por tipo
│   │       └── LoadingSpinner.jsx     ← Spinner naranja centrado
│   ├── lib/
│   │   └── api.js                     ← Todas las llamadas fetch al backend (con cookie auth)
│   ├── hooks/
│   │   └── useAuth.js                 ← Hook: verificar sesión, logout, datos del usuario
│   └── middleware.js                  ← Proteger rutas /admin/* redirigiendo si no hay cookie
├── .env.example
├── package.json                       ← Scripts: dev (concurrently), build, start, setup
└── README.md
```

---

## SECCIÓN 04 — BASE DE DATOS — ESQUEMAS MONGOOSE

Crear todos los modelos al iniciar la app en `backend/models/`. Conectar a MongoDB en `backend/config/db.js` y llamar la conexión desde `backend/index.js`.

### Modelo: Taller (documento único — configuración del taller)

```javascript
// backend/models/Taller.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const TallerSchema = new Schema({
  nombre_taller:   { type: String, required: true, default: 'MecánicaPro' },
  slogan:          { type: String, default: 'Tu vehículo en las mejores manos' },
  direccion:       String,
  telefono:        String,
  whatsapp:        String,  // número para el deep link de WhatsApp, formato: 5491112345678
  email:           String,
  horarios: {
    lunes_viernes: { type: String, default: '08:00 - 18:00' },
    sabado:        { type: String, default: '09:00 - 13:00' },
    domingo:       { type: String, default: 'Cerrado' }
  },
  servicios: [{
    nombre:              { type: String, required: true },
    descripcion:         String,
    duracion_minutos:    { type: Number, default: 60 },
    precio_base:         Number,
    icono:               { type: String, default: '🔧' },
    activo:              { type: Boolean, default: true }
  }],
  sobre_nosotros:      String,
  anos_experiencia:    { type: Number, default: 10 },
  clientes_atendidos:  { type: Number, default: 500 },
  autos_reparados:     { type: Number, default: 2000 },
  galeria:             [String],  // URLs de imágenes
  redes_sociales: {
    instagram: String,
    facebook:  String,
    tiktok:    String
  },
  config_agente: {
    nombre_agente:       { type: String, default: 'Max' },
    mensaje_bienvenida:  { type: String, default: '¡Hola! 👋 Soy Max, el asistente de {nombre_taller}. ¿En qué te puedo ayudar hoy?' },
  },
  webhook_url: String
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

export default mongoose.model('Taller', TallerSchema);
```

Insertar un documento de seed con datos de ejemplo realistas al iniciar la app si la colección está vacía.

---

### Modelo: Usuario (administradores del dashboard)

```javascript
// backend/models/Usuario.js
const UsuarioSchema = new Schema({
  nombre:       { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },  // hash bcrypt, nunca guardar en claro
  rol:          { type: String, enum: ['admin', 'recepcionista'], default: 'recepcionista' },
  activo:       { type: Boolean, default: true },
  ultimo_login: Date
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });
```

Crear un usuario admin de seed al iniciar si la colección está vacía:
- email: `admin@mecanicapro.com`, password: `Admin1234!` (hashear con bcrypt, 12 rounds)
- Loguear en consola las credenciales del seed para que el desarrollador las vea al arrancar

---

### Modelo: Cliente (perfil del cliente del taller)

```javascript
// backend/models/Cliente.js
const ClienteSchema = new Schema({
  nombre:          String,
  numero_telefono: { type: String, required: true, unique: true, index: true },
  email:           String,
  vehiculos: [{
    marca:    String,
    modelo:   String,
    anio:     Number,
    patente:  { type: String, uppercase: true, trim: true },
    color:    String
  }],
  notas:        String,
  total_citas:  { type: Number, default: 0 }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });
```

---

### Modelo: Cita (reservas y trabajos)

```javascript
// backend/models/Cita.js
const CitaSchema = new Schema({
  cliente:         { type: Schema.Types.ObjectId, ref: 'Cliente' },
  numero_telefono: { type: String, required: true, index: true },
  nombre_cliente:  String,   // desnormalizado para queries rápidas
  vehiculo: {
    marca:   String,
    modelo:  String,
    anio:    Number,
    patente: String
  },
  servicio:                 { type: String, required: true },
  descripcion_trabajo:      String,
  fecha_cita:               { type: Date, required: true, index: true },
  duracion_estimada_minutos:{ type: Number, default: 60 },
  estado: {
    type:    String,
    enum:    ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada'],
    default: 'pendiente',
    index:   true
  },
  notas_mecanico:  String,
  precio_estimado: Number,
  precio_final:    Number,
  origen:          { type: String, enum: ['whatsapp', 'dashboard', 'web'], default: 'whatsapp' }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });
```

---

### Modelo: Mensaje (conversaciones WhatsApp)

```javascript
// backend/models/Mensaje.js
const MensajeSchema = new Schema({
  numero_telefono: { type: String, required: true, index: true },
  nombre_cliente:  String,
  contenido:       { type: String, required: true },
  remitente:       { type: String, enum: ['cliente', 'asistente'], required: true },
  cita_generada:   { type: Schema.Types.ObjectId, ref: 'Cita' },  // poblado si el mensaje creó una cita
  procesado:       { type: Boolean, default: false }
}, { timestamps: { createdAt: 'recibido_en' } });
```

---

## SECCIÓN 05 — BACKEND — FLUJOS CRÍTICOS

### FLUJO A: Autenticación (backend/routes/auth.js)

**Endpoint:** `POST /api/auth/login`

Flujo completo:
1. Recibir `{ email, password }` del body — validar que ambos estén presentes
2. Buscar usuario en MongoDB por email, verificar que `activo: true`
3. Comparar password con hash usando `bcrypt.compare()`
4. Si es válido: generar JWT con `{ id, email, rol }` firmado con `JWT_SECRET`, expiración 24h
5. Setear cookie httpOnly: `token={jwt}; httpOnly; sameSite=strict; maxAge=86400000`
6. Actualizar `ultimo_login` del usuario en DB
7. Responder `{ ok: true, usuario: { nombre, email, rol } }`

Errores:
- Email no encontrado o password incorrecto → `{ error: 'Credenciales inválidas' }` status 401 (mismo mensaje para ambos casos — no revelar cuál falló)
- Campos vacíos → `{ error: 'Email y contraseña son requeridos' }` status 400

**Endpoint:** `POST /api/auth/logout`
- Limpiar la cookie `token` seteando maxAge a 0
- Responder `{ ok: true }`

**Endpoint:** `GET /api/auth/me`
- Verificar token de la cookie
- Responder con `{ usuario: { nombre, email, rol } }` o 401 si inválido

**Middleware JWT (backend/middleware/auth.js):**
- Leer token de `req.cookies.token`
- Verificar con `jwt.verify(token, JWT_SECRET)`
- Si válido: agregar `req.usuario = payload` y llamar `next()`
- Si inválido/expirado: `{ error: 'No autorizado' }` status 401

---

### FLUJO B: Webhook de Twilio WhatsApp (backend/routes/webhook.js)

**Endpoint:** `POST /api/webhook/whatsapp` (sin auth JWT — Twilio llama este endpoint)

Flujo completo:
1. Parsear body `application/x-www-form-urlencoded` — extraer `Body` y `From`
2. Limpiar prefijo `whatsapp:` del campo `From` para obtener el número limpio
3. Buscar o crear cliente en MongoDB por `numero_telefono`
4. Guardar el mensaje del cliente en la colección `mensajes` con `remitente: 'cliente'`
5. Obtener configuración del taller desde DB (nombre, horarios, servicios, config_agente)
6. Obtener los últimos 20 mensajes de ese número para memoria conversacional del agente
7. Llamar al servicio Gemini (`backend/services/gemini.js`) con el contexto completo
8. Guardar respuesta del agente en `mensajes` con `remitente: 'asistente'`
9. Responder en formato TwiML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message><Body>{respuesta_del_agente}</Body></Message>
</Response>
```

Setear header `Content-Type: text/xml`.

Errores:
- Si Gemini falla: responder TwiML con `"Disculpá, estoy teniendo inconvenientes técnicos. Llamanos al {telefono_taller} o volvé a escribir en unos minutos. 🔧"`
- Loguear todos los errores con timestamp + número de teléfono + mensaje de error

---

### FLUJO C: Citas (backend/routes/citas.js) — rutas protegidas con middleware JWT

**`GET /api/citas`**
- Query params opcionales: `fecha` (YYYY-MM-DD), `estado`, `pagina` (default 1), `limite` (default 20)
- Si `fecha`: filtrar citas del día especificado (`fecha_cita >= inicio_dia AND < fin_dia`)
- Si `estado`: filtrar por estado
- Populate `cliente` con `nombre` y `numero_telefono`
- Ordenar por `fecha_cita` ascendente
- Responder con `{ citas: [...], total, pagina, paginas_totales }`

**`POST /api/citas`** — crear cita desde dashboard
- Body requerido: `{ numero_telefono, servicio, fecha_cita }`
- Opcionales: `nombre_cliente, vehiculo, descripcion_trabajo, precio_estimado, notas_mecanico`
- Verificar que `fecha_cita` sea una fecha futura
- Crear o actualizar cliente por `numero_telefono`
- Crear la cita con `origen: 'dashboard'` y estado `'confirmada'` (confirmada por defecto desde dashboard)
- Responder `{ ok: true, cita }`

**`PUT /api/citas/:id`** — actualizar estado o datos de una cita
- Campos actualizables: `estado, notas_mecanico, precio_final, fecha_cita, descripcion_trabajo`
- Si `estado` cambia a `'completada'`: registrar `precio_final` si se envía
- Responder `{ ok: true, cita }`

**`DELETE /api/citas/:id`** — eliminar cita (solo rol `admin`)
- Verificar que `req.usuario.rol === 'admin'`
- Responder `{ ok: true }`

---

### FLUJO D: Mensajes y Conversaciones (backend/routes/mensajes.js)

**`GET /api/mensajes/conversaciones`**
- Agrupar mensajes por `numero_telefono`
- Para cada número: devolver último mensaje, nombre del cliente, total no leídos
- Ordenar por `recibido_en` descendente (más reciente primero)
- Responder `{ conversaciones: [{ numero_telefono, nombre_cliente, ultimo_mensaje, recibido_en }] }`

**`GET /api/mensajes/:numero_telefono`**
- Devolver todos los mensajes de ese número ordenados por `recibido_en` ascendente
- Responder `{ mensajes: [...], cliente: { nombre, vehiculos } }`

---

## SECCIÓN 06 — AGENTE IA (backend/services/gemini.js)

### System Prompt Dinámico

El system prompt se genera en cada request inyectando datos reales de la DB:

```
Eres {nombre_agente}, el asistente virtual de {nombre_taller}. Eres amable, eficiente y conoces el mundo automotriz.

TU ROL ES:
- Responder preguntas sobre el taller, servicios, horarios y ubicación.
- Ayudar a los clientes a agendar, consultar y cancelar citas.
- Ser cálido, conciso y profesional.
- Usar español latinoamericano (Perú). Evita hablar con modismos o acentos argentinos (no uses voseo como "decime", "querés", "preferís", "escribime"). Usa formas como "dime", "quieres", "prefieres", "escríbeme".
- Usar la moneda oficial de Perú, que es el Sol (S/.).
- Usar emojis moderadamente 🔧.

DIÁLOGO DE DIAGNÓSTICO Y CONVERSACIÓN:
- Entabla una conversación corta e interactiva cuando el cliente mencione un problema o mantenimiento.
- Por ejemplo, si te dicen "necesito cambio de aceite" o "revisar frenos", haz una pregunta corta de seguimiento útil antes de agendar, como: "¿Hace cuánto tiempo o cuántos kilómetros realizaste tu último cambio de aceite?" o "¿Sientes algún ruido o vibración al frenar?".
- Si el cliente no sabe qué responder o decides concluir las preguntas de diagnóstico, ofrece directamente agendar la cita diciendo algo como: "¿Deseas agendar una cita para revisarlo en el taller?".

INFORMACIÓN DEL TALLER:
- Nombre: {nombre_taller}
- Dirección: {direccion}
- Teléfono: {telefono}
- Horarios: Lunes a Viernes {lunes_viernes} | Sábados {sabado} | Domingos {domingo}
- Servicios disponibles: {lista_de_servicios_con_precios}
- Sobre nosotros: {sobre_nosotros}

DATOS PARA AGENDAR UNA CITA:
- Para confirmar y agendar la cita, necesitas obligatoriamente los siguientes datos mínimos:
  1. Nombre completo del cliente
  2. DNI (Documento Nacional de Identidad, 8 dígitos) -> ¡MUY IMPORTANTE!
  3. Número de teléfono real (para podernos comunicar con ellos)
  4. Marca, modelo y año del vehículo
  5. Fecha y hora preferida (siempre valida disponibilidad antes con 'consultar_disponibilidad')
  6. Servicio o motivo de la cita

DETECCIÓN DE CLIENTES WEB VS WHATSAPP:
- El identificador actual de la sesión del cliente es: {numero_telefono}.
- Si el identificador actual empieza con 'web_', significa que el cliente está chateando desde el sitio web (no desde WhatsApp). Por ende, NO asumamos ese 'web_' como su número de teléfono real. Pídele amablemente su número de teléfono celular real y su DNI para completar la reserva.
- Si el identificador NO empieza con 'web_' (es un número de teléfono real), puedes asumir que ese es su teléfono de contacto y solo pídele confirmar si es correcto o si prefiere dar otro, además del DNI y los otros datos.

REGLAS IMPORTANTES:
- Eres libre de usar formato Markdown básico en tus respuestas: puedes destacar texto importante en negrita con doble asterisco (**) y estructurar listas usando viñetas con guiones (-), ya que nuestra interfaz de chat ahora renderiza este formato de manera correcta. Evita el uso de otros símbolos markdown complejos (como numerales # para títulos o tablas).
- Nunca confirmes una cita sin ejecutar la tool 'agendar_cita' enviando todos los campos requeridos (incluyendo el número de teléfono real y el DNI).
- Nunca inventes precios, fechas ni datos que no tengas.
- Si el cliente pregunta algo que no puedes resolver, ofrece: "¿Quieres que te contacte alguien de nuestro equipo directamente?"
- Si el cliente está enojado: reconoce el inconveniente, sé empático y ofrece una solución concreta.
- Si el cliente cancela, usa la tool 'cancelar_cita' con el id correspondiente.
- Si te piden horarios ocupados o disponibles para un día, usa 'consultar_disponibilidad'.
```

---

### Tools (Function Calling) — 6 herramientas

**Tool 1: `obtener_info_taller`**
```javascript
{
  name: "obtener_info_taller",
  description: "Obtiene la información completa del taller: dirección, horarios, servicios, teléfono. Usar cuando el cliente pregunta dónde está el taller, qué servicios ofrecen o cómo contactarlos.",
  parameters: { type: "object", properties: {}, required: [] }
}
```
Acción: devolver documento `Taller` completo desde DB.

**Tool 2: `consultar_disponibilidad`**
```javascript
{
  name: "consultar_disponibilidad",
  description: "Verifica los horarios disponibles para una fecha específica. Usar ANTES de agendar una cita para no crear conflictos de horario.",
  parameters: {
    type: "object",
    properties: {
      fecha: { type: "string", description: "Fecha a consultar en formato YYYY-MM-DD" }
    },
    required: ["fecha"]
  }
}
```
Acción: buscar citas del día en DB, calcular horarios ocupados. Horario de atención: 08:00 a 18:00, turnos cada 60 minutos. Devolver `{ fecha, horarios_disponibles: [...], horarios_ocupados: [...] }`.

**Tool 3: `ver_citas_cliente`**
```javascript
{
  name: "ver_citas_cliente",
  description: "Muestra las citas activas (pendientes o confirmadas) del cliente que está hablando. Usar cuando el cliente pregunta por sus citas o quiere cancelar/reprogramar.",
  parameters: {
    type: "object",
    properties: {
      numero_telefono: { type: "string", description: "Número de teléfono del cliente sin prefijo 'whatsapp:'" }
    },
    required: ["numero_telefono"]
  }
}
```
Acción: buscar citas con `estado: { $in: ['pendiente', 'confirmada'] }` y `numero_telefono` en DB.

**Tool 4: `agendar_cita`**
```javascript
{
  name: "agendar_cita",
  description: "Crea una nueva cita en el sistema. Usar SOLO cuando el cliente haya confirmado explícitamente todos los datos: nombre, vehículo, servicio y fecha/hora.",
  parameters: {
    type: "object",
    properties: {
      numero_telefono:     { type: "string" },
      nombre_cliente:      { type: "string" },
      servicio:            { type: "string" },
      descripcion_trabajo: { type: "string" },
      vehiculo_marca:      { type: "string" },
      vehiculo_modelo:     { type: "string" },
      vehiculo_anio:       { type: "integer" },
      fecha_cita:          { type: "string", description: "ISO 8601: 2026-05-20T10:00:00" }
    },
    required: ["numero_telefono", "nombre_cliente", "servicio", "fecha_cita"]
  }
}
```
Acción: verificar disponibilidad del slot, crear `Cita` con `estado: 'confirmada'` y `origen: 'whatsapp'`, crear o actualizar `Cliente`, responder con los datos de la cita creada.

**Tool 5: `cancelar_cita`**
```javascript
{
  name: "cancelar_cita",
  description: "Cancela una cita existente. Usar solo cuando el cliente confirme explícitamente que quiere cancelar una cita específica.",
  parameters: {
    type: "object",
    properties: {
      id_cita: { type: "string", description: "ID de MongoDB de la cita a cancelar" }
    },
    required: ["id_cita"]
  }
}
```
Acción: actualizar `estado: 'cancelada'` en la cita. Devolver confirmación.

**Tool 6: `obtener_servicios`**
```javascript
{
  name: "obtener_servicios",
  description: "Devuelve la lista completa de servicios del taller con descripción, duración y precio. Usar cuando el cliente pregunta qué servicios ofrecen o cuánto cuesta un servicio específico.",
  parameters: { type: "object", properties: {}, required: [] }
}
```
Acción: devolver `taller.servicios` filtrado por `activo: true`.

### Ejecución del loop de function calling

```javascript
// 1. Request inicial a Gemini
const respuesta = await gemini.chat.completions.create({
  model: "gemini-2.5-flash",
  messages: [
    { role: "system", content: systemPrompt },
    ...historial,   // últimos 20 mensajes de DB formateados como { role, content }
    { role: "user", content: mensaje_usuario }
  ],
  tools: tools,
  tool_choice: "auto"
});

// 2. Si la IA quiere ejecutar tools
if (respuesta.choices[0].finish_reason === "tool_calls") {
  const tool_calls = respuesta.choices[0].message.tool_calls;
  const resultados_tools = [];

  for (const tool_call of tool_calls) {
    const nombre = tool_call.function.name;
    const args   = JSON.parse(tool_call.function.arguments);
    const resultado = await ejecutarTool(nombre, args);
    resultados_tools.push({
      tool_call_id: tool_call.id,
      role: "tool",
      content: JSON.stringify(resultado)
    });
  }

  // 3. Segunda llamada con resultados
  const respuesta_final = await gemini.chat.completions.create({
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: systemPrompt },
      ...historial,
      { role: "user", content: mensaje_usuario },
      respuesta.choices[0].message,
      ...resultados_tools
    ]
  });
  return respuesta_final.choices[0].message.content;
}

return respuesta.choices[0].message.content;
```
