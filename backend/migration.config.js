// CommonJS wrapper for migration.config.ts
require('dotenv').config();
const path = require('path');
const { DataSource } = require('typeorm');

// Import the TypeScript config if available (for ts-node)
let importedDataSource;
try {
  importedDataSource = require('./src/config/migration.config').dataSource;
  console.log('Using TypeScript migration config');
} catch (e) {
  console.log('TypeScript config not available, using direct configuration');
}

// Create a data source for migrations - Same as the TS version
const dataSource = importedDataSource || new DataSource({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [path.join(__dirname, 'src', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src', 'migrations', '**', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true' || true
});

module.exports = { dataSource };
