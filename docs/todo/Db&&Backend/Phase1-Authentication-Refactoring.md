# Phase 1: Authentication System Refactoring

This document outlines the detailed step-by-step process for refactoring the authentication-related database tables and backend code. The goal is to standardize naming conventions, fix duplicate ID fields, and ensure proper relationships while maintaining all existing functionality, including blockchain wallet authentication.

## Table of Contents

1. [Current Issues](#current-issues)
2. [Implementation Standards](#implementation-standards)
3. [Pre-Implementation Steps](#pre-implementation-steps)
4. [Database Refactoring](#database-refactoring)
5. [Backend Code Refactoring](#backend-code-refactoring)
6. [Testing](#testing)
7. [Rollback Plan](#rollback-plan)
8. [Progress Update (May 8, 2025)](#progress-update)
9. [Checklist](#checklist)

## Current Issues

Based on analysis of the codebase, we've identified these issues in the authentication system:

1. **Inconsistent Column Naming Conventions**
   - Mix of camelCase and snake_case across tables:
     - `createdAt` vs `created_at`
     - `isActive` vs `is_active`
     - `walletAddress` vs `wallet_address`

2. **Duplicate ID Fields**
   - The `users` table has multiple ID fields: `id`, `userId`, and `user_id`
   - Similar duplication in other tables (`user_devices`, `wallets`, etc.)

3. **Duplicate Timestamp Fields**
   - Multiple timestamp formats: `createdAt` vs `created_at`

4. **Inconsistent Foreign Key Naming**
   - Different patterns for the same relationship (e.g., `user_id` vs `userId`)

5. **TypeORM Entity Inconsistencies**
   - Some entities use explicit column names, others rely on TypeORM defaults

## Implementation Standards

Going forward, we will adhere to these standards:

1. **Database Level**
   - Use `snake_case` for all database objects (tables, columns, constraints)
   - Primary keys will use UUID format
   - Foreign keys will follow the pattern `table_name_id` (e.g., `user_id` for references to the users table)
   - Timestamps will use `created_at` and `updated_at` naming

2. **TypeORM Entity Level**
   - Use `camelCase` for TypeORM entity properties
   - Add explicit `@Column({ name: 'snake_case_name' })` decorators for all properties
   - Standardize relationship decorators with proper column references

3. **Authentication Architecture**
   - Keep `users` table as the source of truth for authentication
   - Maintain proper relationships for web3 authentication (wallets, devices, sessions)

## Pre-Implementation Steps

### 1. Database Backup

```bash
#!/bin/bash
# Create a timestamped backup of the database
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="alive_db_backup_$TIMESTAMP.sql"
BACKUP_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup the database
PGPASSWORD=aliveHumans@2024 pg_dump -h localhost -p 5432 -U Aliveadmin -d Alive-Db > "$BACKUP_DIR/$BACKUP_FILE"

echo "Database backup created at $BACKUP_DIR/$BACKUP_FILE"
```

### 2. Current Schema Analysis

Run the following SQL to analyze the current schema of authentication tables:

```sql
SELECT 
    table_name, 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND (
        table_name = 'users' OR 
        table_name = 'user_devices' OR 
        table_name = 'user_sessions' OR 
        table_name = 'wallets' OR
        table_name = 'wallet_nonces' OR
        table_name = 'wallet_challenges' OR
        table_name = 'refresh_tokens'
    )
ORDER BY 
    table_name, 
    ordinal_position;
```

Save the output for reference during and after migration.

## Database Refactoring

### 1. Creating Migration SQL Script

```sql
-- Begin transaction
BEGIN;

-- 1. Fix users table
ALTER TABLE users DROP COLUMN IF EXISTS userId CASCADE;
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

-- 6. Fix refresh_tokens table
ALTER TABLE refresh_tokens RENAME COLUMN "expiresAt" TO expires_at;
ALTER TABLE refresh_tokens RENAME COLUMN "userId" TO user_id;
ALTER TABLE refresh_tokens RENAME COLUMN "createdAt" TO created_at;

-- 7. Fix wallet_nonces table
ALTER TABLE wallet_nonces RENAME COLUMN "walletAddress" TO wallet_address;
ALTER TABLE wallet_nonces RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE wallet_nonces RENAME COLUMN "expiresAt" TO expires_at;

-- Commit transaction
COMMIT;
```

### 2. Updating Foreign Key Constraints

```sql
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

-- 5. refresh_tokens to users
ALTER TABLE refresh_tokens
DROP CONSTRAINT IF EXISTS fk_refresh_tokens_users;

ALTER TABLE refresh_tokens
ADD CONSTRAINT fk_refresh_tokens_users
FOREIGN KEY (user_id)
REFERENCES users(id) ON DELETE CASCADE;

-- Commit transaction
COMMIT;
```

### 3. Verification SQL

Run the following SQL script to verify the changes:

```sql
-- Verify column renames were successful
SELECT 
    column_name, 
    table_name
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND (
        table_name = 'users' OR 
        table_name = 'user_devices' OR 
        table_name = 'user_sessions' OR 
        table_name = 'wallets' OR
        table_name = 'wallet_nonces' OR
        table_name = 'wallet_challenges' OR
        table_name = 'refresh_tokens'
    )
ORDER BY 
    table_name, 
    column_name;

-- Verify foreign key constraints
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (
        tc.table_name = 'users' OR 
        tc.table_name = 'user_devices' OR 
        tc.table_name = 'user_sessions' OR 
        tc.table_name = 'wallets' OR
        tc.table_name = 'wallet_nonces' OR
        tc.table_name = 'wallet_challenges' OR
        tc.table_name = 'refresh_tokens'
    )
ORDER BY tc.table_name, kcu.column_name;
```

## Backend Code Refactoring

### 1. Create TypeORM Entity Update Script

Create a JavaScript script that will generate the necessary TypeORM entity changes to match our new database schema:

```javascript
// Save as scripts/generate-entity-updates.js

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Define paths
const entitiesDir = path.join(__dirname, '..', 'backend', 'src');
const outputDir = path.join(__dirname, '..', 'backend', 'src', 'entities-updated');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Map of snake_case DB columns to camelCase entity properties
const columnMappings = {
  // Users entity
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'is_active': 'isActive',
  'is_admin': 'isAdmin',
  'is_verified': 'isVerified',
  'wallet_address': 'walletAddress',
  'referral_code': 'referralCode',
  'referred_by_id': 'referredById',
  'referral_tier': 'referralTier',
  'first_name': 'firstName',
  'last_name': 'lastName',
  'avatar_url': 'avatarUrl',
  'verification_token': 'verificationToken',
  'reset_password_token': 'resetPasswordToken',
  'reset_password_expires': 'resetPasswordExpires',
  'last_login_at': 'lastLoginAt',
  'last_login_ip': 'lastLoginIp',
  
  // UserDevice entity
  'device_id': 'deviceId',
  'device_type': 'deviceType',
  'os_name': 'osName',
  'os_version': 'osVersion',
  'browser_version': 'browserVersion',
  'last_used_at': 'lastUsedAt',
  'wallet_addresses': 'walletAddresses',
  'last_ip_address': 'lastIpAddress',
  'visit_count': 'visitCount',
  'last_seen_at': 'lastSeenAt',
  'first_seen': 'firstSeen',
  'last_seen': 'lastSeen',
  'is_approved': 'isApproved',
  
  // UserSession entity
  'wallet_id': 'walletId',
  'ip_address': 'ipAddress',
  'user_agent': 'userAgent',
  'expires_at': 'expiresAt',
  'ended_at': 'endedAt',
  
  // Wallet entity
  'private_key': 'privateKey',
  
  // WalletChallenge entity
  'wallet_address': 'walletAddress',
  'challenge_text': 'challengeText',
  'is_used': 'isUsed',
  
  // WalletNonce entity
  'wallet_address': 'walletAddress',
  
  // RefreshToken entity
  'user_id': 'userId',
  'expires_at': 'expiresAt'
};

// Function to find the relevant TypeORM entity files
async function findEntityFiles() {
  const files = [];
  
  // Define path patterns for entity files
  const entityPaths = [
    'users/entities/*.entity.ts',
    'wallets/entities/*.entity.ts',
    'auth/entities/*.entity.ts'
  ];
  
  // Find each file
  for (const pattern of entityPaths) {
    try {
      const { stdout } = await exec(`find ${entitiesDir} -path "*${pattern}"`);
      const foundFiles = stdout.trim().split('\n').filter(Boolean);
      files.push(...foundFiles);
    } catch (error) {
      console.error(`Error finding ${pattern} files:`, error);
    }
  }
  
  return files;
}

// Process entity files to add proper column decorators
async function processEntityFiles() {
  const files = await findEntityFiles();
  
  console.log('Found entity files:', files);
  
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Processing ${fileName}...`);
    
    // Process the file content
    for (const [dbColumn, entityProp] of Object.entries(columnMappings)) {
      // Check if the property exists in the entity
      if (content.includes(`${entityProp}:`)) {
        // Check if it already has a Column decorator with name
        const columnDecorRegex = new RegExp(`@Column\\(\\s*{[^}]*name:\\s*["']${dbColumn}["'][^}]*}\\s*\\)`, 'i');
        const simpleColumnDecorRegex = new RegExp(`@Column\\(\\s*[^{]?[^n]?[^a]?[^m]?[^e]?\\s*\\)\\s*${entityProp}:`, 'i');
        const anyColumnDecorRegex = new RegExp(`@Column\\([^)]*\\)\\s*${entityProp}:`, 'i');
        
        if (!columnDecorRegex.test(content)) {
          if (simpleColumnDecorRegex.test(content)) {
            // Replace simple @Column() with one that includes the name
            content = content.replace(
              simpleColumnDecorRegex,
              `@Column({ name: '${dbColumn}' })\n  ${entityProp}:`
            );
          } else if (anyColumnDecorRegex.test(content)) {
            // Already has some options, but not name
            content = content.replace(
              anyColumnDecorRegex,
              (match) => {
                // Extract current options
                const optionsMatch = match.match(/@Column\(([^)]*)\)/);
                if (optionsMatch && optionsMatch[1]) {
                  const options = optionsMatch[1].trim();
                  // If options is already an object
                  if (options.startsWith('{') && options.endsWith('}')) {
                    // Add name property to existing object
                    return match.replace(
                      options,
                      `${options.slice(0, -1)}${options.length > 2 ? ', ' : ''}name: '${dbColumn}'}`
                    );
                  } else {
                    // Convert non-object options to object with name
                    return match.replace(
                      options,
                      `{ ${options}, name: '${dbColumn}' }`
                    );
                  }
                }
                return match;
              }
            );
          }
        }
      }
    }
    
    // Write updated content to new file in output directory
    const relativePath = path.relative(entitiesDir, filePath);
    const outputPath = path.join(outputDir, relativePath);
    
    // Create directory structure if it doesn't exist
    const outputDirForFile = path.dirname(outputPath);
    if (!fs.existsSync(outputDirForFile)) {
      fs.mkdirSync(outputDirForFile, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content);
    console.log(`Updated entity saved to ${outputPath}`);
  }
}

async function main() {
  try {
    await processEntityFiles();
    console.log('Entity update preparation completed successfully!');
  } catch (error) {
    console.error('Error updating entity files:', error);
  }
}

main();
```

### 2. Implementing the Updated Entity Files

After running the script above and reviewing the generated files:

1. Back up the original entity files:

```bash
mkdir -p backup/entities
cp -r backend/src/users/entities backup/entities/users
cp -r backend/src/wallets/entities backup/entities/wallets
cp -r backend/src/auth/entities backup/entities/auth
```

2. Apply the changes to the original files:

```bash
# After reviewing the generated files, copy them back
cp -r backend/src/entities-updated/users/entities/* backend/src/users/entities/
cp -r backend/src/entities-updated/wallets/entities/* backend/src/wallets/entities/
cp -r backend/src/entities-updated/auth/entities/* backend/src/auth/entities/
```

### 3. Updating Service and Repository References

Scan for any hardcoded column names in services, repositories, and controllers:

```bash
grep -r "\.createdAt\|\.updatedAt\|\.isActive\|\.walletAddress\|\.deviceId\|\.userId" backend/src --include="*.ts" > column-references.txt
```

Review the output and update any hardcoded column references to use the Entity property names instead of direct database column names.

## Testing

### 1. Compile TypeScript

Run the TypeScript compiler to check for any type errors after the changes:

```bash
cd backend
npm run build
```

### 2. Unit Tests

Run the existing unit tests to verify functionality:

```bash
cd backend
npm test
```

### 3. Authentication Flow Tests

Test each authentication flow thoroughly:

1. **Standard Login**
   - Test standard email/password login
   - Verify session creation
   - Check refresh token functionality

2. **Web3 Wallet Authentication**
   - Test wallet connection
   - Verify challenge-response authentication
   - Check session and device linking

3. **Session Management**
   - Test session retrieval
   - Verify session timeout
   - Test multiple devices

### 4. API Endpoint Testing

Test all authentication-related API endpoints:

```bash
# Example with Curl
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password"}'

# Wallet authentication endpoints
curl -X POST http://localhost:3000/api/auth/wallet/connect -H "Content-Type: application/json" -d '{"address":"0x1234..."}'
curl -X POST http://localhost:3000/api/auth/wallet/authenticate -H "Content-Type: application/json" -d '{"address":"0x1234...","signature":"0xabc...","nonce":"123"}'
```

## Rollback Plan

### 1. Database Rollback

If issues are encountered, restore from the backup created at the beginning:

```bash
PGPASSWORD=aliveHumans@2024 psql -h localhost -p 5432 -U Aliveadmin -d Alive-Db < /path/to/backup/file.sql
```

### 2. Code Rollback

Restore the original entity files from the backup:

```bash
cp -r backup/entities/users/* backend/src/users/entities/
cp -r backup/entities/wallets/* backend/src/wallets/entities/
cp -r backup/entities/auth/* backend/src/auth/entities/
```

## Progress Update (May 8, 2025)

### Database Standardization Completed

1. **Created Database Backup**
   - Created a full backup of the database before making any changes
   - Backup stored at: `/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/db/alive_db_backup_20250508_133623.sql`

2. **Analyzed Database Schema**
   - Created and ran a schema analysis script to identify inconsistencies
   - Found multiple column naming conventions (camelCase vs snake_case) in authentication tables
   - Found duplicate ID columns in some tables (e.g., `id`, `userId`, and `user_id`)

3. **Standardized Column Names**
   - Created a robust SQL script to standardize all column names to snake_case
   - Script handles checking for column existence before attempting to rename
   - Properly handles cases where both camelCase and snake_case versions exist
   - Successfully standardized column names across all authentication-related tables
   - Reduced total column count from 122 to 89 columns by removing duplicates

4. **Fixed Database Triggers**
   - Identified triggers that were designed to sync between old camelCase and new snake_case columns
   - Successfully dropped obsolete sync triggers from:
     - user_sessions table (sync_user_id_trigger)
     - user_devices table (sync_device_id_trigger)
     - refresh_tokens table (sync_refresh_token_columns_trigger)
   - Eliminated legacy code that was causing errors during schema changes

5. **Standardized Column Types and Fixed Foreign Keys**
   - Identified and fixed a type mismatch between user_sessions.device_id (text) and user_devices.id (uuid)
   - Created a backup of orphaned user sessions (sessions referencing non-existent devices)
   - Safely converted the device_id column to UUID type
   - Added proper foreign key constraints between tables with CASCADE rules
   - Added appropriate indexes for better query performance

### Backend Code Updates Completed

1. **Created Scripts for Entity Updates**
   - Created scripts to identify TypeORM entity files requiring updates
   - Implemented a script to scan for hardcoded column references in services and repositories
   - Developed a process for safely updating all TypeORM entities with minimal risk

2. **Updated TypeORM Entity Files**
   - Added explicit `@Column({ name: 'snake_case_name' })` decorators to all entity properties
   - Fixed foreign key and relationship decorators in entity files
   - Fixed entity table name declarations with `@Entity({ name: 'table_name' })` 
   - Created comprehensive backups of all entity files before modification

3. **Fixed Service and Repository Code**
   - Updated service methods that were using hardcoded column references
   - Created compatibility layer for service methods that require compatibility with both naming conventions
   - Fixed query builders and raw SQL queries to use consistent snake_case column names
   - Implemented SQL query fixes for the MerkleService and other blockchain-related services

4. **Verification and Testing**
   - Created and executed a comprehensive entity verification script
   - Fixed 39 out of 40 entity files to properly match the standardized database schema
   - Conducted test runs to validate proper schema mapping
   - Fixed TypeORM entity build errors and validation issues

### Scripts Location

All refactoring scripts used are stored at:
`/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts/`

Key scripts:
- `update-entity-decorators.js`: Updates TypeORM entity decorators with proper column names
- `verify-entity-mappings.js`: Verifies entity mappings against database schema
- `update-service-compatibility.js`: Updates service methods for compatibility

## Checklist

### Database Preparation
- [x] Create full database backup
- [x] Analyze current schema
- [x] Create SQL migration scripts
- [x] Review foreign key constraints

### Database Migration
- [x] Run column standardization script
- [x] Update foreign key constraints
- [x] Verify schema changes
- [x] Test basic queries
- [x] Fix and remove problematic database triggers

### Backend Code Updates
- [x] Generate TypeORM entity updates
- [x] Back up original entity files
- [x] Apply entity changes
- [x] Update service/repository references
- [x] Fix build errors in TypeScript code
- [ ] Complete comprehensive code testing

### Testing
- [x] Run build process to identify issues
- [x] Fix issues with entity decorators and column references
- [ ] Run unit tests
- [ ] Test standard login flow
- [ ] Test wallet authentication flow
- [ ] Test session management
- [ ] Test all API endpoints
- [ ] Verify blockchain interactions

### Final Steps
- [x] Document changes made
- [ ] Update API documentation if needed
- [ ] Clean up temporary files and backups

## Support Materials

### Entity Relationships Summary

```
Users 1:N UserDevices
Users 1:N UserSessions
Users 1:N Wallets
Users 1:N RefreshTokens
UserDevices 1:N UserSessions
Wallets 1:1 WalletNonces
Wallets 1:N WalletChallenges
```

### Critical Database Columns to Preserve

**Users**:
- id (UUID, Primary Key)
- wallet_address (String, for Web3 authentication)

**Wallets**:
- id (UUID, Primary Key)
- address (String, wallet address)
- user_id (UUID, foreign key to users.id)

**UserDevices**:
- id (UUID, Primary Key)
- device_id (String, device identifier)
- user_id (UUID, foreign key to users.id)
- wallet_addresses (Text, JSON array of used wallet addresses)

**UserSessions**:
- id (UUID, Primary Key)
- user_id (UUID, foreign key to users.id)
- device_id (UUID, foreign key to user_devices.id)
- token (String, session token)
- expires_at (Timestamp)