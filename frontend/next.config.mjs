/** @type {import('next').NextConfig} */
const backendInternalUrl = process.env.NEXT_BACKEND_INTERNAL_URL || 'http://localhost:4000';
const basePath = (() => {
  const raw = String(process.env.NEXT_PUBLIC_BASE_PATH || '').trim();
  if (!raw || raw === '/') return '';
  return `/${raw.replace(/^\/+|\/+$/g, '')}`;
})();
const appPath = (path) => `${basePath}${path}`;

const nextConfig = {
  basePath,
  async rewrites() {
    return [
      {
        source: appPath('/api/v1/:path*'),
        destination: `${backendInternalUrl}/api/v1/:path*`,
        basePath: false,
      },
      {
        source: appPath('/api/demo-test/:path*'),
        destination: `${backendInternalUrl}/api/demo-test/:path*`,
        basePath: false,
      },
      {
        source: appPath('/uploads/:path*'),
        destination: `${backendInternalUrl}/uploads/:path*`,
        basePath: false,
      },
      {
        source: appPath('/upload_utils/:path*'),
        destination: `${backendInternalUrl}/upload_utils/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
