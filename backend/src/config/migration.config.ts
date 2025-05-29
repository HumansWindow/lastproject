// Consolidated Migration Configuration
import { DataSource } from 'typeorm';
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

// Create a data source for migrations
export const dataSource = new DataSource({
  type: process.env.DB_TYPE as any || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false, // Always false for migrations to prevent accidental schema changes
  logging: process.env.DB_LOGGING === 'true' || true
});

// Default export for compatibility
export default dataSource;
