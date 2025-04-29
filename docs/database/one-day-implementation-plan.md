# One-Day Database Fix Implementation Plan

## Overview

This accelerated plan focuses on implementing the most critical database fixes within a single day. It prioritizes issues that provide the most value with the least risk and leverages existing tools in your project to expedite the process.

## Key Objectives

1. Fix the most critical ID field inconsistencies without breaking the application
2. Implement reliable sync triggers to maintain data integrity
3. Improve query performance through index optimization
4. Document the standardization approach for future maintenance

## Timeline

| Time | Activity |
|------|----------|
| 09:00-10:00 | **Setup & Preparation** - Create backups and test environment |
| 10:00-11:30 | **Critical Triggers** - Implement synchronization triggers |
| 11:30-13:00 | **Index Optimization** - Fix redundant and missing indexes |
| 13:00-13:30 | **Lunch Break** |
| 13:30-15:30 | **Backend Code Updates** - Update critical repositories and services |
| 15:30-17:00 | **Testing & Validation** - Test changes and fix any issues |
| 17:00-18:00 | **Deployment & Documentation** - Apply changes to production and update docs |

## Expedited Implementation Steps

### 1. Setup & Preparation (1 hour)

#### 1.1 Create Database Backup

```bash
# Create backup directory if it doesn't exist
mkdir -p /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups

# Create a timestamped backup
BACKUP_FILE="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/alive_db_rapid_fix_$(date +%Y%m%d%H%M%S).sql"
pg_dump -U Aliveadmin -h localhost -p 5432 -d Alive-Db > $BACKUP_FILE
echo "Backup created at $BACKUP_FILE"
```

#### 1.2 Setup Test Environment

```bash
# Create test database (if doesn't exist)
PGPASSWORD=aliveHumans@2024 psql -U Aliveadmin -h localhost -p 5432 -c "DROP DATABASE IF EXISTS alive_db_test;"
PGPASSWORD=aliveHumans@2024 psql -U Aliveadmin -h localhost -p 5432 -c "CREATE DATABASE alive_db_test WITH TEMPLATE Alive-Db;"
```

#### 1.3 Leverage Existing Fix Scripts

I notice you have a script called `fix-id-inconsistencies.ts` in your project. Let's first see what it does:

```bash
# Examine existing fix script
cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend
cat fix-id-inconsistencies.ts
```

### 2. Implement Critical Sync Triggers (1.5 hours)

Create a script with essential synchronization triggers for the most critical tables:

