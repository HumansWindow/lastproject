// Consolidated TypeORM Configuration
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Ensure dotenv is loaded
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found, using default environment variables');
  dotenv.config();
}

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || '5432'}`);
console.log(`Database: ${process.env.DB_DATABASE || 'Alive-Db'}`);
console.log(`Username: ${process.env.DB_USERNAME || 'Aliveadmin'}`);

// TypeORM Configuration for the application
export const typeOrmConfig: DataSourceOptions = {
  type: process.env.DB_TYPE as any || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: !isProduction, // Set to false in production
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create a DataSource instance for CLI tools and external usage
export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  // Override entities and migrations path for root-level execution
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false // Always false for DataSource to prevent accidental schema changes
});

// Default export for compatibility with TypeORM CLI
export default AppDataSource;
