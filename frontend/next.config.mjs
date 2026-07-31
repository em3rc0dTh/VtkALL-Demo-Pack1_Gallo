/** @type {import('next').NextConfig} */
const backendInternalUrl = process.env.NEXT_BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';

const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendInternalUrl}/api/v1/:path*`,
      },
      {
        source: '/upload_utils/:path*',
        destination: `${backendInternalUrl}/upload_utils/:path*`,
      },
    ];
  },
};

export default nextConfig;