```sql
-- File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/migrations/rapid-fix-triggers.sql

-- Check if sync functions already exist and drop them if needed
DROP FUNCTION IF EXISTS sync_user_id_fields() CASCADE;
DROP FUNCTION IF EXISTS sync_wallet_id_fields() CASCADE;
DROP FUNCTION IF EXISTS sync_timestamp_fields() CASCADE;

-- User ID fields synchronization
CREATE OR REPLACE FUNCTION sync_user_id_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync the three ID fields in users table
    IF NEW.id IS NOT NULL AND NEW.userId IS NULL THEN
        NEW.userId := NEW.id;
    ELSIF NEW.userId IS NOT NULL AND NEW.id IS NULL THEN
        NEW.id := NEW.userId;
    END IF;
    
    IF NEW.id IS NOT NULL AND NEW.user_id IS NULL THEN
        NEW.user_id := NEW.id;
    ELSIF NEW.user_id IS NOT NULL AND NEW.id IS NULL THEN
        NEW.id := NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with multiple ID fields
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS sync_user_id_fields_trigger ON users;
    
    -- Create new trigger
    CREATE TRIGGER sync_user_id_fields_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_user_id_fields();
    
    -- Add more tables with user ID fields as needed
    -- User Devices
    DROP TRIGGER IF EXISTS sync_user_id_fields_trigger ON user_devices;
    CREATE TRIGGER sync_user_id_fields_trigger
    BEFORE INSERT OR UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION sync_user_id_fields();
    
    -- User Sessions
    DROP TRIGGER IF EXISTS sync_user_id_fields_trigger ON user_sessions;
    CREATE TRIGGER sync_user_id_fields_trigger
    BEFORE INSERT OR UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION sync_user_id_fields();
    
    -- Refresh Tokens
    DROP TRIGGER IF EXISTS sync_user_id_fields_trigger ON refresh_tokens;
    CREATE TRIGGER sync_user_id_fields_trigger
    BEFORE INSERT OR UPDATE ON refresh_tokens
    FOR EACH ROW EXECUTE FUNCTION sync_user_id_fields();
END;
$$;

-- Wallet IDs synchronization for user_sessions
CREATE OR REPLACE FUNCTION sync_wallet_id_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.walletId IS NOT NULL AND NEW.wallet_id IS NULL THEN
        NEW.wallet_id := NEW.walletId;
    ELSIF NEW.wallet_id IS NOT NULL AND NEW.walletId IS NULL THEN
        NEW.walletId := NEW.wallet_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_sessions
DROP TRIGGER IF EXISTS sync_wallet_id_fields_trigger ON user_sessions;
CREATE TRIGGER sync_wallet_id_fields_trigger
BEFORE INSERT OR UPDATE ON user_sessions
FOR EACH ROW EXECUTE FUNCTION sync_wallet_id_fields();

-- Timestamps synchronization
CREATE OR REPLACE FUNCTION sync_timestamp_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if the table has both timestamp formats
    IF TG_TABLE_NAME = 'users' OR TG_TABLE_NAME = 'wallets' OR TG_TABLE_NAME = 'user_devices' THEN
        -- createdAt <-> created_at
        IF NEW.createdAt IS NOT NULL AND NEW.created_at IS NULL THEN
            NEW.created_at := NEW.createdAt;
        ELSIF NEW.created_at IS NOT NULL AND NEW.createdAt IS NULL THEN
            NEW.createdAt := NEW.created_at;
        END IF;
        
        -- updatedAt <-> updated_at
        IF NEW.updatedAt IS NOT NULL AND NEW.updated_at IS NULL THEN
            NEW.updated_at := NEW.updatedAt;
        ELSIF NEW.updated_at IS NOT NULL AND NEW.updatedAt IS NULL THEN
            NEW.updatedAt := NEW.updated_at;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add timestamp triggers to critical tables
DO $$
BEGIN
    -- Users table
    DROP TRIGGER IF EXISTS sync_timestamp_fields_trigger ON users;
    CREATE TRIGGER sync_timestamp_fields_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_timestamp_fields();
    
    -- Wallets table
    DROP TRIGGER IF EXISTS sync_timestamp_fields_trigger ON wallets;
    CREATE TRIGGER sync_timestamp_fields_trigger
    BEFORE INSERT OR UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION sync_timestamp_fields();
    
    -- User devices
    DROP TRIGGER IF EXISTS sync_timestamp_fields_trigger ON user_devices;
    CREATE TRIGGER sync_timestamp_fields_trigger
    BEFORE INSERT OR UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION sync_timestamp_fields();
END;
$$;

-- Verify the triggers are created
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    action_statement,
    action_orientation,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

### 3. Optimize Indexes (1.5 hours)

```sql
-- File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/migrations/rapid-index-fix.sql

-- Remove redundant indexes after verifying they're not needed
DROP INDEX IF EXISTS idx_user_wallet_address;
DROP INDEX IF EXISTS idx_wallets_address;

-- Add missing high-value indexes
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

-- Optimize wallet address indexing (case-insensitive)
DROP INDEX IF EXISTS idx_wallet_address_dupe;
CREATE INDEX IF NOT EXISTS idx_wallet_address_lower_unified ON wallets(LOWER(address));

-- Add missing index for user lookup by referral code
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referralCode);

-- Optimize user session lookup by user
CREATE INDEX IF NOT EXISTS idx_sessions_active_by_user ON user_sessions (user_id) WHERE is_active = true;

-- Check missing indexes on large tables
SELECT
    schemaname || '.' || relname AS table,
    seq_scan,
    idx_scan,
    seq_scan - idx_scan AS missed_scans,
    CASE 
        WHEN seq_scan + idx_scan = 0 THEN 0
        ELSE round(100.0 * idx_scan / (seq_scan + idx_scan), 2) 
    END AS index_use_percent
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY missed_scans DESC;

-- List all indexes for verification
SELECT
    indexname,
    tablename,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
ORDER BY
    tablename,
    indexname;
```

### 4. Backend Code Updates (2 hours)

Create a simplified compatibility layer to handle both naming conventions in critical files:

```typescript
// File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/shared/utils/id-compatibility.ts

/**
 * A utility to make entity objects compatible with both ID naming conventions
 * during the transition period.
 */
