/**
 * Custom database initializer to avoid TypeORM's automatic schema synchronization
 * This script should run before the NestJS application starts
 */

const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Initialize database connection with specific settings to avoid schema sync issues
 */
async function initializeDatabase() {
  console.log('Custom database initialization started...');
  
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'Aliveadmin',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'Alive-Db',
      synchronize: false,
      logging: process.env.DB_LOGGING === 'true',
      ssl: process.env.DB_SSL === 'true',
      schema: 'public',
      // Only initialize connection without schema validation
      entitySkipConstructor: true
    });
    
    // Initialize the connection without trying to sync schema
    await dataSource.initialize();
    console.log('Database connection initialized successfully');
    
    // Extract schema metadata but don't perform any modifications
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.getTables();
    console.log(`Found ${tables.length} existing tables in database`);
    
    // Just check if the wallets table exists to log it
    const walletsTable = tables.find(t => t.name === 'wallets');
    if (walletsTable) {
      console.log('Wallets table found in database - will use existing schema');
    }
    
    // Close connection
    await dataSource.destroy();
    console.log('Database connection closed successfully');
    
    // Set environment variables to tell TypeORM to skip all schema operations
    process.env.TYPEORM_SYNCHRONIZE = 'false';
    process.env.TYPEORM_MIGRATIONS_RUN = 'false';
    process.env.TYPEORM_SCHEMA_VALIDATION = 'false';
    process.env.TYPEORM_SKIP_SCHEMA_CREATION = 'true';
    
    console.log('Custom database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error during database initialization:', error.message);
    return false;
  }
}

// Export for use in start-app.js
module.exports = { initializeDatabase };