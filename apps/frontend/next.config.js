/** @type {import('next').NextConfig} */
const nextConfig = {
  // Arabic-first, English secondary
  i18n: {
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
    localeDetection: false,
  },

  // Strict mode for catching issues early
  reactStrictMode: true,

  // Allow images from S3
  images: {
    domains: ['ofsms-documents.s3.amazonaws.com'],
  },

  // Allow dev access from local network
  allowedDevOrigins: ['192.168.1.130'],
};

module.exports = nextConfig; // ✅ Fixed: was module.exports = { nextConfig, ... }
