/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
      domains: ['example.com'], // Add your image domains here
    },
    i18n: {
      locales: ['en', 'fr', 'es'], // Add your supported locales here
      defaultLocale: 'en',
    },
    webpack: (config, { isServer }) => {
      // Example of custom webpack configuration
      if (!isServer) {
        config.resolve.fallback.fs = false;
      }
      return config;
    },
  };
  
  export default nextConfig;
  