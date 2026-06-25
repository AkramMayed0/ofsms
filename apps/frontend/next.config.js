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

  allowedDevOrigins: ['192.168.1.130'],
};

module.exports = nextConfig; // ✅ Fixed: was module.exports = { nextConfig, ... }
