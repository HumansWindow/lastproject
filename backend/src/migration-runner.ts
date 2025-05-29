import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

async function runMigrations() {
  console.log('Initializing database connection...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'Aliveadmin',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'Alive-Db',
    entities: [join(__dirname, 'src/**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'src/migrations/**/*{.ts,.js}')],
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Database connection established successfully.');

    // Run migrations
    console.log('Running pending migrations...');
    const migrations = await dataSource.runMigrations();
    
    if (migrations.length > 0) {
      console.log(`Applied ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    } else {
      console.log('No pending migrations to run.');
    }

    await dataSource.destroy();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

runMigrations();
