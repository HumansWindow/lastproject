import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    console.log('NestJS application initialized for migration');

    // The AppModule should import TypeOrmModule with migrations
    // We don't need to start the app, just initialize it to run migrations
    console.log('Migrations should have been applied during app initialization');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

bootstrap();
