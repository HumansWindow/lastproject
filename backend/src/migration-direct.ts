import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

// Configure TypeORM data source
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  try {
    // Initialize data source
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    // Run migrations
    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    // Log applied migrations
    if (migrations.length > 0) {
      console.log(`Successfully applied ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    } else {
      console.log('No migrations were applied. All migrations might be already applied.');
    }

    // Close connection
    await AppDataSource.destroy();
    console.log('Connection has been closed.');

  } catch (error) {
    console.error('Error during migration process:', error);
    process.exit(1);
  }
}

// Run the migration function
runMigrations();
