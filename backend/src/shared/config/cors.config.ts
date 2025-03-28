import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS configuration for the application
 * Adjusts allowed origins based on environment
 */
export const getCorsConfig = (): CorsOptions => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://alivehuman.com',
        'https://app.alivehuman.com',
        // Add other production domains as needed
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Add other development domains as needed
      ];

  return {
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};
