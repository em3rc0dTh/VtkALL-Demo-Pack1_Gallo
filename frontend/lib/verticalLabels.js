export const defaultLabels = {
  customer: 'Cliente',
  customers: 'Clientes',
  case: 'Caso',
  cases: 'Casos',
  appointment: 'Cita',
  appointments: 'Citas',
  managedEntity: 'Entidad',
  managedEntities: 'Entidades',
  expert: 'Experto',
  experts: 'Expertos',
  quote: 'Cotización',
  quotes: 'Cotizaciones',
  service: 'Servicio',
  services: 'Servicios',
  evidence: 'Evidencia',
  diagnosis: 'Diagnóstico'
};

export function getLabel(labels, key, fallback) {
  return labels?.[key] || fallback || defaultLabels[key] || key;
}

export function formatEntityLabel(labels, key, count = 1) {
  const pluralKeyCandidates = [
    `${key}s`,
    key.endsWith('Entity') ? `${key.slice(0, -'Entity'.length)}Entities` : null
  ].filter(Boolean);

  return Number(count) === 1
    ? getLabel(labels, key)
    : pluralKeyCandidates.map((candidate) => labels?.[candidate]).find(Boolean) || getLabel(labels, key);
}
