export const sanitizeHermesTelemetry = (value: unknown) => {
  const text = JSON.stringify(value ?? {});
  return text
    .replace(/Bearer\s+[A-Za-z0-9._:-]+/g, 'Bearer [REDACTED]')
    .replace(/HERMES_API_KEY=[^\s"]+/g, 'HERMES_API_KEY=[REDACTED]');
};
