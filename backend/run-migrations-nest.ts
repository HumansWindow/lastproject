import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

// Load environment variables
dotenv.config();

async function runMigrations() {
  try {
    // Create a NestJS application instance
    console.log('Creating NestJS application instance...');
    const app = await NestFactory.create(AppModule);
    console.log('NestJS application instance created');

    // Get TypeORM data source from app
    console.log('Getting TypeORM DataSource from application...');
    const dataSource = app.get(DataSource);
    console.log('DataSource retrieved');

    // Run pending migrations
    console.log('Running pending migrations...');
    const migrations = await dataSource.runMigrations();
    if (migrations.length > 0) {
      console.log(`Applied ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    } else {
      console.log('No pending migrations to run');
    }

    // Show tables
    console.log('Checking database tables...');
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Current tables in database:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Close the application
    await app.close();
    console.log('Application closed');
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
