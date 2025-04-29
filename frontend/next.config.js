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
  // Add crossOrigin to help with browser extension interactions
  crossOrigin: 'anonymous',
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          // Add additional headers to help with wallet extensions
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          }
        ],
      },
    ];
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
    // Removed the obsolete excludeDefaultMomentLocales option
    // Add Trust Wallet compatibility settings
    esmExternals: 'loose',
  },
  // Customize webpack to better handle injected scripts
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle browser extensions and injected scripts better
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        zlib: require.resolve('browserify-zlib'),
      };
      
      // Add polyfill for wallet extension compatibility
      config.plugins = [
        ...config.plugins,
        // Provide global polyfill for window.ethereum expected by wallet extensions
        new (require('webpack')).ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      ];

      // Add specific resolve for Trust Wallet
      config.resolve.alias = {
        ...config.resolve.alias,
        'bn.js': require.resolve('bn.js'),
        'buffer': require.resolve('buffer/'),
      };
    }
    return config;
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
