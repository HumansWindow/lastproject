import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from './app.module';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { InitialSchema1714500000000 } from './migrations/1714500000000-InitialSchema';
import { WalletAuthFixes1714500000001 } from './migrations/1714500000001-WalletAuthFixes';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get<DataSource>(getDataSourceToken());

  try {
    console.log('Running all pending migrations...');
    const migrations = await dataSource.runMigrations({ transaction: 'all' });
    console.log(`${migrations.length} migration(s) completed successfully!`);
    
    for (const migration of migrations) {
      console.log(`- Applied migration: ${migration.name}`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();