#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Refresh Token Foreign Key Fix Script ===${NC}"
echo -e "${YELLOW}This script will fix the foreign key issue in the refresh_tokens table.${NC}"

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="alivehumans@2024"

# Create temporary fix SQL script
FIX_SQL_FILE=$(mktemp)
cat > $FIX_SQL_FILE << 'EOF'
-- Start a transaction so changes are atomic
BEGIN;

-- Display the current refresh_tokens table structure
\d refresh_tokens;

-- Check if the foreign key constraint exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'refresh_tokens_user_id_fkey' 
    AND conrelid = 'refresh_tokens'::regclass
  ) THEN
    RAISE NOTICE 'Dropping existing foreign key constraint refresh_tokens_user_id_fkey';
    ALTER TABLE public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
  ELSE
    RAISE NOTICE 'Foreign key constraint refresh_tokens_user_id_fkey does not exist';
  END IF;
END $$;

-- Delete any orphaned refresh tokens (where the user doesn't exist)
DELETE FROM refresh_tokens 
WHERE user_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users WHERE id = refresh_tokens.user_id);

DELETE FROM refresh_tokens 
WHERE "userId" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM users WHERE id = refresh_tokens."userId");

-- Add back the foreign key constraint correctly
ALTER TABLE public.refresh_tokens
ADD CONSTRAINT refresh_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Also add a constraint for the camelCase column to be sure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'refresh_tokens'
    AND column_name = 'userId'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'refresh_tokens_userId_fkey' 
    AND conrelid = 'refresh_tokens'::regclass
  ) THEN
    RAISE NOTICE 'Adding foreign key constraint refresh_tokens_userId_fkey';
    ALTER TABLE public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_userId_fkey 
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create or replace the trigger function to keep columns in sync
CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user ID columns
  IF NEW.user_id IS NULL AND NEW."userId" IS NOT NULL THEN
    NEW.user_id := NEW."userId";
  ELSIF NEW."userId" IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW."userId" := NEW.user_id;
  END IF;

  -- Sync expiry date columns
  IF NEW.expires_at IS NULL AND NEW."expiresAt" IS NOT NULL THEN
    NEW.expires_at := NEW."expiresAt";
  ELSIF NEW."expiresAt" IS NULL AND NEW.expires_at IS NOT NULL THEN
    NEW."expiresAt" := NEW.expires_at;
  END IF;

  -- Sync created at columns
  IF NEW.created_at IS NULL AND NEW."createdAt" IS NOT NULL THEN
    NEW.created_at := NEW."createdAt";
  ELSIF NEW."createdAt" IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW."createdAt" := NEW.created_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_refresh_token_columns_trigger ON public.refresh_tokens;

-- Create the trigger
CREATE TRIGGER sync_refresh_token_columns_trigger
BEFORE INSERT OR UPDATE ON public.refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION sync_refresh_token_columns();

-- Verify the fix by displaying info about the foreign key constraints
SELECT
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
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'refresh_tokens';

-- Create a test function to validate the fix
DO $$
DECLARE
  test_user_id UUID;
  token_id UUID;
BEGIN
  -- Create a test user
  INSERT INTO users (
    "isActive", "isVerified", role, "walletAddress", "created_at"
  ) VALUES (
    true, true, 'user', '0xTestWalletAddress_' || now(), NOW()
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE 'Created test user with ID: %', test_user_id;
  
  -- Try to insert a refresh token with the test user's ID
  BEGIN
    INSERT INTO refresh_tokens (
      token, "expiresAt", "userId", user_id
    ) VALUES (
      'test-token-' || test_user_id, 
      NOW() + INTERVAL '7 days',
      test_user_id,
      test_user_id
    ) RETURNING id INTO token_id;
    
    RAISE NOTICE 'Successfully created test token with ID: %', token_id;
    
    -- Clean up test data
    DELETE FROM refresh_tokens WHERE id = token_id;
    DELETE FROM users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test successful - foreign key constraint is working properly';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test failed: %', SQLERRM;
    -- Clean up even if the test fails
    IF test_user_id IS NOT NULL THEN
      DELETE FROM users WHERE id = test_user_id;
    END IF;
    RAISE EXCEPTION 'Foreign key constraint test failed';
  END;
END $$;

-- Commit all changes
COMMIT;
EOF

echo -e "${YELLOW}Applying database fixes...${NC}"

# Execute the SQL fix script without prompting for password
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$FIX_SQL_FILE"; then
  echo -e "${GREEN}✓ Database foreign key constraint fixes applied successfully${NC}"
else
  echo -e "${RED}✗ Error applying database fixes${NC}"
  rm -f $FIX_SQL_FILE
  exit 1
fi

# Clean up
rm -f $FIX_SQL_FILE

echo -e "${GREEN}✓ Refresh token foreign key fix completed!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Restart your backend service with: ${GREEN}npm run start:dev${NC}"
echo -e "2. Test the wallet authentication in your application again"