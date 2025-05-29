#!/usr/bin/env node

/**
 * Main script to run the entire database refactoring process
 * This script handles:
 * 1. Creating database backups
 * 2. Finding issues with entity files
 * 3. Fixing primary column issues
 * 4. Standardizing column names in entity files
 * 5. Running SQL standardization scripts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { spawnSync } = require('child_process');

// Configuration
const scriptDir = __dirname;
const projectRoot = path.join(__dirname, '../..');
const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.join(projectRoot, 'backups/db', backupTimestamp);
const sqlDir = path.join(scriptDir, 'sql');

// Create necessary directories
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (!fs.existsSync(sqlDir)) {
  fs.mkdirSync(sqlDir, { recursive: true });
}

// SQL scripts for database standardization
const createBackupSql = `
-- Create a backup table for each table we're modifying
SELECT 'CREATE TABLE backup_' || tablename || ' AS SELECT * FROM ' || tablename || ';'
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_devices', 'user_sessions', 'wallets', 'wallet_challenges', 'referral_codes', 'profile');
`;

const standardizeColumnNamesSql = `
-- Begin transaction
BEGIN;

-- 1. Fix users table
ALTER TABLE users DROP COLUMN IF EXISTS userId CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE users RENAME COLUMN "isActive" TO is_active;
ALTER TABLE users RENAME COLUMN "isAdmin" TO is_admin;
ALTER TABLE users RENAME COLUMN "isVerified" TO is_verified;
ALTER TABLE users RENAME COLUMN "walletAddress" TO wallet_address;
ALTER TABLE users RENAME COLUMN "referralCode" TO referral_code;
ALTER TABLE users RENAME COLUMN "referredById" TO referred_by_id;
ALTER TABLE users RENAME COLUMN "referralTier" TO referral_tier;
ALTER TABLE users RENAME COLUMN "verificationToken" TO verification_token;
ALTER TABLE users RENAME COLUMN "resetPasswordToken" TO reset_password_token;
ALTER TABLE users RENAME COLUMN "resetPasswordExpires" TO reset_password_expires;
ALTER TABLE users RENAME COLUMN "firstName" TO first_name;
ALTER TABLE users RENAME COLUMN "lastName" TO last_name;
ALTER TABLE users RENAME COLUMN "avatarUrl" TO avatar_url;

-- 2. Fix user_devices table
ALTER TABLE user_devices DROP COLUMN IF EXISTS userId CASCADE;
ALTER TABLE user_devices RENAME COLUMN "deviceId" TO device_id;
ALTER TABLE user_devices RENAME COLUMN "deviceType" TO device_type;
ALTER TABLE user_devices RENAME COLUMN "osName" TO os_name;
ALTER TABLE user_devices RENAME COLUMN "osVersion" TO os_version;
ALTER TABLE user_devices RENAME COLUMN "browserVersion" TO browser_version;
ALTER TABLE user_devices RENAME COLUMN "isActive" TO is_active;
ALTER TABLE user_devices RENAME COLUMN "lastUsedAt" TO last_used_at;
ALTER TABLE user_devices RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE user_devices RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE user_devices RENAME COLUMN "walletAddresses" TO wallet_addresses;
ALTER TABLE user_devices RENAME COLUMN "lastIpAddress" TO last_ip_address;
ALTER TABLE user_devices RENAME COLUMN "visitCount" TO visit_count;
ALTER TABLE user_devices RENAME COLUMN "lastSeenAt" TO last_seen_at;
ALTER TABLE user_devices RENAME COLUMN "firstSeen" TO first_seen;
ALTER TABLE user_devices RENAME COLUMN "lastSeen" TO last_seen;
ALTER TABLE user_devices RENAME COLUMN "isApproved" TO is_approved;

-- 3. Fix user_sessions table
ALTER TABLE user_sessions DROP COLUMN IF EXISTS userId CASCADE;
ALTER TABLE user_sessions RENAME COLUMN "deviceId" TO device_id;
ALTER TABLE user_sessions RENAME COLUMN "walletId" TO wallet_id;
ALTER TABLE user_sessions RENAME COLUMN "ipAddress" TO ip_address;
ALTER TABLE user_sessions RENAME COLUMN "userAgent" TO user_agent;
ALTER TABLE user_sessions RENAME COLUMN "expiresAt" TO expires_at;
ALTER TABLE user_sessions RENAME COLUMN "isActive" TO is_active;
ALTER TABLE user_sessions RENAME COLUMN "endedAt" TO ended_at;
ALTER TABLE user_sessions RENAME COLUMN "createdAt" TO created_at;
-- Remove duplicate columns that were created during prior partial migrations
ALTER TABLE user_sessions DROP COLUMN IF EXISTS isactive CASCADE;
ALTER TABLE user_sessions DROP COLUMN IF EXISTS endedat CASCADE;

-- 4. Fix wallets table
ALTER TABLE wallets RENAME COLUMN "privateKey" TO private_key;
ALTER TABLE wallets RENAME COLUMN "isActive" TO is_active;
ALTER TABLE wallets RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE wallets RENAME COLUMN "updatedAt" TO updated_at;

-- 5. Fix wallet_challenges table
ALTER TABLE wallet_challenges RENAME COLUMN "challengeText" TO challenge_text;
ALTER TABLE wallet_challenges RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE wallet_challenges RENAME COLUMN "expiresAt" TO expires_at;
ALTER TABLE wallet_challenges RENAME COLUMN "isUsed" TO is_used;
ALTER TABLE wallet_challenges RENAME COLUMN "walletAddress" TO wallet_address;

-- 6. Fix referral_codes table
ALTER TABLE referral_codes RENAME COLUMN "isActive" TO is_active;
ALTER TABLE referral_codes RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE referral_codes RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE referral_codes RENAME COLUMN "userId" TO user_id;
ALTER TABLE referral_codes RENAME COLUMN "referrerId" TO referrer_id;

-- 7. Fix profiles table
ALTER TABLE profiles RENAME COLUMN "userId" TO user_id;
ALTER TABLE profiles RENAME COLUMN "firstName" TO first_name;
ALTER TABLE profiles RENAME COLUMN "lastName" TO last_name;
ALTER TABLE profiles RENAME COLUMN "displayName" TO display_name;
ALTER TABLE profiles RENAME COLUMN "avatarUrl" TO avatar_url;
ALTER TABLE profiles RENAME COLUMN "uniqueId" TO unique_id;
ALTER TABLE profiles RENAME COLUMN "postalCode" TO postal_code;
ALTER TABLE profiles RENAME COLUMN "dateFormat" TO date_format;
ALTER TABLE profiles RENAME COLUMN "timeFormat" TO time_format;
ALTER TABLE profiles RENAME COLUMN "phoneNumber" TO phone_number;
ALTER TABLE profiles RENAME COLUMN "twitterHandle" TO twitter_handle;
ALTER TABLE profiles RENAME COLUMN "instagramHandle" TO instagram_handle;
ALTER TABLE profiles RENAME COLUMN "linkedinProfile" TO linkedin_profile;
ALTER TABLE profiles RENAME COLUMN "telegramHandle" TO telegram_handle;
ALTER TABLE profiles RENAME COLUMN "locationVisibility" TO location_visibility;
ALTER TABLE profiles RENAME COLUMN "profileVisibility" TO profile_visibility;
ALTER TABLE profiles RENAME COLUMN "emailNotifications" TO email_notifications;
ALTER TABLE profiles RENAME COLUMN "pushNotifications" TO push_notifications;
ALTER TABLE profiles RENAME COLUMN "completeLater" TO complete_later;
ALTER TABLE profiles RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE profiles RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE profiles RENAME COLUMN "lastLocationUpdate" TO last_location_update;

-- Commit transaction
COMMIT;
`;

const fixForeignKeysSql = `
-- Begin transaction
BEGIN;

-- Ensure foreign key constraints are properly defined
-- 1. user_devices to users
ALTER TABLE user_devices
DROP CONSTRAINT IF EXISTS fk_user_devices_users;

ALTER TABLE user_devices
ADD CONSTRAINT fk_user_devices_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- 2. user_sessions to users
ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS fk_user_sessions_users;

ALTER TABLE user_sessions
ADD CONSTRAINT fk_user_sessions_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- 3. user_sessions to user_devices
ALTER TABLE user_sessions
DROP CONSTRAINT IF EXISTS fk_user_sessions_devices;

ALTER TABLE user_sessions
ADD CONSTRAINT fk_user_sessions_devices
FOREIGN KEY (device_id)
REFERENCES user_devices(id) ON DELETE CASCADE;

-- 4. wallets to users
ALTER TABLE wallets
DROP CONSTRAINT IF EXISTS fk_wallets_users;

ALTER TABLE wallets
ADD CONSTRAINT fk_wallets_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- 5. referral_codes to users
ALTER TABLE referral_codes
DROP CONSTRAINT IF EXISTS fk_referral_codes_users;

ALTER TABLE referral_codes
ADD CONSTRAINT fk_referral_codes_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- 6. profiles to users
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS fk_profiles_users;

ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- Commit transaction
COMMIT;
`;

// Write SQL scripts to files
fs.writeFileSync(path.join(sqlDir, 'create-backup-tables.sql'), createBackupSql);
fs.writeFileSync(path.join(sqlDir, 'standardize-column-names.sql'), standardizeColumnNamesSql);
fs.writeFileSync(path.join(sqlDir, 'fix-foreign-keys.sql'), fixForeignKeysSql);

/**
 * Create a full backup of the database
 */
