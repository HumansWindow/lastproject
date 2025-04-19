-- Fix for refresh_tokens table foreign key constraint issue
-- This script fixes the foreign key constraint issues between refresh_tokens and users tables

-- Start a transaction to make changes atomic
BEGIN;

-- 1. Check current table structure and constraints
\echo 'Current refresh_tokens table structure:'
\d refresh_tokens;

\echo 'Current foreign key constraints for refresh_tokens:'
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

-- 2. Drop existing foreign key constraints if they exist
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_user_id_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_id";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_userId";

-- 3. Ensure both userId and user_id columns exist
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

-- 4. Synchronize data between the two columns
UPDATE "public"."refresh_tokens" SET "userId" = "user_id" WHERE "userId" IS NULL AND "user_id" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "user_id" = "userId" WHERE "user_id" IS NULL AND "userId" IS NOT NULL;

-- 5. Create trigger function to keep the columns in sync
CREATE OR REPLACE FUNCTION sync_user_id_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."user_id" IS NOT NULL AND (NEW."userId" IS NULL OR NEW."user_id" <> NEW."userId") THEN
        NEW."userId" := NEW."user_id";
    ELSIF NEW."userId" IS NOT NULL AND (NEW."user_id" IS NULL OR NEW."userId" <> NEW."user_id") THEN
        NEW."user_id" := NEW."userId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_user_id_to_userId') THEN
        CREATE TRIGGER sync_user_id_to_userId
        BEFORE INSERT OR UPDATE ON "public"."refresh_tokens"
        FOR EACH ROW
        WHEN (NEW."user_id" IS DISTINCT FROM NEW."userId")
        EXECUTE FUNCTION sync_user_id_columns();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sync_userId_to_user_id') THEN
        CREATE TRIGGER sync_userId_to_user_id
        BEFORE INSERT OR UPDATE ON "public"."refresh_tokens"
        FOR EACH ROW
        WHEN (NEW."userId" IS DISTINCT FROM NEW."user_id")
        EXECUTE FUNCTION sync_user_id_columns();
    END IF;
END $$;

-- 7. Clean up any orphaned refresh tokens
DELETE FROM "public"."refresh_tokens" 
WHERE "user_id" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "public"."users" WHERE "id" = "refresh_tokens"."user_id");

DELETE FROM "public"."refresh_tokens" 
WHERE "userId" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM "public"."users" WHERE "id" = "refresh_tokens"."userId");

-- 8. Add foreign key constraints
ALTER TABLE "public"."refresh_tokens" 
    ADD CONSTRAINT "refresh_tokens_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "public"."users"("id") 
    ON DELETE CASCADE;

ALTER TABLE "public"."refresh_tokens" 
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" 
    FOREIGN KEY ("user_id") 
    REFERENCES "public"."users"("id") 
    ON DELETE CASCADE;

-- 9. Test the fix with a sample user and token
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Create a test user
    INSERT INTO "public"."users" (
        "isActive", "isVerified", "role", "created_at"
    ) VALUES (
        true, true, 'user', NOW()
    ) RETURNING "id" INTO test_user_id;
    
    RAISE NOTICE 'Created test user with ID: %', test_user_id;
    
    -- Try to insert a refresh token using userId column
    BEGIN
        INSERT INTO "public"."refresh_tokens" (
            "token", "expiresAt", "userId"
        ) VALUES (
            'test-token-' || test_user_id, 
            NOW() + INTERVAL '7 days',
            test_user_id
        );
        RAISE NOTICE 'Successfully inserted refresh token with userId';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to insert token with userId: %', SQLERRM;
    END;
    
    -- Check if user_id was synchronized
    RAISE NOTICE 'Checking if userId was synchronized to user_id...';
    PERFORM 1 FROM "public"."refresh_tokens" 
    WHERE "userId" = test_user_id AND "user_id" = test_user_id;
    
    IF FOUND THEN
        RAISE NOTICE 'Success: userId was synchronized to user_id';
    ELSE
        RAISE WARNING 'Failed: userId was not synchronized to user_id';
    END IF;
    
    -- Clean up test data
    DELETE FROM "public"."refresh_tokens" WHERE "userId" = test_user_id OR "user_id" = test_user_id;
    DELETE FROM "public"."users" WHERE "id" = test_user_id;
    
    RAISE NOTICE 'Test user and token cleaned up';
END $$;

-- 10. Verify the constraints
\echo 'Updated foreign key constraints for refresh_tokens:'
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

-- Commit all changes
COMMIT;
