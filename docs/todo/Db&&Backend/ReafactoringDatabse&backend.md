# Database and Backend Refactoring Plan

## Implementation Decisions (UPDATED)

Based on project requirements, we have decided on the following standards:

1. **Naming Conventions**:
   - **Database**: Use `snake_case` for all database objects (tables, columns, constraints)
   - **Backend Code**: Use `camelCase` for all TypeORM entities and code variables

2. **Authentication System**:
   - The `users` table will remain the primary authentication table
   - Web3 authentication will continue to use `wallets`, `user_devices`, and `user_sessions` tables

3. **ID Standardization**:
   - All primary keys will use **UUID** format
   - Foreign keys will follow `table_name_id` naming pattern in snake_case

4. **Data Segregation**:
   - `users` table: Core authentication and identity data
   - `profiles` table: Extended profile information

## Database Structure Issues

After analyzing the current database structure in Alive-Db, the following issues have been identified:

### 1. Duplicate User Information Across Tables

User information is duplicated across multiple tables:

- **users** and **profiles** tables contain duplicate fields:
  - `first_name`
  - `last_name`
  - `email`
  - `password`
  - `avatar_url`

### 2. Inconsistent Column Naming Conventions

- Mix of camelCase and snake_case:
  - `createdAt` vs `created_at`
  - `isActive` vs `is_active`
  - `walletAddress` vs `wallet_address`
  - `deviceId` vs `device_id`

### 3. Duplicate ID Fields

- Several tables contain multiple ID fields:
  - `users` table has: `id`, `userId`, and `user_id`

### 4. Duplicate Timestamp Fields

- Multiple timestamp formats:
  - `createdAt` vs `created_at`
  - `updatedAt` vs `updated_at`
  - `expiresAt` vs `expires_at`

### 5. Redundant Columns

- Some tables have fields that store the same information with different names:
  - `wallet_challenges` table has: `challenge_text` and `challenge`
  - `user_devices` table has multiple duplicate fields

### 6. Mixed Data Types for Primary Keys

- Some tables use UUID, others use serial integers for primary keys

## Immediate Action Items (Next Few Hours)

### 1. Create Database Backup Script

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

Save this as `scripts/create-db-backup.sh` and make it executable.

### 2. Database Schema Standardization SQL Script

```sql
-- Create this as scripts/standardize-db-schema.sql

-- Begin transaction
BEGIN;

-- 1. Fix users table
-- Step 1: Remove duplicate id columns and standardize primary id
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

-- 5. Fix refresh_tokens table
ALTER TABLE refresh_tokens RENAME COLUMN "expiresAt" TO expires_at;
ALTER TABLE refresh_tokens RENAME COLUMN "userId" TO user_id;
ALTER TABLE refresh_tokens RENAME COLUMN "createdAt" TO created_at;

-- Commit transaction
COMMIT;
```

### 3. TypeORM Entity Update Script (Node.js)

Create a script to generate the necessary TypeORM entity changes:

```javascript
// Save as scripts/generate-entity-updates.js

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const entitiesDir = path.join(__dirname, '..', 'backend', 'src', 'entities');
const outputDir = path.join(__dirname, '..', 'backend', 'src', 'entities', 'updated');

// Ensure output directory exists
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
  
  // UserDevices entity
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
  
  // UserSessions entity
  'wallet_id': 'walletId',
  'ip_address': 'ipAddress',
  'user_agent': 'userAgent',
  'expires_at': 'expiresAt',
  'ended_at': 'endedAt',
  
  // Wallets entity
  'private_key': 'privateKey'
};

// Process entity files to add proper column decorators
async function processEntityFiles() {
  const files = fs.readdirSync(entitiesDir).filter(file => file.endsWith('.ts') && !file.includes('.spec.'));
  
  for (const file of files) {
    const filePath = path.join(entitiesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Process the file content based on entities we're focusing on
    if (
      file === 'user.entity.ts' || 
      file === 'user-device.entity.ts' || 
      file === 'user-session.entity.ts' || 
      file === 'wallet.entity.ts' ||
      file === 'refresh-token.entity.ts'
    ) {
      console.log(`Processing ${file}...`);
      
      // Add column decorators for each property
      for (const [dbColumn, entityProp] of Object.entries(columnMappings)) {
        // Check if the property exists in the entity
        if (content.includes(`${entityProp}:`)) {
          // Check if it already has a Column decorator with name
          const columnDecorRegex = new RegExp(`@Column\\(\\s*{[^}]*name:\\s*["']${dbColumn}["'][^}]*}\\s*\\)`, 'i');
          const simpleColumnDecorRegex = new RegExp(`@Column\\(\\s*\\)\\s*${entityProp}:`, 'i');
          
          if (!columnDecorRegex.test(content) && simpleColumnDecorRegex.test(content)) {
            // Replace simple @Column() with one that includes the name
            content = content.replace(
              simpleColumnDecorRegex,
              `@Column({ name: '${dbColumn}' })\n  ${entityProp}:`
            );
          }
        }
      }
      
      // Write updated content to new file
      const outputPath = path.join(outputDir, file);
      fs.writeFileSync(outputPath, content);
      console.log(`Updated entity saved to ${outputPath}`);
    }
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

### 4. Testing SQL Script

```sql
-- Create this as scripts/test-db-changes.sql

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
        table_name = 'refresh_tokens'
    )
ORDER BY 
    table_name, 
    column_name;
```

## Refactoring Checklist

### Phase 1: Database Schema Planning ✓

- [x] **Decide on Primary Naming Convention**
  - ✓ Database: Use `snake_case` for SQL standard compliance
  - ✓ Backend: Use `camelCase` for TypeORM entities

