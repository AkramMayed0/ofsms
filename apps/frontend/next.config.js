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
};

module.exports = nextConfig;
