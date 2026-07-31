export interface HermesHealthResult {
  ok: true;
  service: string;
  version: string;
  agent: string;
  mode: string;
  knowledgeFiles: number;
  skillFiles: number;
  missingSkills: string[];
  access: {
    backend: false;
    temporal: false;
    mongo: false;
    terminal: false;
    write: false;
  };
}

export const parseHermesHealth = (value: unknown): HermesHealthResult | undefined => {
  const body = value as Partial<HermesHealthResult> | undefined;
  if (!body || body.ok !== true) return undefined;
  if (typeof body.service !== 'string' || typeof body.version !== 'string') return undefined;
  if (typeof body.agent !== 'string' || typeof body.mode !== 'string') return undefined;
  if (typeof body.knowledgeFiles !== 'number' || typeof body.skillFiles !== 'number') return undefined;
  if (!Array.isArray(body.missingSkills)) return undefined;
  const access = body.access as HermesHealthResult['access'] | undefined;
  if (!access || access.backend !== false || access.temporal !== false || access.mongo !== false || access.terminal !== false || access.write !== false) {
    return undefined;
  }
  return body as HermesHealthResult;
};
