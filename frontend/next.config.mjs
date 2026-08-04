/** @type {import('next').NextConfig} */
const backendInternalUrl = process.env.NEXT_BACKEND_INTERNAL_URL || 'http://localhost:4000';

const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendInternalUrl}/api/v1/:path*`,
      },
      {
        source: '/api/demo-test/:path*',
        destination: `${backendInternalUrl}/api/demo-test/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendInternalUrl}/uploads/:path*`,
      },
      {
        source: '/upload_utils/:path*',
        destination: `${backendInternalUrl}/upload_utils/:path*`,
      },
    ];
  },
};

export default nextConfig;
