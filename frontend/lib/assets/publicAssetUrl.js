const trimTrailingSlash = (value) => String(value || '').replace(/\/$/, '');

const publicAssetBaseUrl = trimTrailingSlash(
  process.env.NEXT_PUBLIC_DEMO_TEST_ASSET_BASE_URL || ''
);

export function resolvePublicAssetUrl(value) {
  if (!value) return '';
  const path = String(value).trim();
  if (!path) return '';
  if (/^https:\/\//i.test(path)) return path;
  if (path.startsWith('/uploads/') && publicAssetBaseUrl) return `${publicAssetBaseUrl}${path}`;
  return path;
}
