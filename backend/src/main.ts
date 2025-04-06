import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { setupSwagger } from './swagger-config';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

// Load environment variables before any other imports
dotenv.config();
const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Increase Node.js memory limit to prevent out of memory errors
  // Set NODE_OPTIONS if not already set
  if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=4096`;
  }
  
  // Create the NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  
  // Apply global exception filter for consistent error handling
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  const configService = app.get(ConfigService);
  const preferredPort = configService.get<number>('PORT') || 3001;
  let port = preferredPort;
  let retries = 0;
  const maxRetries = 10;
  
  // Get the allowed origins from CORS config for reference in middleware
  const corsConfig = getCorsConfig();
  let corsOrigins: string[] = [];
  
  // Handle different types of origin configurations
  if (Array.isArray(corsConfig.origin)) {
    corsOrigins = corsConfig.origin as string[];
  } else if (typeof corsConfig.origin === 'string') {
    corsOrigins = [corsConfig.origin];
  } else if (corsConfig.origin === true) {
    corsOrigins = ['*'];
  }
  
  // Log CORS configuration for debugging
  logger.log(`CORS configuration: ${JSON.stringify(corsConfig)}`);
  logger.log(`Allowed origins: ${JSON.stringify(corsOrigins)}`);
  
  // Enable CORS with credentials support
  app.enableCors({
    origin: corsConfig.origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Setup Swagger documentation using our enhanced configuration
  setupSwagger(app);
  
  // Use cookie parser
  app.use(cookieParser());
  
  // Use Helmet for security headers with proper CSP to allow the frontend domain
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          connectSrc: [`'self'`].concat(corsOrigins), // Fixed: properly concatenate arrays
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
    }),
  );
  
  // Log all incoming requests for debugging
  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.url}`);
    
    // Handle CORS preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      logger.log('Processing preflight OPTIONS request');
      res.header('Access-Control-Allow-Origin', req.headers.origin as string || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Allow-Credentials', 'true'); 
      res.header('Access-Control-Max-Age', '86400');
    }
    
    next();
  });
  
  while (retries < maxRetries) {
    try {
      await app.listen(port);
      logger.log(`Application is running on: http://localhost:${port}`);
      logger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
      break;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is already in use, trying port ${port + 1}...`);
        port++;
        retries++;
      } else {
        logger.error(`Failed to start application: ${error.message}`);
        throw error;
      }
    }
  }
  
  if (retries >= maxRetries) {
    logger.error(`Could not find an available port after ${maxRetries} attempts`);
    throw new Error(`Could not find an available port after ${maxRetries} attempts`);
  }
}

// Helper function to get CORS configuration
function getCorsConfig() {
  // Get allowed origins from environment variable
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  // Default to development origins if none specified
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8000'];
  
  // Parse the comma-separated list of allowed origins
  const origins = allowedOrigins ? 
    allowedOrigins.split(',').map(origin => origin.trim()) : 
    defaultOrigins;
    
  return {
    origin: origins,
    credentials: true
  };
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, error.stack);
  // Give time for logs to be written before exiting
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
