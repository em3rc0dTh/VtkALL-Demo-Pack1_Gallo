const maskEmail = (value?: string) => {
  if (!value) return undefined;
  const [name, domain] = value.split('@');
  if (!name || !domain) return undefined;
  return `${name.slice(0, 1)}***@${domain}`;
};

export const hasPhone = (value: unknown) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return /\d{7,}/.test(value.replace(/\D/g, ''));
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
};

export const hasEmail = (value: unknown) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return /@/.test(value);
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return false;
};

export const publicDisplayName = (source: any) => {
  return source?.displayName || source?.name || [source?.firstName, source?.lastName].filter(Boolean).join(' ') || undefined;
};

export const redactCustomer = (customer: any) => ({
  identityStatus: customer?._id ? 'identified' as const : 'anonymous' as const,
  customerId: customer?._id ? String(customer._id) : undefined,
  displayName: publicDisplayName(customer),
  knownFacts: {
    phoneKnown: hasPhone(customer?.contact?.phones || customer?.phone),
    emailKnown: hasEmail(customer?.contact?.emails || customer?.email),
  },
});

export const redactText = (value?: string) => {
  if (!value) return undefined;
  return String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (match) => maskEmail(match) || '[email]')
    .replace(/\b(?:\+?\d[\d\s-]{7,}\d)\b/g, '[phone]')
    .replace(/\b(?:dni|documento)\s*[:#]?\s*\d+\b/gi, '[document]');
};