- [x] **Establish Relationship Model**
  - ✓ `users` table as the source of truth for authentication
  - ✓ `profiles` table for extended user information
  - [ ] Create entity relationship diagram (ERD) for the refactored schema

- [x] **Standardize ID Strategy**
  - ✓ All primary keys will use UUID format
  - ✓ Foreign keys will follow `table_name_id` naming pattern

### Phase 2: Database Migration Strategy

- [ ] **Create Database Backup**
  - [ ] Run the backup script provided above
  - [ ] Verify backup integrity

- [ ] **Run Column Standardization Script**
  - [ ] Execute the SQL script provided above
  - [ ] Run the verification script to confirm changes
  - [ ] Fix any issues that arise during migration

### Phase 3: Backend Refactoring

- [ ] **Update Entity Models**
  - [ ] Run the entity update generation script provided above
  - [ ] Review generated entity updates
  - [ ] Apply changes to the actual entity files

- [ ] **Authentication System Verification**
  - [ ] Test authentication flows with updated schema:
    - [ ] Standard login
    - [ ] Web3 wallet authentication
    - [ ] Session management

## Implementation Steps (Next Few Hours)

1. **Backup the Current Database (15 minutes)**
   ```bash
   # Create the backup script
   mkdir -p scripts
   cat > scripts/create-db-backup.sh << 'EOF'
   #!/bin/bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   BACKUP_FILE="alive_db_backup_$TIMESTAMP.sql"
   BACKUP_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/db"
   mkdir -p "$BACKUP_DIR"
   PGPASSWORD=aliveHumans@2024 pg_dump -h localhost -p 5432 -U Aliveadmin -d Alive-Db > "$BACKUP_DIR/$BACKUP_FILE"
   echo "Database backup created at $BACKUP_DIR/$BACKUP_FILE"
   EOF
   
   # Make it executable and run it
   chmod +x scripts/create-db-backup.sh
   ./scripts/create-db-backup.sh
   ```

2. **Create the Schema Standardization Script (30 minutes)**
   ```bash
   # Create the SQL script
   cat > scripts/standardize-db-schema.sql << 'EOF'
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

   -- 5. Fix refresh_tokens table
   ALTER TABLE refresh_tokens RENAME COLUMN "expiresAt" TO expires_at;
   ALTER TABLE refresh_tokens RENAME COLUMN "userId" TO user_id;
   ALTER TABLE refresh_tokens RENAME COLUMN "createdAt" TO created_at;

   -- Commit transaction
   COMMIT;
   EOF
   ```

3. **Apply Database Changes (15 minutes)**
   ```bash
   # Run the SQL script to standardize the schema
   PGPASSWORD=aliveHumans@2024 psql -h localhost -p 5432 -U Aliveadmin -d Alive-Db -f scripts/standardize-db-schema.sql
   ```

4. **Verify Database Changes (15 minutes)**
   ```bash
   # Create verification script
   cat > scripts/verify-db-changes.sql << 'EOF'
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
           table_name = 'refresh_tokens'
       )
   ORDER BY 
       table_name, 
       column_name;
   EOF

   # Run verification
   PGPASSWORD=aliveHumans@2024 psql -h localhost -p 5432 -U Aliveadmin -d Alive-Db -f scripts/verify-db-changes.sql
   ```

5. **Generate TypeORM Entity Updates (30 minutes)**
   ```bash
   # Create the Node.js script
   cat > scripts/generate-entity-updates.js << 'EOF'
   // TypeORM entity update script as shown above
   EOF

   # Run the script
   cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject
   node scripts/generate-entity-updates.js
   ```

6. **Test Authentication System (45 minutes)**
   Update a single entity manually and test the authentication flow to ensure everything works correctly before proceeding with all entities.

## Specific Table Refactoring Plans

### Users Table

**Current Issues:**
- Duplicate fields with profiles table
- Inconsistent naming (camelCase and snake_case)
- Multiple ID fields (id, userId, user_id)

**Solution:**
- Make users table the source of truth for core user data
- Move extended profile data to profiles table
- Standardize to snake_case column names
- Keep only one id field (uuid)

### User Devices Table

**Current Issues:**
- Duplicate fields with different naming conventions
- Mix of snake_case and camelCase

**Solution:**
- Consolidate duplicate fields
- Standardize naming convention
- Properly link to users table with consistent foreign key

### Refresh Tokens Table

**Current Issues:**
- Duplicate fields (expiresAt/expires_at, userId/user_id)
- Backup table structure doesn't match main table

**Solution:**
- Standardize column naming
- Align backup table structure with main table

### Wallet Tables

**Current Issues:**
- Inconsistent relationship with users
- Duplicate authentication data

**Solution:**
- Standardize wallet-to-user relationship
- Consolidate wallet authentication mechanisms

## Timeline and Resource Allocation

1. **Planning Phase** - 1 week
   - Schema design and documentation
   - Migration strategy development

2. **Development Phase** - 2-3 weeks
   - Database migration scripts
   - Backend code refactoring
   - Test suite updates

3. **Testing Phase** - 1-2 weeks
   - Comprehensive testing in staging environment
   - Performance benchmarking

4. **Deployment Phase** - 1 week
   - Production deployment with monitoring
   - Immediate bug fixes and adjustments

## Risks and Mitigation

- **Data Loss Risk**: Mitigate with comprehensive backups and testing
- **Downtime Risk**: Plan deployment during low-traffic periods
- **Performance Issues**: Benchmark and optimize before full deployment
- **Integration Failures**: Test thoroughly with all system components