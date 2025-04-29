-- Fix Profile table user_id column naming issue
-- Created: April 23, 2025

-- Start transaction
BEGIN;

-- Check if user_id column already exists
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        -- Add the missing user_id column
        RAISE NOTICE 'Adding user_id column to profiles table...';
        ALTER TABLE profiles ADD COLUMN user_id UUID;

        -- Copy values from userId to user_id
        RAISE NOTICE 'Copying data from userId to user_id...';
        UPDATE profiles SET user_id = "userId";
        
        -- Add not null constraint to match userId
        ALTER TABLE profiles ALTER COLUMN user_id SET NOT NULL;
        
        -- Add index on user_id
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id_snake ON profiles(user_id);
    ELSE
        RAISE NOTICE 'user_id column already exists in profiles table.';
    END IF;
END $$;

-- Create or replace trigger function to keep columns synchronized
CREATE OR REPLACE FUNCTION sync_profile_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW."userId" IS DISTINCT FROM NEW.user_id THEN
            IF NEW."userId" IS NOT NULL THEN
                NEW.user_id := NEW."userId";
            ELSIF NEW.user_id IS NOT NULL THEN
                NEW."userId" := NEW.user_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists and if not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_sync_profile_user_id'
    ) THEN
        RAISE NOTICE 'Creating synchronization trigger...';
        -- Create trigger that will fire before insert or update
        CREATE TRIGGER trigger_sync_profile_user_id
        BEFORE INSERT OR UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION sync_profile_user_id();
    ELSE
        RAISE NOTICE 'Synchronization trigger already exists.';
    END IF;
END $$;

-- Make sure all records are properly synchronized
UPDATE profiles SET user_id = "userId" WHERE user_id IS NULL OR user_id != "userId";

-- Verify column count and synchronization
DO $$
DECLARE
    userId_count INTEGER;
    user_id_count INTEGER;
    mismatch_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO userId_count FROM profiles WHERE "userId" IS NOT NULL;
    SELECT COUNT(*) INTO user_id_count FROM profiles WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO mismatch_count FROM profiles WHERE "userId" IS DISTINCT FROM user_id;
    
    RAISE NOTICE 'Verification results:';
    RAISE NOTICE 'userId count: %', userId_count;
    RAISE NOTICE 'user_id count: %', user_id_count;
    RAISE NOTICE 'Mismatched records: %', mismatch_count;
    
    IF mismatch_count > 0 THEN
        RAISE EXCEPTION 'There are still % records with mismatched userId/user_id values!', mismatch_count;
    END IF;
END $$;

-- Commit transaction
COMMIT;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Profile userId/user_id synchronization complete.';
    RAISE NOTICE 'The system will now use both column names interchangeably.';
END $$;
