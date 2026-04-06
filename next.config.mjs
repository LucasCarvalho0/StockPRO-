import withPWAInit from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita output standalone para Docker
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'exceljs', '@prisma/client'],
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === 'development', // Desabilita em dev para não cachear arquivos em desenvolvimento
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
