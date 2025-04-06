import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

/**
 * Sets up Swagger documentation for the application
 * 
 * @param app - NestJS application instance
 */
export function setupSwagger(app: INestApplication) {
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
  };

  const document = SwaggerModule.createDocument(app, config, options);
  
  // Setup the Swagger UI endpoint
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    }
  });
  
  console.log('✅ Swagger UI is available at /api/docs');
}
