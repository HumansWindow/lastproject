#!/usr/bin/env node
require('dotenv').config();

const { DataSource } = require('typeorm');
const { join } = require('path');
const fs = require('fs');
const path = require('path');

/**
 * Initialize database with proper migrations
 */
async function initializeDatabase() {
  try {
    console.log('Starting database initialization with migrations...');
    
    // Create a TypeORM data source using environment variables
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'postgres',
      entities: [join(__dirname, '..', 'dist', '**', '*.entity.js')],
      migrations: [join(__dirname, '..', 'dist', 'migrations', '*.js')],
      synchronize: false,
      logging: true
    });
    
    // Initialize the data source
    await dataSource.initialize();
    console.log('Database connection established');

    // Run migrations
    console.log('Running migrations...');
    await dataSource.runMigrations({ transaction: 'all' });
    console.log('Migrations completed successfully!');

    // Close the connection
    await dataSource.destroy();
    console.log('Database connection closed');
    console.log('Database initialization complete');

    return { success: true };
  } catch (error) {
    console.error('Error initializing database: ', error);
    return { success: false, error };
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(result => {
      if (result.success) {
        console.log('Database setup successful. Your wallet authentication should now work properly.');
      } else {
        console.error('Database setup failed. Please check the error and try again.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error during database initialization:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };