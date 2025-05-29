import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS configuration for the application
 * Adjusts allowed origins based on environment and includes all necessary auth headers
 */
export const getCorsConfig = (): CorsOptions => {
  // Get allowed origins from environment variable
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  // Default origins based on environment
  const defaultOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://alivehuman.com',
        'https://app.alivehuman.com',
        'https://admin.alivehuman.com', // Add admin dashboard production domain
        // Add other production domains as needed
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://localhost:3003', // Add admin dashboard dev port
        'http://localhost:8000',
        'http://localhost:8080',
        'https://localhost:3000',  // Add HTTPS variant for secure local development
        'https://localhost:3003',  // Add HTTPS variant for admin dashboard
        'https://127.0.0.1:3000',  // Add HTTPS variant with IP
        // Allow any localhost origin for development
        /^http:\/\/localhost(:[0-9]+)?$/,
        /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/,
        'null',                    // Allow for file:// protocol in development
      ];
  
  // Use specified origins or fall back to defaults
  const origins = allowedOrigins
    ? allowedOrigins.split(',').map(origin => origin.trim())
    : defaultOrigins;

  return {
    origin: origins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 
      'Accept', 
      'Authorization', 
      'X-Requested-With',
      'X-Device-Fingerprint',
      'X-Wallet-Request',
      'X-Blockchain-Type',
      'x-debug-request',
      'x-request-id'
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  };
};
