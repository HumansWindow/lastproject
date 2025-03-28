import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize ConfigService for environment variables
const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST') || 'localhost',
  port: parseInt(configService.get('DB_PORT') || '5432'),
  username: configService.get('DB_USERNAME') || 'Aliveadmin',
  password: configService.get('DB_PASSWORD') || 'password',
  database: configService.get('DB_DATABASE') || 'Alive-Db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get('DB_LOGGING') === 'true',
  ssl: configService.get('DB_SSL') === 'true',
});
