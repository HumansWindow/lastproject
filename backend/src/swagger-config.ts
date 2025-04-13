import { INestApplication, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

const logger = new Logger('Swagger');

/**
 * Sets up Swagger documentation for the application
 * 
 * @param app - NestJS application instance
 */
export function setupSwagger(app: INestApplication) {
  // Check if Swagger is enabled via environment variable
  const swaggerEnabled = process.env.SWAGGER_ENABLED?.toLowerCase() === 'true';
  
  if (!swaggerEnabled) {
    logger.log('Swagger documentation is disabled. Set SWAGGER_ENABLED=true in .env to enable it.');
    return;
  }

  try {
    const config = new DocumentBuilder()
      .setTitle('AliveHuman API')
      .setDescription('The comprehensive AliveHuman platform API documentation for frontend and mobile clients')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints for email and wallet-based authentication')
      .addTag('users', 'User management and profile operations')
      .addTag('wallets', 'Blockchain wallet management endpoints')
      .addTag('nfts', 'NFT management and marketplace operations')
      .addTag('referrals', 'Referral code generation and validation')
      .addTag('diary', 'Personal diary entry management')
      .addTag('token', 'SHAHI token operations including balances and minting')
      .addTag('staking', 'Token staking and reward management')
      .addTag('accounts', 'User account management operations')
      .addTag('base', 'Base API health checks and utilities')
      .build();

    const options: SwaggerDocumentOptions = {
      operationIdFactory: (
        controllerKey: string,
        methodKey: string,
      ) => methodKey,
      deepScanRoutes: true,
      ignoreGlobalPrefix: false
    };

    // Create Swagger document with error handling
    let document;
    try {
      document = SwaggerModule.createDocument(app, config, options);
      if (!document) {
        throw new Error('Failed to create Swagger document');
      }
    } catch (error) {
      logger.error(`Failed to create Swagger document: ${error.message}`, error.stack);
      // Don't block app startup if Swagger fails
      return;
    }
    
    // Setup the Swagger UI endpoint
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
      }
    });
    
    logger.log('✅ Swagger UI is available at /api/docs');
  } catch (error) {
    logger.error(`Error setting up Swagger: ${error.message}`, error.stack);
    // Don't block app startup if Swagger fails
  }
}
