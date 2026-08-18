const normalizeBasePath = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
};

export const PUBLIC_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH || '');

export function withBasePath(value) {
  if (!value) return PUBLIC_BASE_PATH || '';
  const path = String(value).trim();
  if (!path || /^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!PUBLIC_BASE_PATH) return normalizedPath;
  if (normalizedPath === PUBLIC_BASE_PATH || normalizedPath.startsWith(`${PUBLIC_BASE_PATH}/`)) {
    return normalizedPath;
  }

  return `${PUBLIC_BASE_PATH}${normalizedPath}`;
}
