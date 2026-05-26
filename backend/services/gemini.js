import 'dotenv/config';
import OpenAI from 'openai';
import Taller from '../models/Taller.js';
import Cliente from '../models/Cliente.js';
import Cita from '../models/Cita.js';
import Mensaje from '../models/Mensaje.js';
import { calcularSlots, formatearFechaEsp, formatearFechaHoraEsp } from '../utils/fechas.js';

// Inicializar cliente de Gemini si existe la API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.GCP_API_KEY;
let geminiClient = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey !== 'YOUR_GCP_API_KEY' && apiKey.trim() !== '') {
  geminiClient = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai'
  });
}


// DEFINICIÓN DE HERRAMIENTAS (TOOLS)
const tools = [
  {
    type: "function",
    function: {
      name: "obtener_info_taller",
      description: "Obtiene la información completa del taller: dirección, horarios, servicios, teléfono. Usar cuando el cliente pregunta dónde está el taller, qué servicios ofrecen o cómo contactarlos.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "consultar_disponibilidad",
      description: "Verifica los horarios disponibles para una fecha específica. Usar ANTES de agendar una cita para no crear conflictos de horario.",
      parameters: {
        type: "object",
        properties: {
          fecha: { type: "string", description: "Fecha a consultar en formato YYYY-MM-DD (ej: 2026-05-20)" }
        },
        required: ["fecha"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ver_citas_cliente",
      description: "Muestra las citas activas (pendientes o confirmadas) del cliente que está hablando. Usar cuando el cliente pregunta por sus citas o quiere cancelar/reprogramar.",
      parameters: {
        type: "object",
        properties: {
          numero_telefono: { type: "string", description: "Número de teléfono del cliente sin prefijo 'whatsapp:' (ej: 5491147893210)" }
        },
        required: ["numero_telefono"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "agendar_cita",
      description: "Crea una nueva cita en el sistema. Usar SOLO cuando el cliente haya confirmado explícitamente todos los datos: nombre, vehículo, servicio, fecha/hora, DNI y teléfono.",
      parameters: {
        type: "object",
        properties: {
          numero_telefono:     { type: "string", description: "Número de teléfono real del cliente (ej: 999888777)" },
          nombre_cliente:      { type: "string", description: "Nombre completo del cliente" },
          dni:                 { type: "string", description: "DNI (Documento Nacional de Identidad) del cliente (8 dígitos)" },
          servicio:            { type: "string", description: "Nombre del servicio a realizar" },
          descripcion_trabajo: { type: "string", description: "Detalles del problema o lo que le pasa al auto" },
          vehiculo_marca:      { type: "string", description: "Marca del vehículo (ej: Toyota)" },
          vehiculo_modelo:     { type: "string", description: "Modelo del vehículo (ej: Yaris)" },
          vehiculo_anio:       { type: "integer", description: "Año del vehículo (ej: 2018)" },
          fecha_cita:          { type: "string", description: "Fecha y hora en formato ISO 8601 (ej: 2026-05-20T10:00:00)" }
        },
        required: ["numero_telefono", "nombre_cliente", "dni", "servicio", "fecha_cita"]
      }
    }
  },
  {
    type: "function",
    function: {
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
  },
  {
    type: "function",
    function: {
      name: "obtener_servicios",
      description: "Devuelve la lista completa de servicios del taller con descripción, duración y precio. Usar cuando el cliente pregunta qué servicios ofrecen o cuánto cuesta un servicio específico.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "confirmar_cita",
      description: "Confirma la asistencia del cliente a una cita pendiente de confirmación. Usar cuando el cliente confirme explícitamente (ej: 'Sí, confirmo', 'Allí estaré') a raíz de un recordatorio o pregunta.",
      parameters: {
        type: "object",
        properties: {
          id_cita: { type: "string", description: "ID de MongoDB de la cita a confirmar" }
        },
        required: ["id_cita"]
      }
    }
  }
];

// EJECUTOR DE BASE DE DATOS PARA LAS TOOLS
export const ejecutarTool = async (nombre, args) => {
  try {
    switch (nombre) {
      case 'obtener_info_taller': {
        const taller = await Taller.findOne();
        return taller || { nombre_taller: 'MecánicaPro', error: 'No se configuró el taller aún' };
      }
      
      case 'consultar_disponibilidad': {
        const { fecha } = args;
        // Filtrar citas del día en rango UTC o local
        const inicioDia = new Date(`${fecha}T00:00:00`);
        const finDia = new Date(`${fecha}T23:59:59`);
        
        const citas = await Cita.find({
          fecha_cita: { $gte: inicioDia, $lte: finDia },
          estado: { $ne: 'cancelada' }
        });
        
        return calcularSlots(fecha, citas);
      }
      
      case 'ver_citas_cliente': {
        const { numero_telefono } = args;
        const citas = await Cita.find({
          numero_telefono: numero_telefono.trim(),
          estado: { $in: ['pendiente', 'confirmada', 'en_proceso'] }
        }).sort({ fecha_cita: 1 });
        
        return citas.map(c => ({
          id: c._id,
          nombre_cliente: c.nombre_cliente,
          servicio: c.servicio,
          fecha: c.fecha_cita,
          fecha_formateada: formatearFechaHoraEsp(c.fecha_cita),
          vehiculo: `${c.vehiculo?.marca || ''} ${c.vehiculo?.modelo || ''}`,
          estado: c.estado
        }));
      }
      
      case 'agendar_cita': {
        const {
          numero_telefono,
          nombre_cliente,
          dni,
          servicio,
          descripcion_trabajo,
          vehiculo_marca,
          vehiculo_modelo,
          vehiculo_anio,
          fecha_cita,
          _session_telefono
        } = args;

        const fechaCitaDate = new Date(fecha_cita);
        if (isNaN(fechaCitaDate.getTime())) {
          return { error: 'Formato de fecha inválido' };
        }

        // Si venimos de una sesión web, migrar los mensajes y limpiar el cliente temporal
        if (_session_telefono && _session_telefono.startsWith('web_') && _session_telefono !== numero_telefono) {
          try {
            await Mensaje.updateMany(
              { numero_telefono: _session_telefono },
              { $set: { numero_telefono: numero_telefono, nombre_cliente: nombre_cliente } }
            );
            await Cliente.deleteOne({ numero_telefono: _session_telefono });
          } catch (migrateErr) {
            console.error('Error migrando mensajes de sesión web:', migrateErr);
          }
        }

        // Buscar o crear cliente por número real
        let cliente = await Cliente.findOne({ numero_telefono });
        if (!cliente) {
          cliente = new Cliente({
            nombre: nombre_cliente,
            dni: dni || '',
            numero_telefono,
            vehiculos: []
          });
        } else {
          if (dni) cliente.dni = dni;
          if (nombre_cliente && !cliente.nombre) cliente.nombre = nombre_cliente;
        }
        
        // Agregar vehículo si no existe en su perfil
        if (vehiculo_marca) {
          const yaExiste = cliente.vehiculos.some(v => 
            v.marca?.toLowerCase() === vehiculo_marca.toLowerCase() &&
            v.modelo?.toLowerCase() === vehiculo_modelo?.toLowerCase()
          );
          if (!yaExiste) {
            cliente.vehiculos.push({
              marca: vehiculo_marca,
              modelo: vehiculo_modelo,
              anio: vehiculo_anio,
              patente: ''
            });
          }
        }
        
        cliente.total_citas += 1;
        await cliente.save();

        // Crear cita
        const nuevaCita = new Cita({
          cliente: cliente._id,
          numero_telefono,
          nombre_cliente,
          servicio,
          descripcion_trabajo: descripcion_trabajo || '',
          vehiculo: {
            marca: vehiculo_marca || '',
            modelo: vehiculo_modelo || '',
            anio: vehiculo_anio || null,
            patente: ''
          },
          fecha_cita: fechaCitaDate,
          estado: 'pendiente', // Pendiente de validación de admin por defecto
          origen: _session_telefono && _session_telefono.startsWith('web_') ? 'web' : 'whatsapp',
          precio_estimado: 0
        });

        // Buscar precio base del servicio en el taller
        const taller = await Taller.findOne();
        if (taller) {
          const servInfo = taller.servicios.find(s => s.nombre.toLowerCase().includes(servicio.toLowerCase()));
          if (servInfo) {
            nuevaCita.precio_estimado = servInfo.precio_base;
            nuevaCita.duracion_estimada_minutos = servInfo.duracion_minutos;
          }
        }

        await nuevaCita.save();
        
        return {
          ok: true,
          mensaje: 'Cita agendada con éxito',
          cita: {
            id: nuevaCita._id,
            nombre_cliente: nuevaCita.nombre_cliente,
            servicio: nuevaCita.servicio,
            fecha: nuevaCita.fecha_cita,
            fecha_formateada: formatearFechaHoraEsp(nuevaCita.fecha_cita),
            precio_estimado: nuevaCita.precio_estimado
          }
        };
      }
      
      case 'cancelar_cita': {
        const { id_cita } = args;
        const cita = await Cita.findById(id_cita);
        if (!cita) {
          return { error: 'No se encontró la cita especificada' };
        }
        cita.estado = 'cancelada';
        await cita.save();
        return { ok: true, mensaje: 'Cita cancelada con éxito', id_cita };
      }
      
      case 'obtener_servicios': {
        const taller = await Taller.findOne();
        if (!taller) return [];
        return taller.servicios.filter(s => s.activo);
      }

      case 'confirmar_cita': {
        const { id_cita } = args;
        const cita = await Cita.findById(id_cita);
        if (!cita) {
          return { error: 'No se encontró la cita especificada' };
        }
        cita.estado = 'confirmada';
        cita.estado_confirmacion = 'confirmada_cliente';
        await cita.save();
        return { ok: true, mensaje: 'Cita confirmada por el cliente con éxito', id_cita };
      }
      
      default:
        return { error: 'Herramienta no implementada' };
    }
  } catch (err) {
    console.error(`Error ejecutando tool ${nombre}:`, err);
    return { error: `Error en base de datos: ${err.message}` };
  }
};

// AGENTE SIMULADO (RULE-BASED CHATBOT DE RESPALDO)
const agenteSimulado = async (mensaje_usuario, numero_telefono) => {
  const msg = mensaje_usuario.toLowerCase();
  const taller = await Taller.findOne() || { nombre_taller: 'MecánicaPro', config_agente: { nombre_agente: 'Max' } };
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';

  // 1. OBTENER INFO DEL TALLER
  if (msg.includes('dónde') || msg.includes('donde') || msg.includes('ubicacion') || msg.includes('ubicación') || msg.includes('direccion') || msg.includes('dirección') || msg.includes('horario') || msg.includes('telefono')) {
    const info = await ejecutarTool('obtener_info_taller');
    return `📍 Dirección: ${info.direccion}
🕒 Horarios de Atención:
- Lunes a Viernes: ${info.horarios?.lunes_viernes || '08:00 - 18:00'}
- Sábados: ${info.horarios?.sabado || '09:00 - 13:00'}
- Domingos: ${info.horarios?.domingo || 'Cerrado'}
📞 Teléfono: ${info.telefono}
💬 Escríbeme si quieres agendar una cita.`;
  }

  // 2. OBTENER SERVICIOS
  const esSolicitudReserva = msg.includes('agendar') || msg.includes('reservar') || msg.includes('cita') || msg.includes('turno') || msg.includes('solicito') || msg.includes('interesa') || msg.includes('me interesa');
  if (!esSolicitudReserva && (msg.includes('servicio') || msg.includes('precio') || msg.includes('cuesta') || msg.includes('cuanto') || msg.includes('cuánto') || msg.includes('hacen'))) {
    const servicios = await ejecutarTool('obtener_servicios');
    if (!servicios.length) return `Por el momento no tenemos servicios cargados en el sistema.`;
    
    // Buscar si el mensaje pregunta por un servicio específico
    let servicioEspecifico = null;
    for (const s of servicios) {
      if (msg.includes(s.nombre.toLowerCase())) {
        servicioEspecifico = s;
        break;
      }
    }
    
    if (servicioEspecifico) {
      let subserviciosMsg = '';
      if (servicioEspecifico.productos && servicioEspecifico.productos.length > 0) {
        const prodsList = servicioEspecifico.productos.map(p => `• **${p.nombre}**`).join('\n');
        subserviciosMsg = `Para esto, contamos con las siguientes opciones en nuestro catálogo:\n${prodsList}\n\n`;
      }
      
      // Preguntas diagnósticas interactivas según el servicio
      let preguntaDiag = '¿Qué inconveniente presenta tu auto actualmente?';
      const nameLow = servicioEspecifico.nombre.toLowerCase();
      if (nameLow.includes('aceite') || nameLow.includes('preventiv') || nameLow.includes('mantenimiento')) {
        preguntaDiag = '¿Hace cuánto tiempo o cuántos kilómetros realizaste tu último mantenimiento?';
      } else if (nameLow.includes('freno')) {
        preguntaDiag = '¿Sientes algún ruido, vibración o chillido al frenar?';
      } else if (nameLow.includes('planchado') || nameLow.includes('pintura')) {
        preguntaDiag = '¿Tu auto necesita una reparación de pintura completa o es un toque más localizado por un golpe leve?';
      } else if (nameLow.includes('detail') || nameLow.includes('cerámic')) {
        preguntaDiag = '¿Buscas una corrección de pintura con brillo de exhibición o un lavado de salón completo?';
      }

      return `🔧 ¡Sí! Ofrecemos el servicio de **${servicioEspecifico.nombre}** ${servicioEspecifico.icono || '🔧'}. Es ideal para mantener tu vehículo en perfectas condiciones.\n\n${subserviciosMsg}${preguntaDiag}\n\n📌 Si lo deseas, puedes ver los precios detallados haciendo clic sobre su tarjeta en la sección de [Nuestras Especialidades](#servicios). ¡Luego vuelve aquí al chat para continuar!`;
    }
    
    let res = `🔧 En **${taller.nombre_taller || 'nuestro taller'}** ofrecemos una gran variedad de especialidades para tu vehículo. Te destaco las principales:\n\n`;
    servicios.forEach(s => {
      res += `${s.icono || '🔧'} **${s.nombre}**\n`;
    });
    res += `\n📌 Te invito a deslizarte por la sección de [Nuestras Especialidades](#servicios) en la pantalla y **hacer clic en cualquiera de ellas** para ver el detalle completo de opciones, duraciones y precios base. ¡Una vez que los revises, regresa aquí al chat para ayudarte a agendar tu cita! 🚗`;
    return res;
  }

  // 3. CONSULTAR MIS CITAS O CANCELAR
  if (msg.includes('mis citas') || msg.includes('mi cita') || msg.includes('turno') && msg.includes('tengo') || msg.includes('ver mis turnos') || msg.includes('cancelar')) {
    const citas = await ejecutarTool('ver_citas_cliente', { numero_telefono });
    
    if (msg.includes('cancelar')) {
      if (!citas.length) {
        return `No encontré ninguna cita activa asociada a tu número para cancelar. 🔧`;
      }
      
      // Si el usuario especificó un ID o hay una única cita
      if (citas.length === 1) {
        const id_cita = citas[0].id;
        const res = await ejecutarTool('cancelar_cita', { id_cita });
        return `Listo, cancelé tu cita para ${citas[0].servicio} el día ${citas[0].fecha_formateada}. ¿Quieres reprogramar o agendar otra cosa?`;
      } else {
        let res = `Tienes más de una cita activa. ¿Cuál de ellas te gustaría cancelar? Escribe "cancelar" seguido del número:\n\n`;
        citas.forEach((c, idx) => {
          res += `[${idx + 1}] ${c.servicio} - ${c.fecha_formateada} (ID: ${c.id})\n`;
        });
        return res;
      }
    }

    if (!citas.length) {
      return `¡Hola! No tienes ninguna cita pendiente o confirmada con nosotros por el momento. ¿Quieres agendar una? 🔧`;
    }

    let res = `📅 Tus citas programadas:\n\n`;
    citas.forEach(c => {
      res += `- ${c.servicio} para tu vehículo el día ${c.fecha_formateada} (Estado: ${c.estado})\n`;
    });
    return res;
  }

  // Procesar match para números seleccionados de cancelación
  if (msg.startsWith('cancelar ')) {
    const idxStr = msg.replace('cancelar', '').trim();
    const idx = parseInt(idxStr) - 1;
    const citas = await ejecutarTool('ver_citas_cliente', { numero_telefono });
    if (!isNaN(idx) && idx >= 0 && idx < citas.length) {
      const res = await ejecutarTool('cancelar_cita', { id_cita: citas[idx].id });
      return `¡Listo! Tu cita para ${citas[idx].servicio} fue cancelada correctamente. 🔧`;
    }
  }

  // 4. FLUJO DE RESERVA DE CITA (INTELIGENCIA BÁSICA DE EXTRACCIÓN CON HISTORIAL)
  // Obtener los últimos 10 mensajes de esta conversación para acumular datos y analizar estado
  let textoAcumulado = msg;
  let ultimoMensajeAsistente = '';
  let textoAsistenteAcumulado = '';
  try {
    const historialDB = await Mensaje.find({ numero_telefono }).sort({ recibido_en: -1 }).limit(10);
    const ultimoMsg = historialDB.find(m => m.remitente === 'asistente');
    if (ultimoMsg) {
      ultimoMensajeAsistente = ultimoMsg.contenido.toLowerCase();
    }

    const mensajesAsistente = historialDB
      .filter(m => m.remitente === 'asistente')
      .map(m => m.contenido.toLowerCase());
    textoAsistenteAcumulado = mensajesAsistente.join(' | ');

    const mensajesCliente = historialDB
      .filter(m => m.remitente === 'cliente')
      .map(m => m.contenido.toLowerCase());
    
    if (!mensajesCliente.includes(msg)) {
      mensajesCliente.unshift(msg);
    }
    textoAcumulado = mensajesCliente.join(' | ');
  } catch (histError) {
    console.error('Error al leer historial en agenteSimulado:', histError);
  }

  const serviciosDisponibles = await ejecutarTool('obtener_servicios');
  let servicioElegido = null;
  for (const s of serviciosDisponibles) {
    const sLow = s.nombre.toLowerCase();
    if (textoAcumulado.includes(sLow)) {
      servicioElegido = s.nombre;
      break;
    }
  }

  // Búsqueda inteligente/difusa de servicios comunes
  if (!servicioElegido) {
    if (textoAcumulado.includes('aceite') || textoAcumulado.includes('cambiar el aceite')) {
      servicioElegido = 'Cambio de Aceite';
    } else if (textoAcumulado.includes('frenos') || textoAcumulado.includes('pastilla') || textoAcumulado.includes('frenar') || textoAcumulado.includes('disco')) {
      servicioElegido = 'Revisión de Frenos';
    } else if (textoAcumulado.includes('alinea') || textoAcumulado.includes('balanceo') || textoAcumulado.includes('llanta')) {
      servicioElegido = 'Alineación y Balanceo';
    } else if (textoAcumulado.includes('diagnos') || textoAcumulado.includes('chequeo') || textoAcumulado.includes('revisar')) {
      servicioElegido = 'Diagnóstico General';
    }
  }

  // Si no detecta servicio, pero sí que quiere un turno/cita/mantenimiento/revisión
  const quiereTurno = msg.includes('turno') || msg.includes('cita') || msg.includes('agendar') || msg.includes('reservar') || msg.includes('mantenimiento') || msg.includes('revisar') || msg.includes('cambiar') || msg.includes('reparar') || msg.includes('aceite') || msg.includes('freno') || msg.includes('frenos') || msg.includes('alineacion') || msg.includes('alineación');

  // Buscar si hay una fecha (e.g. YYYY-MM-DD o formato "2026-05-20" o relativa)
  let fechaMatch = textoAcumulado.match(/(\d{4})-(\d{2})-(\d{2})/);
  let fechaStr = fechaMatch ? fechaMatch[0] : null;

  if (!fechaStr) {
    const hoy = new Date();
    if (textoAcumulado.includes('mañana') || textoAcumulado.includes('manana')) {
      const tomorrow = new Date(hoy);
      tomorrow.setDate(hoy.getDate() + 1);
      fechaStr = tomorrow.toISOString().split('T')[0];
    } else if (textoAcumulado.includes('hoy')) {
      fechaStr = hoy.toISOString().split('T')[0];
    }
  }

  // Buscar hora (ej: 10:00, 15:00)
  let horaMatch = textoAcumulado.match(/(\d{2}):(\d{2})/);
  let horaStr = horaMatch ? horaMatch[0] : null;

  // Intentar adivinar auto
  let autoMarca = null;
  const marcasComunes = ['ford', 'chevrolet', 'toyota', 'fiat', 'volkswagen', 'vw', 'peugeot', 'renault', 'honda', 'hyundai', 'nissan', 'citroen', 'audi', 'bmw', 'kia', 'suzuki', 'mazda'];
  for (const m of marcasComunes) {
    if (textoAcumulado.includes(m)) {
      autoMarca = m.charAt(0).toUpperCase() + m.slice(1);
      break;
    }
  }

  // Intentar adivinar nombre
  let nombreCliente = null;
  const nameMatch = textoAcumulado.match(/(me llamo|mi nombre es|soy)\s+([a-zA-Záéíóúñ]+\s*[a-zA-Záéíóúñ]*)/i);
  if (nameMatch) {
    nombreCliente = nameMatch[2].trim();
  }

  // Extraer DNI de 8 dígitos de forma acumulada
  let dni = null;
  const dniMatch = textoAcumulado.match(/\b\d{8}\b/);
  if (dniMatch) {
    dni = dniMatch[0];
  }

  // Extraer teléfono real de 9 o más dígitos de forma acumulada si es sesión web
  let realPhone = null;
  if (numero_telefono.startsWith('web_')) {
    const phoneMatch = textoAcumulado.match(/\b(9\d{8})\b/) || textoAcumulado.match(/\b(\d{9,11})\b/);
    if (phoneMatch) {
      realPhone = phoneMatch[0];
    }
  } else {
    realPhone = numero_telefono;
  }

  // Verificar si tenemos todos los campos indispensables desde el principio
  const tieneTodos = nombreCliente && servicioElegido && fechaStr && horaStr && dni && realPhone;

  // 4a. DIÁLOGO DE DIAGNÓSTICO INTERACTIVO (Antes de pedir datos)
  let necesitaDiagnostico = false;
  let preguntaDiagnostico = '';

  if (!tieneTodos && (quiereTurno || servicioElegido)) {
    if (servicioElegido === 'Cambio de Aceite') {
      if (!textoAsistenteAcumulado.includes('último cambio de aceite') && !textoAsistenteAcumulado.includes('ultimo cambio de aceite')) {
        necesitaDiagnostico = true;
        preguntaDiagnostico = 'Entiendo. ¿Hace cuánto tiempo o cuántos kilómetros realizaste tu último cambio de aceite?';
      }
    } else if (servicioElegido === 'Revisión de Frenos') {
      if (!textoAsistenteAcumulado.includes('ruido o vibración al frenar') && !textoAsistenteAcumulado.includes('chillido al frenar')) {
        necesitaDiagnostico = true;
        preguntaDiagnostico = 'Entendido. ¿Sientes algún ruido o vibración al frenar, o has sentido algún chillido?';
      }
    } else if (servicioElegido === 'Alineación y Balanceo') {
      if (!textoAsistenteAcumulado.includes('desvía hacia un lado') && !textoAsistenteAcumulado.includes('vibración a alta velocidad')) {
        necesitaDiagnostico = true;
        preguntaDiagnostico = 'De acuerdo. ¿Sientes que el auto se desvía hacia un lado o vibra el volante a alta velocidad?';
      }
    } else if (quiereTurno && !servicioElegido) {
      if (!textoAsistenteAcumulado.includes('qué tipo de falla o mantenimiento')) {
        necesitaDiagnostico = true;
        preguntaDiagnostico = '¡Hola! Claro que sí. ¿Qué tipo de falla o qué mantenimiento en específico le gustaría realizar a su auto?';
      }
    }
  }

  if (necesitaDiagnostico) {
    return preguntaDiagnostico;
  }

  // 4b. OFRECIMIENTO DE AGENDAMIENTO (Luego del diagnóstico)
  const preguntoDiagnosticoAceite = textoAsistenteAcumulado.includes('último cambio de aceite') || textoAsistenteAcumulado.includes('ultimo cambio de aceite');
  const preguntoDiagnosticoFrenos = textoAsistenteAcumulado.includes('ruido o vibración al frenar') || textoAsistenteAcumulado.includes('chillido al frenar');
  const preguntoDiagnosticoAlineacion = textoAsistenteAcumulado.includes('desvía hacia un lado') || textoAsistenteAcumulado.includes('vibración a alta velocidad');
  const preguntoDiagnosticoGeneral = textoAsistenteAcumulado.includes('qué tipo de falla o mantenimiento');

  const preguntoDiagnostico = preguntoDiagnosticoAceite || preguntoDiagnosticoFrenos || preguntoDiagnosticoAlineacion || preguntoDiagnosticoGeneral;
  const ofrecioAgendar = textoAsistenteAcumulado.includes('desea reservar una cita') || textoAsistenteAcumulado.includes('deseas reservar una cita') || textoAsistenteAcumulado.includes('desea agendar una cita') || textoAsistenteAcumulado.includes('deseas agendar una cita');

  const acabaDeResponderDiagnostico = preguntoDiagnostico && !ofrecioAgendar && !tieneTodos;

  if (acabaDeResponderDiagnostico) {
    return `Entendido. ¿Deseas reservar una cita para realizar el servicio en el taller?`;
  }

  // 4c. FLUJO DE OBTENCIÓN DE DATOS Y CONFIRMACIÓN
  const ofrecimosAgendar = ultimoMensajeAsistente.includes('desea reservar una cita') || ultimoMensajeAsistente.includes('desea agendar una cita') || ultimoMensajeAsistente.includes('deseas agendar una cita');
  const aceptoAgendar = ofrecimosAgendar && (msg.includes('si') || msg.includes('sí') || msg.includes('deseo') || msg.includes('quiero') || msg.includes('dale') || msg.includes('ok') || msg.includes('aceptar'));

  const ofrecimosCalendario = ultimoMensajeAsistente.includes('abrirte un calendario') || ultimoMensajeAsistente.includes('mostrarte las citas o las horas disponibles');
  const aceptoCalendario = ofrecimosCalendario && (msg.includes('si') || msg.includes('sí') || msg.includes('deseo') || msg.includes('quiero') || msg.includes('dale') || msg.includes('ok') || msg.includes('aceptar') || msg.includes('abrir') || msg.includes('permito'));
  const rechazoCalendario = ofrecimosCalendario && (msg.includes('no') || msg.includes('nunca') || msg.includes('prefiero escribir') || msg.includes('formato') || msg.includes('escribiendo'));

  if (aceptoAgendar) {
    return `¿Me permites abrirte un calendario para mostrarte las citas o las horas disponibles que tenga?`;
  }

  if (aceptoCalendario) {
    return `¡Excelente! Te abro el calendario para que elijas tu turno: [ABRIR_CALENDARIO]`;
  }

  if (rechazoCalendario) {
    return `De acuerdo. Por favor, introduce la fecha en el siguiente formato: AAAA-MM-DD (ej: 2026-05-25) y la hora deseada (ej: 11:00).`;
  }

  const flujoReservaActivo = quiereTurno || (fechaStr && horaStr) || tieneTodos || ultimoMensajeAsistente.includes('introduce la fecha en el siguiente formato') || ultimoMensajeAsistente.includes('datos faltantes');

  if (flujoReservaActivo) {
    if (!nombreCliente) {
      const clienteExistente = await Cliente.findOne({ numero_telefono });
      if (clienteExistente && clienteExistente.nombre) {
        nombreCliente = clienteExistente.nombre;
      }
    }
    if (!dni) {
      const clienteExistente = await Cliente.findOne({ numero_telefono });
      if (clienteExistente && clienteExistente.dni) {
        dni = clienteExistente.dni;
      }
    }

    const tieneTodosActualizado = nombreCliente && servicioElegido && fechaStr && horaStr && dni && realPhone;

    if (tieneTodosActualizado) {
      // Agendar directamente
      const autoMod = autoMarca || 'Auto';
      const ISOFecha = `${fechaStr}T${horaStr}:00`;
      
      const res = await ejecutarTool('agendar_cita', {
        numero_telefono: realPhone,
        nombre_cliente: nombreCliente,
        dni: dni,
        servicio: servicioElegido,
        descripcion_trabajo: 'Agendado automáticamente vía chat simulado',
        vehiculo_marca: autoMod,
        vehiculo_modelo: 'Detalle',
        vehiculo_anio: 2018,
        fecha_cita: ISOFecha,
        _session_telefono: numero_telefono
      });

      if (res.error) {
        return `¡Upps! No pude agendar la cita. ${res.error}. ¿Elegimos otro horario? Puedes consultar los horarios libres.`;
      }

      return `¡Genial ${nombreCliente}! He registrado tu solicitud de cita para ${servicioElegido} el día ${res.cita.fecha_formateada} para tu auto ${autoMod} (DNI: ${dni}, Teléfono: ${realPhone}). Queda pendiente de confirmación por el administrador del taller. El precio estimado es S/. ${res.cita.precio_estimado}. ¡Te avisaremos pronto! 🚗🔧`;
    }

    // Si falta información, guiar de forma conversacional
    let faltantes = [];
    if (!nombreCliente) faltantes.push('tu nombre completo (ej: "Me llamo Juan Perez")');
    if (!dni) faltantes.push('tu DNI (8 dígitos, ej: "mi DNI es 12345678")');
    if (numero_telefono.startsWith('web_') && !realPhone) {
      faltantes.push('tu número de teléfono celular real (9 dígitos, ej: "mi celular es 999888777")');
    }
    if (!servicioElegido) {
      faltantes.push('el servicio que necesitas (ej: Cambio de Aceite, Alineación y Balanceo, Revisión de Frenos, Diagnóstico General)');
    }
    if (!fechaStr || !horaStr) {
      faltantes.push('la fecha (formato AAAA-MM-DD, ej: 2026-05-25) y la hora deseada (ej: 10:00)');
    }
    
    // Si tenemos la fecha pero nos falta la hora, mostrar disponibilidad
    let disponibilidadTexto = '';
    if (fechaStr && (!horaStr || msg.includes('disponibles') || msg.includes('horario'))) {
      const disponibilidad = await ejecutarTool('consultar_disponibilidad', { fecha: fechaStr });
      if (disponibilidad.horarios_disponibles?.length > 0) {
        disponibilidadTexto = `\n\n🕒 Horarios libres para el ${fechaStr}:\n${disponibilidad.horarios_disponibles.join(', ')}`;
      } else {
        disponibilidadTexto = `\n\n🔴 No hay horarios disponibles para el ${fechaStr}. Por favor selecciona otra fecha.`;
      }
    }

    return `Para agendar tu cita de ${servicioElegido || 'servicio'}, por favor facilítame los siguientes datos faltantes:
${faltantes.map(f => `- ${f}`).join('\n')}${disponibilidadTexto}

Ejemplo: "Soy Juan Perez, DNI 12345678, celular 999888777, quiero un Cambio de Aceite para mi Ford el 2026-05-25 a las 10:00"`;
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
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
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
      console.log(`🤖 [Gemini API] Intentando llamada con modelo: ${modelo}...`);
      const respuesta = await openaiClient.chat.completions.create({
        ...params,
        model: modelo
      });
      console.log(`✅ [Gemini API] Éxito en llamada utilizando modelo: ${modelo}`);
      return respuesta;
    } catch (err) {
      ultimoError = err;
      console.warn(`⚠️ [Gemini API] Error al llamar con modelo ${modelo}: ${err.message || err}. Probando el siguiente...`);
    }
  }
  throw ultimoError || new Error("Todos los modelos fallaron en llamarCompletionsConFallback");
};

// CORE AGENT PROCESSOR
export const procesarMensajeIA = async (numero_telefono, mensaje_usuario) => {
  const msgClean = mensaje_usuario.toLowerCase().trim();
  const esConfirmacion = ['sí', 'si', 'confirmar', 'confirmo', 'correcto', 'ok', 'dale', 'afirmativo'].includes(msgClean) || msgClean === 'si' || msgClean === 'sí' || msgClean.startsWith('si ') || msgClean.startsWith('sí ') || msgClean.includes('confirmar') || msgClean.includes('confirmada') || msgClean.includes('confirmado');
  const esCancelacion = ['no', 'cancelar', 'cancelo', 'rechazar', 'no iré', 'no ire', 'negativo'].includes(msgClean) || msgClean === 'no' || msgClean.startsWith('no ') || msgClean.includes('cancelar') || msgClean.includes('cancela') || msgClean.includes('cancelo');

  if (esConfirmacion || esCancelacion) {
    // Buscar si hay una cita activa que tenga recordatorio enviado y confirmación pendiente
    const citaRecordatorio = await Cita.findOne({
      numero_telefono: numero_telefono.trim(),
      recordatorio_enviado: true,
      estado_confirmacion: 'pendiente',
      estado: 'confirmada'
    }).sort({ fecha_cita: 1 });

    if (citaRecordatorio) {
      if (esConfirmacion) {
        citaRecordatorio.estado_confirmacion = 'confirmada_cliente';
        await citaRecordatorio.save();
        return `¡Muchas gracias! He revalidado tu cita para ${citaRecordatorio.servicio} el día ${formatearFechaHoraEsp(citaRecordatorio.fecha_cita)}. ¡Te esperamos en el taller! 🚗🔧`;
      } else {
        citaRecordatorio.estado = 'cancelada';
        citaRecordatorio.estado_confirmacion = 'cancelada_cliente';
        await citaRecordatorio.save();
        return `Entendido. He cancelado tu cita para ${citaRecordatorio.servicio} el día ${formatearFechaHoraEsp(citaRecordatorio.fecha_cita)} y liberado el horario para otros clientes. Si deseas agendar en otro momento, no dudes en escribirme. 🔧`;
      }
    }
  }

  const taller = await Taller.findOne();
  const nombreTaller = taller?.nombre_taller || 'MecánicaPro';
  const nombreAgente = taller?.config_agente?.nombre_agente || 'Max';
  const direccion = taller?.direccion || 'Av. San Borja Sur 250, San Borja, Lima';
  const telefono = taller?.telefono || '+51 1 345-6789';
  const lunesViernes = taller?.horarios?.lunes_viernes || '08:00 - 18:00';
  const sabado = taller?.horarios?.sabado || '09:00 - 13:00';
  const domingo = taller?.horarios?.domingo || 'Cerrado';
  const sobreNosotros = taller?.sobre_nosotros || 'Taller mecánico de confianza.';
  // Obtener lista de servicios en formato legible
  let serviciosLista = '';
  if (taller && taller.servicios) {
    serviciosLista = taller.servicios
      .filter(s => s.activo)
      .map(s => `- ${s.nombre}: S/. ${s.precio_base} (${s.duracion_minutos} min)`)
      .join('\n');
  }

  // Si no tenemos API Key real, ejecutamos el agente simulado
  if (!geminiClient) {
    console.log('🤖 Ejecutando en Modo Simulado (No hay Gemini API Key configurada)');
    return await agenteSimulado(mensaje_usuario, numero_telefono);
  }

  const systemPrompt = `Eres ${nombreAgente}, especialista de atención al cliente de ${nombreTaller}. Eres humana, amable, eficiente y conoces el mundo automotriz. NUNCA menciones que eres una Inteligencia Artificial, bot o asistente virtual.

TU ROL ES:
 - Responder preguntas sobre el taller, servicios, horarios y ubicación.
- Ayudar a los clientes a agendar, consultar, confirmar y cancelar citas.
- Ser cálido, conciso y profesional.
- Usar español latinoamericano (Perú). Evita hablar con modismos o acentos argentinos (no uses voseo como "decime", "querés", "preferís", "escribime"). Usa formas como "dime", "quieres", "prefieres", "escríbeme".
- Usar la moneda oficial de Perú, que es el Sol (S/.).
- Usar emojis moderadamente 🔧.
- REGLA DE EVITAR CHATS LARGOS Y FOMENTAR LA INTERACCIÓN: Para mantener la conversación fluida y evitar mensajes ineficientemente largos en el chat, NUNCA listes todos los servicios, descripciones y precios a la vez.
  - Si te preguntan de forma general por el catálogo, precios o qué servicios ofrecen, menciona como máximo 3 especialidades y pídele al usuario dirigirse a la sección en pantalla usando el enlace Markdown: [Nuestras Especialidades](#servicios). Explícale que al hacer clic en cualquiera de las tarjetas de especialidad, se abrirá un modal interactivo con el detalle completo de sub-servicios y precios.
  - Si te preguntan por un servicio específico (ej. planchado y pintura, detailing, cambio de aceite, etc.) de manera general (es decir, sin indicar intención de agendar), responde de manera muy natural y conversacional: describe brevemente el servicio con empatía, menciona los productos/sub-servicios específicos que incluye (ej. para planchado y pintura, menciona Planchado Básico y Planchado Especial) y plantéale de inmediato una pregunta de diagnóstico interactiva y empática. Invítalo también a hacer clic en su tarjeta dentro de [Nuestras Especialidades](#servicios) para ver todos los precios y opciones.
  - SIEMPRE que indiques dirigirse a la sección en pantalla para consultas generales, recuérdale explícitamente al cliente: "Una vez que revises la información en la pantalla, recuerda volver a este chat para continuar con tu reserva o hacerme más preguntas."
  - REGLA DE RESERVAS DIRECTAS (SIN REDUNDANCIAS): Si el cliente ya viene con la intención directa de agendar o ya seleccionó un servicio/producto específico (por ejemplo, si su mensaje dice "Hola, me interesa agendar una cita para..." o menciona un paquete de reserva como "Afinamiento Menor"), él ya conoce la información de precios y detalles. NUNCA le digas que puede ver los detalles en la sección de especialidades ni le envíes el link '#servicios'. Simplemente valida su elección con entusiasmo (ej: "¡Qué excelente elección! Es fantástico que te preocupes por el mantenimiento preventivo de tu auto..."), hazle directamente la pregunta diagnóstica de seguimiento si aplica (ej: "¿Hace cuánto tiempo o cuántos kilómetros realizaste tu último afinamiento?"), e inicia directamente el flujo para recopilar sus datos o guiarlo a abrir el calendario para concretar la reserva.

DIÁLOGO DE DIAGNÓSTICO Y CONVERSACIÓN:
- Entabla una conversación corta e interactiva cuando el cliente mencione un problema o mantenimiento.
- Por ejemplo, si te dicen "necesito cambio de aceite" o "revisar frenos", haz una pregunta corta de seguimiento útil antes de agendar, como: "¿Hace cuánto tiempo o cuántos kilómetros realizaste tu último cambio de aceite?" o "¿Sientes algún ruido o vibración al frenar?".
- Si el cliente no sabe qué responder o decides concluir las preguntas de diagnóstico, debes preguntarle: "¿Deseas reservar una cita para realizar el servicio en el taller?".

FLUJO DE CALENDARIO INTERACTIVO (REGLA CRÍTICA):
- Cuando ofrezcas agendar/reservar una cita y el cliente te responda de manera afirmativa ("sí", "dale", "me gustaría", "quiero", etc.), debes preguntarle exactamente:
  "¿Me permites abrirte un calendario para mostrarte las citas o las horas disponibles que tenga?"
- Si el cliente responde afirmativamente a esta pregunta ("sí", "por favor", "dale", etc.), debes responder con un mensaje amigable que termine incluyendo EXACTAMENTE la etiqueta "[ABRIR_CALENDARIO]" al final del texto. Por ejemplo: "¡Excelente! Te abro el calendario para que elijas tu turno: [ABRIR_CALENDARIO]" o "Perfecto, aquí tienes el calendario para elegir: [ABRIR_CALENDARIO]".
- Si el cliente responde que no o prefiere no usar el calendario ("no", "prefiero escribir", "no abras nada", etc.), debes decirle amablemente: "De acuerdo. Por favor, introduce la fecha en el siguiente formato: AAAA-MM-DD (ej: 2026-05-25) y la hora deseada (ej: 11:00)." y continuar con la recopilación manual de datos por chat.

DATOS PARA AGENDAR UNA CITA:
- Para confirmar y agendar la cita, necesitas obligatoriamente los siguientes datos mínimos:
  1. Nombre completo del cliente
  2. DNI (Documento Nacional de Identidad, 8 dígitos) -> ¡MUY IMPORTANTE!
  3. Número de teléfono real (para podernos comunicar con ellos)
  4. Marca, modelo y año del vehículo
  5. Fecha y hora preferida (siempre valida disponibilidad antes con 'consultar_disponibilidad')
  6. Servicio o motivo de la cita

DETECCIÓN DE CLIENTES WEB VS WHATSAPP:
- El identificador actual de la sesión del cliente es: ${numero_telefono}.
- Si el identificador actual empieza con 'web_', significa que el cliente está chateando desde el sitio web (no desde WhatsApp). Por ende, NO asumamos ese 'web_' como su número de teléfono real. Pídele amablemente su número de teléfono celular real y su DNI para completar la reserva.
- Si el identificador NO empieza con 'web_' (es un número de teléfono real), puedes asumir que ese es su teléfono de contacto y solo pídele confirmar si es correcto o si prefiere dar otro, además del DNI y los otros datos.

REGLAS IMPORTANTES:
- Eres libre de usar formato Markdown básico en tus respuestas: puedes destacar texto importante en negrita con doble asterisco (**) y estructurar listas usando viñetas con guiones (-), ya que nuestra interfaz de chat ahora renderiza este formato de manera correcta. Evita el uso de otros símbolos markdown complejos (como numerales # para títulos o tablas).
- Nunca confirmes una cita sin ejecutar la tool 'agendar_cita' enviando todos los campos requeridos (incluyendo el número de teléfono real y DNI).
- Al agendar la cita con 'agendar_cita', aclara al cliente que su cita queda registrada como **pendiente de confirmación** y que el administrador la validará pronto.
- Nunca inventes precios, fechas ni datos que no tengas.
- Si el cliente pregunta algo que no puedes resolver, ofrece: "¿Quieres que te contacte alguien de nuestro equipo directamente?"
- Si el cliente está enojado: reconoce el inconveniente, sé empático y ofrece una solución concreta.
- Si el cliente cancela, usa la tool 'cancelar_cita' con el id correspondiente.
- Si el cliente confirma su asistencia (a raíz de un recordatorio o pregunta), usa la tool 'confirmar_cita' con el id correspondiente.
- Si te piden horarios ocupados o disponibles para un día, usa 'consultar_disponibilidad'.`;

  try {
    // 1. Obtener historial de mensajes de DB (últimos 20)
    const historialDB = await Mensaje.find({ numero_telefono })
      .sort({ recibido_en: -1 })
      .limit(20);
      
    // Invertir para que quede en orden cronológico
    historialDB.reverse();
    
    const historial = historialDB.map(m => ({
      role: m.remitente === 'cliente' ? 'user' : 'assistant',
      content: m.contenido
    }));

    // 2. Primera llamada a Gemini con fallback de modelos
    const respuesta = await llamarCompletionsConFallback(geminiClient, {
      messages: [
        { role: "system", content: systemPrompt },
        ...historial,
        { role: "user", content: mensaje_usuario }
      ],
      tools: tools,
      tool_choice: "auto"
    });

    const choice = respuesta.choices[0];
    
    // 3. Si la IA quiere ejecutar herramientas (tool_calls)
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCalls = choice.message.tool_calls;
      const resultadosTools = [];

      for (const toolCall of toolCalls) {
        const nombre = toolCall.function.name;
        // Agregar número de teléfono por defecto a los argumentos si es requerido y falta
        const args = JSON.parse(toolCall.function.arguments);
        if (nombre === 'ver_citas_cliente' && !args.numero_telefono) {
          args.numero_telefono = numero_telefono;
        }
        if (nombre === 'agendar_cita' && !args.numero_telefono) {
          args.numero_telefono = numero_telefono;
        }

        // Adjuntar el teléfono de sesión original para rastreo y limpieza de web sessions
        args._session_telefono = numero_telefono;

        console.log(`🔨 [Tool Call] Ejecutando '${nombre}' con argumentos:`, args);
        const resultado = await ejecutarTool(nombre, args);
        
        resultadosTools.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: nombre,
          content: JSON.stringify(resultado)
        });
      }

      // Segunda llamada enviando los resultados con fallback de modelos
      try {
        const respuestaFinal = await llamarCompletionsConFallback(geminiClient, {
          messages: [
            { role: "system", content: systemPrompt },
            ...historial,
            { role: "user", content: mensaje_usuario },
            choice.message,
            ...resultadosTools
          ]
        });

        const finalContent = respuestaFinal.choices[0].message.content;
        if (!finalContent || finalContent.trim() === '') {
          console.log('⚠️ Segunda llamada a Gemini retornó contenido vacío o nulo. Usando fallback simulado...');
          return await agenteSimulado(mensaje_usuario, numero_telefono);
        }
        return finalContent;
      } catch (segundaLlamadaError) {
        console.error('🔴 Error en segunda llamada a Gemini (después de ejecutar tools):', segundaLlamadaError);
        console.log('🤖 Intentando generar respuesta a partir de los resultados de las herramientas ejecutadas...');
        
        // Buscar si se ejecutó agendar_cita
        const toolAgendar = resultadosTools.find(r => r.name === 'agendar_cita');
        if (toolAgendar) {
          const resObj = JSON.parse(toolAgendar.content);
          if (resObj.ok && resObj.cita) {
            return `¡Confirmado! He agendado tu cita de ${resObj.cita.servicio} para el día ${resObj.cita.fecha_formateada} (Vehículo: ${resObj.cita.vehiculo || 'registrado'}). El precio estimado es S/. ${resObj.cita.precio_estimado}. ¡Te esperamos! 🚗🔧`;
          } else if (resObj.error) {
            return `No pude completar el agendamiento: ${resObj.error}. Por favor, elige otra fecha/hora o indícame si deseas consultar disponibilidad.`;
          }
        }

        // Buscar si se ejecutó cancelar_cita
        const toolCancelar = resultadosTools.find(r => r.name === 'cancelar_cita');
        if (toolCancelar) {
          const resObj = JSON.parse(toolCancelar.content);
          if (resObj.ok) {
            return `¡Listo! Tu cita ha sido cancelada con éxito. 🔧`;
          }
        }

        // Buscar si se ejecutó confirmar_cita
        const toolConfirmar = resultadosTools.find(r => r.name === 'confirmar_cita');
        if (toolConfirmar) {
          const resObj = JSON.parse(toolConfirmar.content);
          if (resObj.ok) {
            return `¡Excelente! He confirmado tu asistencia para la cita. ¡Te esperamos! 🚗🔧`;
          }
        }

        // Buscar si se ejecutó consultar_disponibilidad
        const toolDisp = resultadosTools.find(r => r.name === 'consultar_disponibilidad');
        if (toolDisp) {
          const resObj = JSON.parse(toolDisp.content);
          if (resObj.horarios_disponibles?.length > 0) {
            return `Tengo estos horarios disponibles para el ${resObj.fecha}: ${resObj.horarios_disponibles.join(', ')}. ¿Te gustaría reservar alguno? 🕒`;
          } else {
            return `Lo siento, no hay turnos disponibles para el ${resObj.fecha || 'día solicitado'}. Por favor intenta con otra fecha.`;
          }
        }

        // Fallback genérico si no se reconoce la tool
        return await agenteSimulado(mensaje_usuario, numero_telefono);
      }
    }

    const firstContent = choice.message.content;
    if (!firstContent || firstContent.trim() === '') {
      console.log('⚠️ Primera llamada a Gemini de retorno vacío o nulo. Usando fallback simulado...');
      return await agenteSimulado(mensaje_usuario, numero_telefono);
    }
    return firstContent;
  } catch (error) {
    console.error('🔴 Error en llamada a Gemini API:', error);
    // Si la API falla por cuota o key inválida, hacer fallback al agente simulado
    console.log('🤖 Reintentando con agente simulado por error en API...');
    return await agenteSimulado(mensaje_usuario, numero_telefono);
  }
};
