#!/usr/bin/env node
// Apply fixes before starting the app
try {
  require('./fix-websockets');
} catch (error) {
  console.error('Error applying WebSocket fixes:', error);
}

// Custom database initialization to prevent schema sync issues
const { initializeDatabase } = require('./database-init');

// Run the database initializer first
(async () => {
  console.log('Initializing database connection...');
  
  // Disable ALL TypeORM synchronization explicitly via env variables
  console.log('Explicitly disabling ALL TypeORM synchronization options');
  process.env.TYPEORM_SYNCHRONIZE = 'false';
  process.env.TYPEORM_MIGRATIONS_RUN = 'false';
  process.env.TYPEORM_ENTITIES_SKIP_SYNC = 'true'; 
  process.env.TYPEORM_SKIP_SCHEMA_SYNC = 'true';
  // Force TypeORM to use existing schema without validation
  process.env.TYPEORM_SCHEMA_CHECK = 'false';
  
  try {
    // Initialize database with our custom function
    await initializeDatabase();
    
    // After database initialization succeeds, start the application
    process.env.NODE_PATH = './node_modules';
    require('module').Module._initPaths();
    require('./dist/main');
  } catch (error) {
    console.error('Failed to initialize database or start application:', error);
    process.exit(1);
  }
})();