function createDatabaseBackup() {
  console.log('Creating database backup...');
  
  const backupFile = path.join(backupDir, 'full-database-backup.sql');
  
  try {
    execSync(
      `PGPASSWORD=aliveHumans@2024 pg_dump -h localhost -p 5432 -U Aliveadmin -d Alive-Db > ${backupFile}`,
      { stdio: 'inherit' }
    );
    console.log(`Database backup created at ${backupFile}`);
    return true;
  } catch (error) {
    console.error('Error creating database backup:', error.message);
    return false;
  }
}

/**
 * Run a SQL script on the database
 */
function runSqlScript(scriptPath, description) {
  console.log(`Running SQL script: ${description}...`);
  
  try {
    execSync(
      `PGPASSWORD=aliveHumans@2024 psql -h localhost -p 5432 -U Aliveadmin -d Alive-Db -f ${scriptPath}`,
      { stdio: 'inherit' }
    );
    console.log(`Successfully ran SQL script: ${description}`);
    return true;
  } catch (error) {
    console.error(`Error running SQL script ${description}:`, error.message);
    return false;
  }
}

/**
 * Run a JavaScript script
 */
function runJsScript(scriptPath) {
  console.log(`Running script: ${path.basename(scriptPath)}...`);
  
  try {
    const result = spawnSync('node', [scriptPath], { 
      stdio: 'inherit',
      env: { ...process.env },
      cwd: process.cwd()
    });
    
    if (result.error) {
      throw result.error;
    }
    
    if (result.status !== 0) {
      throw new Error(`Script exited with status code ${result.status}`);
    }
    
    console.log(`Successfully ran script: ${path.basename(scriptPath)}`);
    return true;
  } catch (error) {
    console.error(`Error running script ${path.basename(scriptPath)}:`, error.message);
    return false;
  }
}

