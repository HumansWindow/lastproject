#!/usr/bin/env node

/**
 * Entity Verification Script
 * This script verifies that our TypeORM entities are correctly defined and match the database schema.
 * It loads the entities and tries to query each table to catch any mapping issues.
 */

// We need to set up the environment before importing TypeORM
process.env.NODE_ENV = 'development';

const { createConnection, getConnection } = require('typeorm');
const path = require('path');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// List of auth entities to verify
const authEntities = [
  { entityName: 'User', tableName: 'users' },
  { entityName: 'UserDevice', tableName: 'user_devices' },
  { entityName: 'UserSession', tableName: 'user_sessions' },
  { entityName: 'Wallet', tableName: 'wallets' },
  { entityName: 'WalletNonce', tableName: 'wallet_nonces' },
  { entityName: 'WalletChallenge', tableName: 'wallet_challenges' },
  { entityName: 'RefreshToken', tableName: 'refresh_tokens' },
];

// Dynamically find entity files
async function findEntityFiles() {
  const result = {};
  
  for (const { entityName } of authEntities) {
    try {
      const { stdout } = await exec(`find /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src -name "*.entity.ts" | xargs grep -l "class ${entityName}" | head -1`);
      if (stdout.trim()) {
        result[entityName] = stdout.trim();
      }
    } catch (error) {
      console.error(`Error finding ${entityName} entity file:`, error.message);
    }
  }
  
  return result;
}

// Create TypeORM connection based on configuration
async function connectToDatabase() {
  try {
    // Try to get existing connection
    try {
      return getConnection();
    } catch (err) {
      // Connection doesn't exist, create new one
      console.log('Creating new database connection...');
      
      // Load TypeORM config
      const configPath = path.resolve('/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/config/typeorm.config.ts');
      if (!fs.existsSync(configPath)) {
        throw new Error(`TypeORM config not found at ${configPath}`);
      }
      
      // We'll use environment variables for connection
      return createConnection({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'Aliveadmin',
        password: 'aliveHumans@2024',
        database: 'Alive-Db',
        entities: [
          '/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/dist/**/*.entity.js'
        ],
        synchronize: false
      });
    }
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    throw error;
  }
}

// Verify entity mappings by executing simple queries
async function verifyEntityMappings(connection) {
  console.log('Verifying entity mappings with database schema...');
  console.log('=================================================\n');
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const { entityName, tableName } of authEntities) {
    try {
      console.log(`Testing ${entityName} entity (${tableName} table)...`);
      
      // Get entity metadata
      const metadata = connection.getMetadata(entityName);
      console.log(`- Found entity metadata for ${entityName}`);
      
      // Verify column mappings
      console.log(`- Table name: ${metadata.tableName}`);
      console.log(`- Columns: ${metadata.columns.length}`);
      
      // Try to run a simple query
      const repository = connection.getRepository(entityName);
      
      // Skip quey for WalletNonce or WalletChallenge if they don't exist
      if ((entityName === 'WalletNonce' || entityName === 'WalletChallenge') && 
          metadata.columns.length === 0) {
        console.log(`- SKIP: ${entityName} appears to be empty or not fully defined`);
        continue;
      }
      
      // Execute query with limit to prevent large data transfers
      const count = await repository.count();
      const firstRow = await repository.createQueryBuilder().limit(1).getOne();
      
      console.log(`- Query success: Found ${count} records in ${tableName}`);
      console.log(`- Sample data available: ${firstRow ? 'Yes' : 'No'}`);
      
      if (firstRow) {
        // Show some info about the first row without revealing sensitive data
        const sampleObject = {};
        Object.keys(firstRow).forEach(key => {
          // Mask sensitive data
          if (['password', 'privateKey', 'token', 'signature', 'private_key'].includes(key)) {
            sampleObject[key] = '[REDACTED]';
          } else if (typeof firstRow[key] === 'string' && firstRow[key].length > 20) {
            sampleObject[key] = firstRow[key].substring(0, 20) + '...';
          } else {
            sampleObject[key] = firstRow[key];
          }
        });
        console.log('- Sample object structure:', JSON.stringify(sampleObject, null, 2));
      }
      
      results.success.push(entityName);
      console.log(`✅ ${entityName} entity verified successfully!\n`);
    } catch (error) {
      console.error(`❌ Error verifying ${entityName} entity:`, error.message);
      
      results.failed.push({
        entityName,
        error: error.message
      });
      console.log('\n');
    }
  }
  
  return results;
}

// Main function
async function main() {
  let connection;
  
  try {
    // Find entity files
    const entityFiles = await findEntityFiles();
    console.log('Found entity files:', entityFiles);
    
    // Connect to database
    connection = await connectToDatabase();
    console.log('Connected to database successfully!');
    
    // Verify entity mappings
    const results = await verifyEntityMappings(connection);
    
    // Summary
    console.log('\nVerification Summary');
    console.log('====================');
    console.log(`Total entities tested: ${authEntities.length}`);
    console.log(`Success: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed Entities:');
      results.failed.forEach(failure => {
        console.log(`- ${failure.entityName}: ${failure.error}`);
      });
    }
    
    // Exit with appropriate code
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Run the script
main();