export function compatibilizeIDs<T extends Record<string, any>>(entity: T): T {
  if (!entity) return entity;
  
  // Clone the entity to avoid modifying the original
  const result = { ...entity };
  
  // ID fields
  if ('id' in result && result.id !== null && result.id !== undefined) {
    result.userId = result.userId || result.id;
    result.user_id = result.user_id || result.id;
  } else if ('userId' in result && result.userId !== null && result.userId !== undefined) {
    result.id = result.id || result.userId;
    result.user_id = result.user_id || result.userId;
  } else if ('user_id' in result && result.user_id !== null && result.user_id !== undefined) {
    result.id = result.id || result.user_id;
    result.userId = result.userId || result.user_id;
  }
  
  // Wallet ID fields
  if ('walletId' in result && result.walletId !== null && result.walletId !== undefined) {
    result.wallet_id = result.wallet_id || result.walletId;
  } else if ('wallet_id' in result && result.wallet_id !== null && result.wallet_id !== undefined) {
    result.walletId = result.walletId || result.wallet_id;
  }
  
  // Timestamp fields
  if ('createdAt' in result && result.createdAt !== null && result.createdAt !== undefined) {
    result.created_at = result.created_at || result.createdAt;
  } else if ('created_at' in result && result.created_at !== null && result.created_at !== undefined) {
    result.createdAt = result.createdAt || result.created_at;
  }
  
  if ('updatedAt' in result && result.updatedAt !== null && result.updatedAt !== undefined) {
    result.updated_at = result.updated_at || result.updatedAt;
  } else if ('updated_at' in result && result.updated_at !== null && result.updated_at !== undefined) {
    result.updatedAt = result.updatedAt || result.updated_at;
  }
  
  return result;
}

/**
 * Apply ID compatibility to an array of entities
 */
export function compatibilizeIDsArray<T extends Record<string, any>>(entities: T[]): T[] {
  if (!entities) return entities;
  return entities.map(compatibilizeIDs);
}

/**
 * Make sure query conditions work with both naming conventions
 */
export function expandIDConditions(conditions: Record<string, any>): Record<string, any> {
  if (!conditions) return conditions;
  
  const result = { ...conditions };
  
  // ID field conditions
  if ('id' in result) {
    result.userId = result.userId || result.id;
    result.user_id = result.user_id || result.id;
  } else if ('userId' in result) {
    result.id = result.id || result.userId;
    result.user_id = result.user_id || result.userId;
  } else if ('user_id' in result) {
    result.id = result.id || result.user_id;
    result.userId = result.userId || result.user_id;
  }
  
  // Wallet ID conditions
  if ('walletId' in result) {
    result.wallet_id = result.wallet_id || result.walletId;
  } else if ('wallet_id' in result) {
    result.walletId = result.walletId || result.wallet_id;
  }
  
  return result;
}
```

Create a script to patch the most critical repositories (users, wallets, sessions):

```typescript
// File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/patch-critical-repos.ts
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const REPO_PATH = path.join(__dirname, '..', 'src');
const PATCH_IMPORT = "import { compatibilizeIDs, compatibilizeIDsArray, expandIDConditions } from '../shared/utils/id-compatibility';\n";

const FILES_TO_PATCH = [
  '**/user.repository.ts',
  '**/wallet.repository.ts',
  '**/user-sessions.repository.ts',
  '**/profile.repository.ts',
  '**/auth.service.ts',
  '**/user.service.ts',
  '**/wallet.service.ts',
];

function patchFile(filePath: string) {
  console.log(`Patching ${filePath}...`);
  
  let fileContent = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Add import if not already present
  if (!fileContent.includes('compatibilizeIDs')) {
    const importIndex = fileContent.lastIndexOf('import ');
    const nextLineBreak = fileContent.indexOf('\n', importIndex);
    
    if (importIndex !== -1 && nextLineBreak !== -1) {
      fileContent = fileContent.substring(0, nextLineBreak + 1) + 
                    PATCH_IMPORT + 
                    fileContent.substring(nextLineBreak + 1);
      modified = true;
    }
  }
  
  // Patch findOne methods
  fileContent = fileContent.replace(
    /(async\s+findOne\s*\([^)]*\)\s*{[^}]*)(return\s+[^;]*;)/g, 
    '$1const result = $2\n    return compatibilizeIDs(result);'
  );
  
  // Patch find methods
  fileContent = fileContent.replace(
    /(async\s+find\s*\([^)]*\)\s*{[^}]*)(return\s+[^;]*;)/g, 
    '$1const results = $2\n    return compatibilizeIDsArray(results);'
  );
  
  // Modify where conditions in queries
  fileContent = fileContent.replace(
    /\.where\(([^)]+)\)/g,
    '.where(expandIDConditions($1))'
  );
  
  // Create backup of original file
  if (fileContent !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(`${filePath}.bak`, fs.readFileSync(filePath));
    fs.writeFileSync(filePath, fileContent);
    console.log(`   ✓ Patched successfully`);
    return true;
  } else {
    console.log(`   - No changes required`);
    return false;
  }
}

// Find and patch files
let patchedCount = 0;

FILES_TO_PATCH.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: REPO_PATH, absolute: true });
  
  files.forEach(file => {
    if (patchFile(file)) {
      patchedCount++;
    }
  });
});

console.log(`\nPatched ${patchedCount} files successfully.`);
```

### 5. Testing & Validation (1.5 hours)

Create a quick validation script:

```typescript
// File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/validate-id-fixes.ts