/**
 * Main function to run the refactoring process
 */
async function main() {
  console.log('Starting database refactoring process...');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Backup directory: ${backupDir}`);
  
  // Step 1: Create database backup
  if (!createDatabaseBackup()) {
    console.error('Failed to create database backup. Aborting refactoring process.');
    process.exit(1);
  }
  
  // Step 2: Create backup tables for important entities
  if (!runSqlScript(path.join(sqlDir, 'create-backup-tables.sql'), 'Create backup tables')) {
    console.warn('Warning: Could not create backup tables. Continuing with caution...');
  }
  
  // Step 3: Find issues with entity files
  console.log('Finding issues with entity files...');
  if (!runJsScript(path.join(scriptDir, 'find-missing-primary-columns.js'))) {
    console.warn('Warning: Could not complete entity issue detection. Continuing with caution...');
  }
  
  // Step 4: Fix entity files with primary column issues
  console.log('Fixing entity files with primary column issues...');
  if (!runJsScript(path.join(scriptDir, 'fix-all-entity-columns.js'))) {
    console.warn('Warning: Could not complete entity fixes. Some entities might still have issues.');
  }
  
  // Step 5: Standardize column names in entity files
  console.log('Standardizing column names in entity files...');
  if (!runJsScript(path.join(scriptDir, 'standardize-entity-column-names.js'))) {
    console.warn('Warning: Could not complete column name standardization in entities.');
  }
  
  // Step 6: Run SQL standardization scripts
  if (!runSqlScript(path.join(sqlDir, 'standardize-column-names.sql'), 'Standardize column names')) {
    console.error('Failed to standardize column names in database. Refactoring incomplete.');
    process.exit(1);
  }
  
  // Step 7: Fix foreign key constraints
  if (!runSqlScript(path.join(sqlDir, 'fix-foreign-keys.sql'), 'Fix foreign keys')) {
    console.warn('Warning: Could not fully fix foreign key constraints.');
  }
  
  console.log('\n✅ Database refactoring process completed!');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('Please verify the changes and restart your application.');
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in refactoring process:', error);
  process.exit(1);
});