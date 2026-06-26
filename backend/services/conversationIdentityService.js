import Cliente from '../models/Cliente.js';
import Cita from '../models/Cita.js';
import Mensaje from '../models/Mensaje.js';

export const isWebSessionId = (value = '') => String(value).trim().startsWith('web_');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizePlate = (value = '') => String(value).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

const normalizePhoneDigits = (value = '') => String(value).replace(/[^0-9]/g, '');

export const getPhoneVariants = (value = '') => {
  const raw = String(value).trim();
  if (!raw || isWebSessionId(raw)) return raw ? [raw] : [];

  const digits = normalizePhoneDigits(raw);
  if (!digits) return [];

  const variants = new Set([digits]);
  if (digits.length === 9 && digits.startsWith('9')) {
    variants.add(`51${digits}`);
    variants.add(`+51${digits}`);
  }
  if (digits.length === 11 && digits.startsWith('51')) {
    variants.add(digits.slice(2));
    variants.add(`+${digits}`);
  }
  return [...variants];
};

export const extractReliableIdentifiers = (text = '') => {
  const source = String(text || '');
  const phones = new Set();
  const dnis = new Set();
  const plates = new Set();

  const phoneRegex = /(?:\+?\s*51[\s.-]*)?(9(?:[\s.-]*\d){8})\b/g;
  for (const match of source.matchAll(phoneRegex)) {
    const digits = normalizePhoneDigits(match[0]);
    if (digits.length === 9 || (digits.length === 11 && digits.startsWith('51'))) {
      phones.add(digits);
    }
  }

  for (const match of source.matchAll(/\b\d{8}\b/g)) {
    dnis.add(match[0]);
  }

  const labelledPlateRegex = /(?:placa|patente)\s*(?:es|:)?\s*([a-zA-Z0-9]{3}[\s-]?[a-zA-Z0-9]{3})\b/i;
  const labelledPlate = source.match(labelledPlateRegex);
  if (labelledPlate) {
    const normalized = normalizePlate(labelledPlate[1]);
    if (normalized.length === 6) plates.add(normalized);
  }

  for (const match of source.matchAll(/\b([a-zA-Z0-9]{3}-[a-zA-Z0-9]{3}|[a-zA-Z0-9]{6})\b/g)) {
    const normalized = normalizePlate(match[1]);
    if (normalized.length === 6 && /[A-Z]/.test(normalized) && /\d/.test(normalized)) {
      plates.add(normalized);
    }
  }

  const nameMatch = source.match(/\b(?:me llamo|mi nombre es|soy)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+){0,3})/i);

  return {
    phones: [...phones],
    dnis: [...dnis],
    plates: [...plates],
    name: nameMatch ? nameMatch[1].trim() : null
  };
};

const plateRegex = (plate) => {
  const normalized = normalizePlate(plate);
  if (normalized.length !== 6) return null;
  return new RegExp(`^${escapeRegex(normalized.slice(0, 3))}[-\\s]?${escapeRegex(normalized.slice(3))}$`, 'i');
};

const uniqueClients = (clients = []) => {
  const byId = new Map();
  for (const client of clients.filter(Boolean)) {
    byId.set(client._id.toString(), client);
  }
  return [...byId.values()];
};

const findClientsByIdentifiers = async ({ phones = [], dnis = [], plates = [] }) => {
  const matches = [];

  if (phones.length > 0) {
    const variants = [...new Set(phones.flatMap(getPhoneVariants))];
    const phoneClients = await Cliente.find({ numero_telefono: { $in: variants } });
    matches.push(...phoneClients.map((client) => ({ client, matchedBy: 'phone' })));
  }

  if (dnis.length > 0) {
    const dniClients = await Cliente.find({ dni: { $in: dnis } });
    matches.push(...dniClients.map((client) => ({ client, matchedBy: 'dni' })));
  }

  if (plates.length > 0) {
    for (const plate of plates) {
      const regex = plateRegex(plate);
      if (!regex) continue;

      const clientsByVehicle = await Cliente.find({ 'vehiculos.patente': { $regex: regex } });
      matches.push(...clientsByVehicle.map((client) => ({ client, matchedBy: 'plate' })));

      const citas = await Cita.find({ 'vehiculo.patente': { $regex: regex } })
        .select('cliente numero_telefono')
        .limit(20);
      const clientIds = citas.map((cita) => cita.cliente).filter(Boolean);
      const citaPhones = citas.map((cita) => cita.numero_telefono).filter(Boolean);

      if (clientIds.length > 0) {
        const clientsByCitaId = await Cliente.find({ _id: { $in: clientIds } });
        matches.push(...clientsByCitaId.map((client) => ({ client, matchedBy: 'plate' })));
      }

      if (citaPhones.length > 0) {
        const clientsByCitaPhone = await Cliente.find({ numero_telefono: { $in: citaPhones } });
        matches.push(...clientsByCitaPhone.map((client) => ({ client, matchedBy: 'plate' })));
      }
    }
  }

  const clients = uniqueClients(matches.map((match) => match.client));
  const matchedBy = [...new Set(matches.map((match) => match.matchedBy))];
  return { clients, matchedBy };
};

