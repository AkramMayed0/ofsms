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
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/local-files/:path*',
        destination: 'http://localhost:4000/local-files/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
