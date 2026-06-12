/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.ngrok-free.dev', 'localhost:3000'],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';
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
