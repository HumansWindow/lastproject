const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
      },
    ];
  },
  // Prevent static generation for WebSocketDemo pages
  experimental: {
    // Only generate pages that don't need WebSocketContext during build
    excludeDefaultMomentLocales: true,
  },
  // Custom configuration to exclude specific paths from static export
  async exportPathMap(defaultPathMap) {
    // Filter out the WebSocketDemo pages
    const filteredPaths = {};
    
    for (const [path, page] of Object.entries(defaultPathMap)) {
      if (!path.includes('/WebSocketDemo')) {
        filteredPaths[path] = page;
      }
    }
    
    return filteredPaths;
  }
};

module.exports = nextConfig;