const mergeSessionIntoClient = async (sessionId, targetClient) => {
  if (!isWebSessionId(sessionId) || !targetClient) return;
  if (sessionId === targetClient.numero_telefono) return;

  const sourceClient = await Cliente.findOne({ numero_telefono: sessionId });
  const nombreCliente = targetClient.nombre || sourceClient?.nombre || 'Cliente';

  await Mensaje.updateMany(
    { numero_telefono: sessionId },
    { $set: { numero_telefono: targetClient.numero_telefono, nombre_cliente: nombreCliente } }
  );

  await Cita.updateMany(
    { numero_telefono: sessionId },
    {
      $set: {
        numero_telefono: targetClient.numero_telefono,
        cliente: targetClient._id,
        nombre_cliente: nombreCliente
      }
    }
  );

  if (!sourceClient || sourceClient._id.equals(targetClient._id)) return;

  const targetPatentes = new Set((targetClient.vehiculos || [])
    .map((vehiculo) => normalizePlate(vehiculo?.patente))
    .filter(Boolean));

  for (const vehiculo of sourceClient.vehiculos || []) {
    const patente = normalizePlate(vehiculo?.patente);
    if (!patente || !targetPatentes.has(patente)) {
      targetClient.vehiculos.push(vehiculo);
      if (patente) targetPatentes.add(patente);
    }
  }

  const sourceLids = sourceClient.whatsapp_lids || [];
  if (!targetClient.whatsapp_lids) targetClient.whatsapp_lids = [];
  for (const lid of sourceLids) {
    if (!targetClient.whatsapp_lids.includes(lid)) {
      targetClient.whatsapp_lids.push(lid);
    }
  }

  if (!targetClient.whatsapp_lid && sourceClient.whatsapp_lid) {
    targetClient.whatsapp_lid = sourceClient.whatsapp_lid;
  }
  if (!targetClient.nombre && sourceClient.nombre) targetClient.nombre = sourceClient.nombre;
  if (!targetClient.email && sourceClient.email) targetClient.email = sourceClient.email;
  if (!targetClient.dni && sourceClient.dni) targetClient.dni = sourceClient.dni;

  targetClient.total_citas = (targetClient.total_citas || 0) + (sourceClient.total_citas || 0);
  targetClient.total_gastado = (targetClient.total_gastado || 0) + (sourceClient.total_gastado || 0);
  targetClient.deuda_actual = (targetClient.deuda_actual || 0) + (sourceClient.deuda_actual || 0);

  await targetClient.save();
  await Cliente.findByIdAndDelete(sourceClient._id);
};

export const getConversationPayload = async (numeroTelefono) => {
  const mensajes = await Mensaje.find({ numero_telefono: numeroTelefono }).sort({ recibido_en: 1 });
  const cliente = await Cliente.findOne({ numero_telefono: numeroTelefono });
  return { mensajes, cliente };
};

export const claimConversationIdentity = async ({ sessionId, identifier }) => {
  const cleanSessionId = String(sessionId || '').trim();
  const extracted = extractReliableIdentifiers(identifier);

  if (!cleanSessionId || !identifier) {
    return { status: 'not_found', reason: 'missing_identifier', extracted };
  }

  if (!extracted.phones.length && !extracted.dnis.length && !extracted.plates.length) {
    if (extracted.name) {
      return { status: 'name_only', name: extracted.name, extracted };
    }
    return { status: 'not_found', reason: 'no_reliable_identifier', extracted };
  }

  const { clients, matchedBy } = await findClientsByIdentifiers(extracted);

  if (clients.length === 0) {
    return { status: 'not_found', extracted };
  }

  if (clients.length > 1) {
    return {
      status: 'ambiguous',
      matchedBy,
      extracted,
      candidates: clients.map((client) => ({
        id: client._id,
        nombre: client.nombre,
        numero_telefono: client.numero_telefono
      }))
    };
  }

  const targetClient = clients[0];
  await mergeSessionIntoClient(cleanSessionId, targetClient);
  const payload = await getConversationPayload(targetClient.numero_telefono);

  return {
    status: 'claimed',
    matchedBy,
    extracted,
    canonicalId: targetClient.numero_telefono,
    cliente: payload.cliente || targetClient,
    mensajes: payload.mensajes
  };
};
