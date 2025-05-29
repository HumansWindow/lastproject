/**
 * Configuration Test Script
 * 
 * This script tests that the consolidated configuration files
 * work properly by attempting to import and use them.
 */

// Set up environment for testing
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs'
  }
});

console.log('Testing TypeORM Configuration...');
try {
  // Try importing the main TypeORM config file
  const typeormConfig = require('../src/config/typeorm.config');
  console.log('✅ TypeORM Config import successful');
  console.log('  Database:', typeormConfig.typeOrmConfig.database);
  console.log('  Host:', typeormConfig.typeOrmConfig.host);
} catch (error) {
  console.error('❌ TypeORM Config import failed:', error.message);
}

console.log('\nTesting Migration Configuration...');
try {
  // Try importing the migration config file
  const migrationConfig = require('../src/config/migration.config');
  console.log('✅ Migration Config import successful');
  console.log('  Database:', migrationConfig.dataSource.options.database);
} catch (error) {
  console.error('❌ Migration Config import failed:', error.message);
}

console.log('\nTesting Root-Level Migration Config...');
try {
  // Try importing the root-level JS migration config
  const rootMigrationConfig = require('../migration.config');
  console.log('✅ Root Migration Config (JS) import successful');
  console.log('  Database:', rootMigrationConfig.dataSource.options.database);
} catch (error) {
  console.error('❌ Root Migration Config import failed:', error.message);
}

console.log('\nTesting Symlink for TypeORM Config...');
try {
  // Try importing via the symlink
  const symlinkConfig = require('../typeorm.config');
  console.log('✅ Symlink TypeORM Config import successful');
} catch (error) {
  console.error('❌ Symlink TypeORM Config import failed:', error.message);
}

console.log('\nConfiguration tests complete!');
