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
    .setDescription('The AliveHuman API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('wallets', 'Wallet management endpoints')
    .addTag('nfts', 'NFT management endpoints')
    .addTag('referrals', 'Referral program endpoints')
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (
      controllerKey: string,
      methodKey: string,
    ) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api/docs', app, document);
  
  console.log('Swagger UI is available at /api/docs');
}
