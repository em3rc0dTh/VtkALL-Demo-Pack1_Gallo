/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['*.ngrok-free.dev', 'localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
      {
        source: '/upload_utils/:path*',
        destination: 'http://127.0.0.1:4000/upload_utils/:path*',
      },
    ];
  },
};

export default nextConfig;
