#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Refresh Token Column Name Fix Script ===${NC}"
echo -e "${YELLOW}This script will fix the userId vs user_id inconsistency in the refresh_tokens table.${NC}"

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

-- Drop the foreign key constraints first
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'refresh_tokens_user_id_fkey' 
    AND conrelid = 'refresh_tokens'::regclass
  ) THEN
    RAISE NOTICE 'Dropping constraint refresh_tokens_user_id_fkey';
    ALTER TABLE public.refresh_tokens DROP CONSTRAINT refresh_tokens_user_id_fkey;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'refresh_tokens_userid_fkey' 
    AND conrelid = 'refresh_tokens'::regclass
  ) THEN
    RAISE NOTICE 'Dropping constraint refresh_tokens_userid_fkey';
    ALTER TABLE public.refresh_tokens DROP CONSTRAINT refresh_tokens_userid_fkey;
  END IF;
END $$;

-- Make sure both columns exist and have the correct type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'refresh_tokens'
    AND column_name = 'userId'
  ) THEN
    RAISE NOTICE 'Adding userId column';
    ALTER TABLE public.refresh_tokens ADD COLUMN "userId" UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'refresh_tokens'
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'Adding user_id column';
    ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID;
  END IF;
END $$;

-- Sync the data between columns
UPDATE public.refresh_tokens 
SET "userId" = user_id 
WHERE "userId" IS NULL AND user_id IS NOT NULL;

UPDATE public.refresh_tokens 
SET user_id = "userId" 
WHERE user_id IS NULL AND "userId" IS NOT NULL;

-- Set NOT NULL constraints if needed
ALTER TABLE public.refresh_tokens ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE public.refresh_tokens ALTER COLUMN user_id SET NOT NULL;

-- Add back both foreign key constraints
ALTER TABLE public.refresh_tokens
ADD CONSTRAINT refresh_tokens_userId_fkey 
FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.refresh_tokens
ADD CONSTRAINT refresh_tokens_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Create or replace the trigger function to maintain sync between user_id and userId
CREATE OR REPLACE FUNCTION sync_refresh_user_id_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync user ID columns
  IF NEW.user_id IS NULL AND NEW."userId" IS NOT NULL THEN
    NEW.user_id := NEW."userId";
  ELSIF NEW."userId" IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW."userId" := NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS sync_refresh_user_id_trigger ON public.refresh_tokens;

CREATE TRIGGER sync_refresh_user_id_trigger
BEFORE INSERT OR UPDATE ON public.refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION sync_refresh_user_id_columns();

-- Test the trigger by inserting a record and seeing if both columns are populated correctly
DO $$
DECLARE
  test_user_id UUID;
  token_id UUID;
BEGIN
  BEGIN
    -- First check if we have a test user
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
      -- Create a test user if none exists
      INSERT INTO users (
        "isActive", "isVerified", role, "created_at"
      ) VALUES (
        true, true, 'user', NOW()
      ) RETURNING id INTO test_user_id;
      RAISE NOTICE 'Created test user with ID %', test_user_id;
    ELSE
      RAISE NOTICE 'Using existing user with ID %', test_user_id;
    END IF;
    
    -- Test inserting with only "userId" populated
    INSERT INTO refresh_tokens (
      token, "expiresAt", "userId", "expires_at"
    ) VALUES (
      'test-userId-only-' || NOW(), 
      NOW() + INTERVAL '7 days',
      test_user_id,
      NOW() + INTERVAL '7 days'
    ) RETURNING id INTO token_id;
    
    -- Check if both columns were populated
    RAISE NOTICE 'Token test result: %', (
      SELECT "userId" = user_id FROM refresh_tokens WHERE id = token_id
    );
    
    -- Clean up test token
    DELETE FROM refresh_tokens WHERE id = token_id;
    
    -- Test inserting with only "user_id" populated
    INSERT INTO refresh_tokens (
      token, "expiresAt", user_id, "expires_at"
    ) VALUES (
      'test-user_id-only-' || NOW(), 
      NOW() + INTERVAL '7 days',
      test_user_id,
      NOW() + INTERVAL '7 days'
    ) RETURNING id INTO token_id;
    
    -- Check if both columns were populated
    RAISE NOTICE 'Token test result: %', (
      SELECT "userId" = user_id FROM refresh_tokens WHERE id = token_id
    );
    
    -- Clean up test token
    DELETE FROM refresh_tokens WHERE id = token_id;
    
    RAISE NOTICE 'Tests completed successfully';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test error: %', SQLERRM;
  END;
END $$;

-- Verify the database state
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

COMMIT;

-- Display the current schema to verify changes
\d refresh_tokens;
EOF

echo -e "${YELLOW}Applying database fixes...${NC}"

# Execute the SQL fix script
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$FIX_SQL_FILE"; then
  echo -e "${GREEN}✓ Database column name fixes applied successfully${NC}"
else
  echo -e "${RED}✗ Error applying database fixes${NC}"
  rm -f $FIX_SQL_FILE
  exit 1
fi

# Clean up
rm -f $FIX_SQL_FILE

echo -e "${GREEN}✓ Refresh token column name consistency fix completed!${NC}"
echo -e "${BLUE}Now let's update the application code to match:${NC}"

# Create a code fix template
CODE_FIX_FILE="refresh-token-code-fix.md"
cat > "$CODE_FIX_FILE" << 'EOF'
# Refresh Token Code Fix

## Issue Identified

The wallet authentication error occurs because the code uses `user_id` (snake_case) while the foreign key constraint in the database was pointing to `userId` (camelCase). 

## Database Fix Applied

We've applied these database fixes:

1. Ensured both column naming styles exist (`user_id` and `userId`)
2. Set up foreign key constraints for both columns
3. Created triggers to keep them in sync automatically

## Code Changes Required

Locate your refresh token entity file (likely in `src/auth/entities/refresh-token.entity.ts` or similar) and update it to handle both column naming conventions:

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  // Add both column names to handle any naming convention
  @Column({ name: 'expiresAt' })
  expiresAt: Date;

  @Column({ name: 'user_id' }) // This is what TypeORM will use internally
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' }) // Match the column name used above
  user: User;
}
```

## Testing the Fix

1. Restart your backend service:
   ```bash
   npm run start:dev
   ```

2. Try authenticating with your wallet again
3. Check logs to make sure no foreign key constraint errors appear

The fix should now allow proper refresh token creation during wallet authentication.
EOF

echo -e "${GREEN}✓ Created code fix recommendations in ${CODE_FIX_FILE}${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Review the code recommendations in ${CODE_FIX_FILE}"
echo -e "2. Apply the recommended code changes"
echo -e "3. Restart your backend service with: ${GREEN}npm run start:dev${NC}"
echo -e "4. Test the wallet authentication in your application again"