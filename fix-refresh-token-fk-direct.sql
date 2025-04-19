-- Fix the refresh_tokens table foreign key constraint

-- First check the actual column names in the users table
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';

-- Check the actual column names in the refresh_tokens table
SELECT column_name FROM information_schema.columns WHERE table_name = 'refresh_tokens' AND column_name IN ('user_id', 'userId');

-- Check existing foreign key constraints
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

-- Drop the existing constraint that's causing problems
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_user_id_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_userId_fkey";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_user_id";
ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS "FK_refresh_tokens_userId";

-- Add the correct column if it doesn't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE "public"."refresh_tokens" ADD COLUMN IF NOT EXISTS "user_id" uuid;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Column user_id already exists, skipping...';
    END;
END $$;

-- Make sure userId and user_id are properly synchronized
UPDATE "public"."refresh_tokens" SET "user_id" = "userId" WHERE "user_id" IS NULL AND "userId" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "userId" = "user_id" WHERE "userId" IS NULL AND "user_id" IS NOT NULL;

-- Create the foreign key constraints for both columns
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

-- Create triggers to keep the columns in sync if they don't exist
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

-- Create or replace the trigger function
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
