#!/bin/bash

echo "====================================="
echo "    ID Standardization Migration"
echo "====================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
MIGRATION_FILE="$BACKEND_DIR/src/migrations/1750000000000-StandardizeUserIds.ts"

# Ensure the migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "✗ Migration file not found at: $MIGRATION_FILE"
  exit 1
fi

# Check PostgreSQL connection
echo "Checking database connection..."
if ! psql -U Aliveadmin -d "Alive-Db" -c "SELECT 1" &>/dev/null; then
  echo "✗ Database connection failed"
  echo "Please run ./fix-postgres-auth.sh first to fix database authentication issues"
  exit 1
fi

echo "✓ Database connection successful"

# Create a function to execute SQL directly
execute_sql() {
  echo "Executing database updates directly..."
  
  # Execute the SQL from our StandardizeUserIds migration directly
  psql -U Aliveadmin -d "Alive-Db" << EOL
-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS table_exists(text);
DROP FUNCTION IF EXISTS column_exists(text, text);
DROP FUNCTION IF EXISTS get_column_type(text, text);

-- Create the functions with distinct parameter names
CREATE OR REPLACE FUNCTION table_exists(input_table_name text) RETURNS boolean AS \$\$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = input_table_name
  );
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION column_exists(input_table_name text, input_column_name text) RETURNS boolean AS \$\$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = input_table_name AND column_name = input_column_name
  );
END;
\$\$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_column_type(input_table_name text, input_column_name text) RETURNS text AS \$\$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = input_table_name AND column_name = input_column_name;
  
  RETURN col_type;
END;
\$\$ LANGUAGE plpgsql;

-- Process diaries table
DO \$\$
DECLARE
  has_user_id_column boolean;
  has_user_id_underscore_column boolean;
  user_id_column_type text;
BEGIN
  RAISE NOTICE 'Processing diaries table...';
  
  IF table_exists('diaries') THEN
    -- Check if userId column exists 
    has_user_id_column := column_exists('diaries', 'userId');
    has_user_id_underscore_column := column_exists('diaries', 'user_id');
    
    -- Get the column type
    IF has_user_id_column THEN
      user_id_column_type := get_column_type('diaries', 'userId');
    ELSIF has_user_id_underscore_column THEN
      user_id_column_type := get_column_type('diaries', 'user_id');
    END IF;
    
    -- Drop constraints first
    BEGIN
      ALTER TABLE diaries DROP CONSTRAINT IF EXISTS fk_user;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No fk_user constraint to drop';
    END;
    
    IF has_user_id_column THEN
      -- If userId column exists, rename it to user_id for consistency
      IF NOT has_user_id_underscore_column THEN
        ALTER TABLE diaries RENAME COLUMN "userId" TO "user_id";
        RAISE NOTICE 'Renamed diaries.userId to user_id';
      ELSE
        -- If both columns exist, keep user_id and drop userId
        ALTER TABLE diaries DROP COLUMN "userId";
        RAISE NOTICE 'Dropped duplicate diaries.userId column';
      END IF;
    END IF;
    
    -- Check if user_id column is not UUID
    IF user_id_column_type = 'integer' THEN
      RAISE NOTICE 'Converting diaries.user_id from integer to UUID...';
      
      -- Create temporary column
      ALTER TABLE diaries ADD COLUMN user_id_uuid uuid NULL;
      
      -- Update the UUID column based on integer IDs in users table - with proper type casting
      UPDATE diaries d
      SET user_id_uuid = u.id::uuid
      FROM users u
      WHERE d.user_id::text = u.id::text;
      
      -- Drop original column and rename
      ALTER TABLE diaries DROP COLUMN user_id;
      ALTER TABLE diaries RENAME COLUMN user_id_uuid TO user_id;
      
      -- Create foreign key constraint
      ALTER TABLE diaries 
      ADD CONSTRAINT FK_diaries_users 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE;
      
      -- Create index
      CREATE INDEX IF NOT EXISTS IDX_diaries_user_id ON diaries (user_id);
    END IF;
  ELSE
    RAISE NOTICE 'Diaries table does not exist, skipping';
  END IF;
END \$\$;

-- Process minting_queue_items table
DO \$\$
DECLARE
  user_id_column_type text;
