-- Fix for refresh_tokens table foreign key constraint issue with userId vs user_id

BEGIN;

-- Step 1: Verify the structure of the refresh_tokens table
\echo 'Current refresh_tokens table structure:'
\d refresh_tokens;

-- Step 2: Fix the column names and constraints
\echo 'Ensuring both userId and user_id columns exist and are properly synced';

-- First, ensure both columns exist
DO $$
BEGIN
    -- Check if userId column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'refresh_tokens'
        AND column_name = 'userId'
    ) THEN
        ALTER TABLE "public"."refresh_tokens" ADD COLUMN "userId" uuid;
    END IF;

    -- Check if user_id column exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'refresh_tokens'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE "public"."refresh_tokens" ADD COLUMN "user_id" uuid;
    END IF;
END $$;

-- Step 3: Update any existing records to have both columns filled
UPDATE "public"."refresh_tokens" SET "userId" = "user_id" WHERE "userId" IS NULL AND "user_id" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "user_id" = "userId" WHERE "user_id" IS NULL AND "userId" IS NOT NULL;

-- Step 4: Drop any existing foreign key constraints to clean up
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_user_id_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_id";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_userId";

-- Step 5: Create better trigger to sync the columns
CREATE OR REPLACE FUNCTION sync_refresh_token_user_id_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW."user_id" IS NOT NULL AND NEW."userId" IS NULL THEN
            NEW."userId" := NEW."user_id";
        ELSIF NEW."userId" IS NOT NULL AND NEW."user_id" IS NULL THEN
            NEW."user_id" := NEW."userId";
        ELSIF NEW."userId" IS NOT NULL AND NEW."user_id" IS NOT NULL AND NEW."userId" <> NEW."user_id" THEN
            -- If both are not null but different, use userId as the source of truth
            NEW."user_id" := NEW."userId";
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_user_id_to_userId ON "public"."refresh_tokens";
DROP TRIGGER IF EXISTS sync_userId_to_user_id ON "public"."refresh_tokens";

-- Create a single trigger that works for both inserts and updates
CREATE TRIGGER sync_refresh_token_user_ids
BEFORE INSERT OR UPDATE ON "public"."refresh_tokens"
FOR EACH ROW
EXECUTE FUNCTION sync_refresh_token_user_id_columns();

-- Step 6: Add foreign key constraints to both columns
-- First to the users.id column which is the standard
ALTER TABLE "public"."refresh_tokens" 
ADD CONSTRAINT "refresh_tokens_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("id") 
ON DELETE CASCADE;

-- Then to the users.id column via userId column
ALTER TABLE "public"."refresh_tokens" 
ADD CONSTRAINT "refresh_tokens_userId_fkey" 
FOREIGN KEY ("userId") 
REFERENCES "public"."users"("id") 
ON DELETE CASCADE;

-- Step 7: Validate the fix - make sure columns are not null 
-- for existing records
UPDATE "public"."refresh_tokens"
SET "user_id" = "userId"
WHERE "user_id" IS NULL AND "userId" IS NOT NULL;

UPDATE "public"."refresh_tokens"
SET "userId" = "user_id"
WHERE "userId" IS NULL AND "user_id" IS NOT NULL;

-- Add NOT NULL constraint if both columns have values now
-- This is optional and can be uncommented if all data is migrated
-- ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL;
-- ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "userId" SET NOT NULL;

-- Display the updated table structure
\echo 'Updated refresh_tokens table structure:';
\d refresh_tokens;

-- Check foreign key constraints
\echo 'Updated foreign key constraints for refresh_tokens:';
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
