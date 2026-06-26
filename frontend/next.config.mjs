/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.ngrok-free.dev', 'localhost:3000', '192.168.18.92', '192.168.18.41'],
  experimental: {
    middlewareClientMaxBodySize: '50mb',
    turbo: {
      root: '..',
    },
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const backendUrl = process.env.BACKEND_INTERNAL_URL || (isProd ? 'http://backend:4000' : 'http://127.0.0.1:4000');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/upload_utils/:path*',
        destination: `${backendUrl}/upload_utils/:path*`,
      },
    ];
  },
};

export default nextConfig;