BEGIN
  RAISE NOTICE 'Processing minting_queue_items table...';
  
  IF table_exists('minting_queue_items') THEN
    -- Check user_id column type
    user_id_column_type := get_column_type('minting_queue_items', 'user_id');
    
    -- Drop existing constraints
    BEGIN
      ALTER TABLE minting_queue_items DROP CONSTRAINT IF EXISTS minting_queue_items_user_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No minting_queue_items_user_id_fkey constraint to drop';
    END;
    
    IF user_id_column_type = 'integer' THEN
      RAISE NOTICE 'Converting minting_queue_items.user_id from integer to UUID...';
      
      -- Create temporary column
      ALTER TABLE minting_queue_items ADD COLUMN user_id_uuid uuid NULL;
      
      -- Update the UUID column based on integer IDs in users table - with proper type casting
      UPDATE minting_queue_items m
      SET user_id_uuid = u.id::uuid
      FROM users u
      WHERE m.user_id::text = u.id::text;
      
      -- Drop original column and rename
      ALTER TABLE minting_queue_items DROP COLUMN user_id;
      ALTER TABLE minting_queue_items RENAME COLUMN user_id_uuid TO user_id;
      
      -- Create foreign key constraint
      ALTER TABLE minting_queue_items 
      ADD CONSTRAINT FK_minting_queue_items_users 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE;
      
      -- Recreate index
      CREATE INDEX IF NOT EXISTS idx_minting_queue_user_id ON public.minting_queue_items(user_id);
    END IF;
  ELSE
    RAISE NOTICE 'minting_queue_items table does not exist, skipping';
  END IF;
END \$\$;

-- Process tables with camelCase userId columns
DO \$\$
DECLARE
  table_record record;
  has_user_id_column boolean;
  has_user_id_underscore_column boolean;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('wallets', 'user_devices', 'user_sessions', 
                        'refresh_tokens', 'referral_codes', 'staking_positions', 
                        'minting_records', 'accounts')
  LOOP
    RAISE NOTICE 'Checking % table...', table_record.table_name;
    
    has_user_id_column := column_exists(table_record.table_name, 'userId');
    has_user_id_underscore_column := column_exists(table_record.table_name, 'user_id');
    
    IF has_user_id_column THEN
      -- Drop constraints that might prevent column renaming
      BEGIN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS FK_%I_users', 
                       table_record.table_name, table_record.table_name);
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'No FK constraint to drop';
      END;
      
      BEGIN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS FK_%I_user_id', 
                       table_record.table_name, table_record.table_name);
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'No FK constraint to drop';
      END;
      
      BEGIN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS FK_%I_userId', 
                       table_record.table_name, table_record.table_name);
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'No FK constraint to drop';
      END;
      
      IF NOT has_user_id_underscore_column THEN
        -- Rename column for consistency
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "userId" TO "user_id"', table_record.table_name);
        RAISE NOTICE 'Renamed %.userId to user_id', table_record.table_name;
        
        -- Create index if it doesn't exist
        EXECUTE format('CREATE INDEX IF NOT EXISTS IDX_%I_user_id ON %I (user_id)',
                       table_record.table_name, table_record.table_name);
        
        -- Re-create foreign key constraint
        BEGIN
          EXECUTE format('ALTER TABLE %I ADD CONSTRAINT FK_%I_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
                        table_record.table_name, table_record.table_name);
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Could not create foreign key constraint for %', table_record.table_name;
        END;
      ELSE
        -- If both columns exist, drop the redundant userId column
        EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS "userId"', table_record.table_name);
        RAISE NOTICE 'Dropped duplicate %.userId column', table_record.table_name;
      END IF;
    END IF;
  END LOOP;
END \$\$;

-- Update for any user_referrer_id columns
DO \$\$
DECLARE
  has_referrer_id boolean;
BEGIN
  -- Update referrerId column in users table if it exists
  has_referrer_id := column_exists('users', 'referrerId');
  
  IF has_referrer_id THEN
    -- Make sure it's properly typed as UUID
    ALTER TABLE users ALTER COLUMN "referrerId" TYPE uuid USING "referrerId"::uuid;
    
    -- Check for foreign key constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_referrer'
    ) THEN
      -- Add foreign key constraint if it doesn't exist
      BEGIN
        ALTER TABLE users ADD CONSTRAINT fk_user_referrer
        FOREIGN KEY ("referrerId") REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not create referrer foreign key constraint';
      END;
    END IF;
  END IF;
END \$\$;

-- Add a record to migrations table to mark this as complete
INSERT INTO migrations (timestamp, name)
VALUES (1750000000000, 'StandardizeUserIds1750000000000')
ON CONFLICT DO NOTHING;

-- Report success
SELECT 'ID Standardization migration completed successfully.' AS status;
EOL
}

# Run the migration directly through SQL
execute_sql

echo ""
echo "====================================="
echo "  ID Standardization Complete"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Run the ID consistency check to verify changes:"
echo "   ./run-backend-commands.sh test:id-consistency"
echo ""
echo "2. Fix entity files with consistency issues as mentioned in the consistency check."