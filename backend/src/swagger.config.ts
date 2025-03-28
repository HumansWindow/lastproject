// ...existing imports if needed...
import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Swagger configuration settings for API documentation
 */
export const swaggerConfig = {
  title: 'AliveHuman API',
  description: 'The AliveHuman platform API documentation',
  version: '1.0',
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication endpoints for login, registration, and token management'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Wallets',
      description: 'Blockchain wallet management endpoints'
    },
    {
      name: 'Referrals',
      description: 'Referral code generation and management endpoints'
    },
    {
      name: 'NFTs',
      description: 'NFT minting and management endpoints'
    }
  ]
};

export const buildSwaggerOptions = () =>
  new DocumentBuilder()
    .setTitle('AliveHuman API')
    .setDescription('AliveHuman platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    // ...existing or additional configuration...
    .build();
