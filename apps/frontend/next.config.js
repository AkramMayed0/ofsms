// Backend used by the /api and /local-files dev proxy below (override with BACKEND_URL)
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ofsms-documents.s3.amazonaws.com',
      },
    ],
  },

  allowedDevOrigins: ['192.168.1.130', '192.168.43.199', '*.trycloudflare.com'],

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/local-files/:path*',
        destination: `${BACKEND_URL}/local-files/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
