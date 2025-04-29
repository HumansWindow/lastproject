-- Comprehensive fix for refresh_tokens table
-- This script will:
-- 1. Drop conflicting constraints and triggers
-- 2. Consolidate duplicate columns
-- 3. Recreate proper foreign key constraints
-- 4. Create proper sync triggers

-- First, check the actual column names in the users table
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';

-- Drop all existing foreign key constraints on refresh_tokens table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT conname FROM pg_constraint
              WHERE conrelid = 'refresh_tokens'::regclass AND contype = 'f')
    LOOP
        EXECUTE 'ALTER TABLE "public"."refresh_tokens" DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Drop all existing triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tgname FROM pg_trigger
              WHERE tgrelid = 'refresh_tokens'::regclass)
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON "public"."refresh_tokens"';
    END LOOP;
END $$;

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION sync_refresh_token_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync user ID columns
    IF NEW."userId" IS NOT NULL AND (NEW.user_id IS NULL OR NEW.user_id <> NEW."userId") THEN
        NEW.user_id := NEW."userId";
    ELSIF NEW.user_id IS NOT NULL AND (NEW."userId" IS NULL OR NEW."userId" <> NEW.user_id) THEN
        NEW."userId" := NEW.user_id;
    END IF;

    -- Sync expiration columns
    IF NEW."expiresAt" IS NOT NULL AND (NEW.expires_at IS NULL OR NEW.expires_at <> NEW."expiresAt") THEN
        NEW.expires_at := NEW."expiresAt";
    ELSIF NEW.expires_at IS NOT NULL AND (NEW."expiresAt" IS NULL OR NEW."expiresAt" <> NEW.expires_at) THEN
        NEW."expiresAt" := NEW.expires_at;
    END IF;

    -- Sync created columns
    IF NEW."createdAt" IS NOT NULL AND (NEW.created_at IS NULL OR NEW."createdAt"::timestamp <> NEW.created_at) THEN
        NEW.created_at := NEW."createdAt";
    ELSIF NEW.created_at IS NOT NULL AND (NEW."createdAt" IS NULL OR NEW.created_at <> NEW."createdAt"::timestamp) THEN
        NEW."createdAt" := NEW.created_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure both columns have data (synchronize from one to the other)
UPDATE "public"."refresh_tokens" SET "user_id" = "userId" WHERE "user_id" IS NULL AND "userId" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "userId" = "user_id" WHERE "userId" IS NULL AND "user_id" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "expires_at" = "expiresAt" WHERE "expires_at" IS NULL AND "expiresAt" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "expiresAt" = "expires_at" WHERE "expiresAt" IS NULL AND "expires_at" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "created_at" = "createdAt"::timestamp WHERE "created_at" IS NULL AND "createdAt" IS NOT NULL;
UPDATE "public"."refresh_tokens" SET "createdAt" = "created_at"::timestamptz WHERE "createdAt" IS NULL AND "created_at" IS NOT NULL;

-- Add not null constraints if needed
ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "public"."refresh_tokens" ALTER COLUMN "userId" SET NOT NULL;

-- Create foreign key constraints - using both column names to ensure compatibility with existing code
ALTER TABLE "public"."refresh_tokens" 
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" 
    FOREIGN KEY (user_id) 
    REFERENCES "public"."users"(id) 
    ON DELETE CASCADE;

ALTER TABLE "public"."refresh_tokens" 
    ADD CONSTRAINT "refresh_tokens_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES "public"."users"(id) 
    ON DELETE CASCADE;

-- Create a trigger to keep all columns in sync
CREATE TRIGGER sync_refresh_token_columns_trigger
BEFORE INSERT OR UPDATE ON "public"."refresh_tokens"
FOR EACH ROW
EXECUTE FUNCTION sync_refresh_token_columns();

-- Show final constraints
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