import { createConnection } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function validateFixes() {
  console.log('Starting validation of database fixes...');
  
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'Aliveadmin',
      password: process.env.DATABASE_PASSWORD || 'aliveHumans@2024',
      database: process.env.DATABASE_NAME || 'Alive-Db',
      synchronize: false,
      logging: false,
    });
    
    console.log('Connected to database successfully');
    
    // Test triggers with a new record
    console.log('\nTesting ID synchronization trigger:');
    const testUserId = '00000000-1111-2222-3333-444444444444';
    
    // Insert test user with only id field
    await connection.query(`
      INSERT INTO users (id, username, email) 
      VALUES ('${testUserId}', 'triggertest', 'triggertest@example.com')
      ON CONFLICT (id) DO UPDATE SET username = 'triggertest'
    `);
    
    // Check if other ID fields were synchronized
    const result = await connection.query(`
      SELECT id, "userId", user_id 
      FROM users 
      WHERE id = '${testUserId}'
    `);
    
    if (result.length > 0) {
      console.log('Test user created:', result[0]);
      
      if (result[0].id === result[0].userId && result[0].id === result[0].user_id) {
        console.log('✅ ID synchronization trigger works correctly!');
      } else {
        console.log('❌ ID synchronization trigger FAILED!');
      }
    } else {
      console.log('❌ Failed to find test user');
    }
    
    // Clean up test data
    await connection.query(`DELETE FROM users WHERE id = '${testUserId}'`);
    
    // Check index states
    console.log('\nChecking index states:');
    const indexes = await connection.query(`
      SELECT
        indexname,
        tablename
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
        AND (indexname LIKE '%wallet%' OR indexname LIKE '%user%')
      ORDER BY
        tablename,
        indexname
    `);
    
    console.log(`Found ${indexes.length} relevant indexes`);
    
    // Verify specific index removals and additions
    const indexNames = indexes.map((idx: any) => idx.indexname);
    
    // These should be gone
    if (!indexNames.includes('idx_user_wallet_address')) {
      console.log('✅ Redundant index idx_user_wallet_address successfully removed');
    } else {
      console.log('❌ Redundant index idx_user_wallet_address still exists');
    }
    
    // These should exist
    if (indexNames.includes('idx_users_email_lower')) {
      console.log('✅ New index idx_users_email_lower successfully added');
    } else {
      console.log('❌ New index idx_users_email_lower is missing');
    }
    
    await connection.close();
    console.log('\nValidation completed');
    
  } catch (err) {
    console.error(`Failed to validate fixes: ${err.message}`);
    process.exit(1);
  }
}

validateFixes().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
```

### 6. Deployment & Documentation (1 hour)

Create a deployment script:

```bash
#!/bin/bash
# File: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/migrations/deploy-fixes.sh

set -e

echo "Starting rapid database fixes deployment..."

# Create backup
BACKUP_FILE="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/pre_rapid_fix_$(date +%Y%m%d%H%M%S).sql"
echo "Creating backup to $BACKUP_FILE"
pg_dump -U Aliveadmin -h localhost -p 5432 -d Alive-Db > $BACKUP_FILE

# Deploy triggers
echo "Deploying synchronization triggers..."
PGPASSWORD=aliveHumans@2024 psql -U Aliveadmin -h localhost -p 5432 -d Alive-Db -f "/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/migrations/rapid-fix-triggers.sql"

# Optimize indexes
echo "Optimizing database indexes..."
PGPASSWORD=aliveHumans@2024 psql -U Aliveadmin -h localhost -p 5432 -d Alive-Db -f "/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/migrations/rapid-index-fix.sql"

# Rebuild backend with patches
echo "Rebuilding backend with compatibility patches..."
cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend
npm run build

echo "Fixes successfully deployed!"
```

## Required Scripts Summary

1. **rapid-fix-triggers.sql** - Implements critical sync triggers
2. **rapid-index-fix.sql** - Optimizes database indexes 
3. **id-compatibility.ts** - Provides compatibility layer for both naming conventions
4. **patch-critical-repos.ts** - Updates repositories to use the compatibility layer
5. **validate-id-fixes.ts** - Tests the implemented fixes
6. **deploy-fixes.sh** - Executes the deployment steps

## Future Improvements

After this one-day rapid fix, consider these follow-up improvements:

1. **Extend trigger coverage** to all tables with naming inconsistencies
2. **Create migration scripts** to standardize column names across the database
3. **Update entity definitions** to use standardized naming conventions
4. **Document naming standards** for future development
5. **Remove compatibility layer** once all code is updated

## Risk Mitigation

1. **Always run database changes on test environment first**
2. **Have a clear rollback plan** ready for immediate execution
3. **Keep backups** before and after each major step
4. **Monitor application logs** after deployment for any errors
5. **Keep the compatibility layer in place** until all code is updated