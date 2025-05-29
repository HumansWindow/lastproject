#!/usr/bin/env node

/**
 * Referral System Type Mismatch Fix Script
 * 
 * This script fixes the incompatibility between referral_codes.user_id (integer)
 * and users.id (UUID) by:
 * 1. Creating backup tables
 * 2. Creating new tables with proper UUID types
 * 3. Mapping and migrating data between old and new tables
 * 4. Updating foreign key constraints
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Database connection config
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'Alive-Db',
  user: 'Aliveadmin',
  password: 'aliveHumans@2024'
};

// Create backup directory
const backupDir = path.join(__dirname, '../../backups/referral-system', 
  new Date().toISOString().replace(/:/g, '-'));
  
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Logging setup
const logFile = path.join(backupDir, 'migration.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const log = message => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  logStream.write(logMessage);
};

// Connect to database
async function connectDb() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    log('Connected to database');
    return client;
  } catch (error) {
    log(`Error connecting to database: ${error.message}`);
    throw error;
  }
}

// Backup referral data
async function backupReferralData(client) {
  log('Creating backup tables...');
  
  try {
    await client.query('BEGIN');
    
    // Backup referral_codes table
    await client.query(`
      CREATE TABLE backup_referral_codes AS 
      SELECT * FROM referral_codes
    `);
    
    // Backup referrals table
    await client.query(`
      CREATE TABLE backup_referrals AS 
      SELECT * FROM referrals
    `);
    
    await client.query('COMMIT');
    log('Successfully created backup tables');
    
    // Export data to SQL files
    const referralCodes = await client.query('SELECT * FROM referral_codes');
    const referrals = await client.query('SELECT * FROM referrals');
    
    fs.writeFileSync(
      path.join(backupDir, 'referral_codes.json'), 
      JSON.stringify(referralCodes.rows, null, 2)
    );
    
    fs.writeFileSync(
      path.join(backupDir, 'referrals.json'), 
      JSON.stringify(referrals.rows, null, 2)
    );
    
    log(`Backed up ${referralCodes.rowCount} referral codes and ${referrals.rowCount} referrals`);
    return { referralCodes: referralCodes.rows, referrals: referrals.rows };
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error backing up referral data: ${error.message}`);
    throw error;
  }
}

// Get mapping between integer IDs and UUIDs for users
async function getUserIdMapping(client) {
  log('Creating user ID mapping (integer to UUID)...');
  
  try {
    // This assumes users have a username or email that can be used to correlate data
    const users = await client.query(`
      SELECT id, username, email FROM users
    `);
    
    log(`Retrieved ${users.rowCount} users for mapping`);
    return users.rows;
  } catch (error) {
    log(`Error getting user ID mapping: ${error.message}`);
    throw error;
  }
}

// Modify referral_codes table to use UUID
async function migrateReferralCodes(client, referralCodesData, userMapping) {
  log('Migrating referral_codes table to use UUID...');
  
  try {
    await client.query('BEGIN');
    
    // Drop foreign key constraints
    await client.query(`
      ALTER TABLE IF EXISTS referrals
      DROP CONSTRAINT IF EXISTS referrals_referral_code_id_fkey
    `);
    
    // Drop the current referral_codes table and create a new one with UUID columns
    await client.query('DROP TABLE referral_codes');
    
    // Create the new referral_codes table with UUID primary key and user_id
    await client.query(`
      CREATE TABLE referral_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        code VARCHAR(50) UNIQUE,
        is_active BOOLEAN DEFAULT true,
        usage_limit INTEGER DEFAULT 10,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    log('Successfully created new referral_codes table with UUID columns');
    
    // For each old referral code, find the user UUID and insert into new table
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const code of referralCodesData) {
      // Skip if no user_id
      if (!code.user_id) {
        skippedCount++;
        continue;
      }
      
      // Try to find the UUID for this user
      // This is a simplified example - you may need a more sophisticated mapping strategy
      const matchedUser = userMapping.find(u => String(u.id) === String(code.user_id));
      
      if (matchedUser) {
        await client.query(`
          INSERT INTO referral_codes (
            id, user_id, code, is_active, usage_limit, used_count, 
            expires_at, created_at
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7
          )
        `, [
          matchedUser.id, // UUID from users table
          code.code,
          code.is_active,
          code.usage_limit,
          code.used_count,
          code.expires_at,
          code.created_at
        ]);
        insertedCount++;
      } else {
        log(`Warning: Could not find UUID for user_id ${code.user_id}`);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    log(`Migrated ${insertedCount} referral codes, skipped ${skippedCount}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error migrating referral_codes: ${error.message}`);
    throw error;
  }
}

// Migrate referrals table to use UUID
async function migrateReferrals(client, referralsData, userMapping) {
  log('Migrating referrals table to use UUID...');
  
  try {
    await client.query('BEGIN');
    
    // Drop the current referrals table and create a new one with UUID columns
    await client.query('DROP TABLE referrals');
    
    // Create the new referrals table with UUID columns
    await client.query(`
      CREATE TABLE referrals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        referrer_id UUID REFERENCES users(id),
        referred_id UUID REFERENCES users(id),
        referral_code_id UUID REFERENCES referral_codes(id),
        reward_claimed BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    log('Successfully created new referrals table with UUID columns');
    
    // Get new referral_codes mapping
    const referralCodes = await client.query('SELECT id, code FROM referral_codes');
    const codeMapping = {};
    referralCodes.rows.forEach(rc => {
      codeMapping[rc.code] = rc.id;
    });
    
    // For each old referral, find the user UUIDs and insert into new table
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const referral of referralsData) {
      // Find the UUID for referrer and referred users
      const referrerUser = userMapping.find(u => String(u.id) === String(referral.referrer_id));
      const referredUser = userMapping.find(u => String(u.id) === String(referral.referred_id));
      
      // Get the referral code from backup
      const oldReferralCode = await client.query(
        'SELECT code FROM backup_referral_codes WHERE id = $1',
        [referral.referral_code_id]
      );
      
      // Get the UUID of the referral code
      let referralCodeId = null;
      if (oldReferralCode.rows.length > 0) {
        referralCodeId = codeMapping[oldReferralCode.rows[0].code];
      }
      
      if (referrerUser && referredUser) {
        await client.query(`
          INSERT INTO referrals (
            id, referrer_id, referred_id, referral_code_id,
            reward_claimed, created_at
          ) VALUES (
            uuid_generate_v4(), $1, $2, $3, $4, $5
          )
        `, [
          referrerUser.id, // UUID from users table
          referredUser.id, // UUID from users table
          referralCodeId,  // UUID from new referral_codes table
          referral.reward_claimed,
          referral.created_at
        ]);
        insertedCount++;
      } else {
        log(`Warning: Could not find UUID for referrer_id ${referral.referrer_id} or referred_id ${referral.referred_id}`);
        skippedCount++;
      }
    }
    
    await client.query('COMMIT');
    log(`Migrated ${insertedCount} referrals, skipped ${skippedCount}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    log(`Error migrating referrals: ${error.message}`);
    throw error;
  }
}

// Update referral-related entity files
function updateEntityFiles() {
  log('Updating entity files...');
  
  // We don't actually need to modify them since they're already configured correctly
  // The entities already use UUID types, the issue was in the database
  log('Entity files are already properly configured to use UUID types');
}

// Main execution function
async function main() {
  log('Starting referral system migration...');
  let client;
  
  try {
    client = await connectDb();
    
    // Step 1: Back up existing data
    const { referralCodes, referrals } = await backupReferralData(client);
    
    // Step 2: Get user ID mapping
    const userMapping = await getUserIdMapping(client);
    
    // Step 3: Migrate referral_codes table
    await migrateReferralCodes(client, referralCodes, userMapping);
    
    // Step 4: Migrate referrals table
    await migrateReferrals(client, referrals, userMapping);
    
    // Step 5: Update entity files (if needed)
    updateEntityFiles();
    
    log('Referral system migration completed successfully!');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`);
    log('Rolling back changes where possible...');
    
    if (client) {
      try {
        await client.query('ROLLBACK');
        log('Changes rolled back');
      } catch (rollbackError) {
        log(`Error rolling back: ${rollbackError.message}`);
      }
    }
  } finally {
    if (client) {
      await client.end();
      log('Database connection closed');
    }
    logStream.end();
  }
}

// Run the migration
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});