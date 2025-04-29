-- Fix user_sessions table userId/user_id inconsistency
-- This script adds a trigger to synchronize userId and user_id columns

-- First, check if the userId column exists and is NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'userId'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE 'userId column exists in user_sessions table and is NOT NULL';
    ELSE
        -- Make sure userId exists and is NOT NULL
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_sessions' 
            AND column_name = 'userId'
        ) THEN
            ALTER TABLE public.user_sessions ADD COLUMN "userId" UUID;
            RAISE NOTICE 'Added userId column to user_sessions table';
        END IF;
        
        -- Set userId NOT NULL
        ALTER TABLE public.user_sessions ALTER COLUMN "userId" SET NOT NULL;
        RAISE NOTICE 'Set userId to NOT NULL';
    END IF;
END $$;

-- Check if user_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'user_id column exists in user_sessions table';
    ELSE
        -- Add user_id column if it doesn't exist
        ALTER TABLE public.user_sessions ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to user_sessions table';
    END IF;
    
    -- Make sure user_id is NOT NULL
    ALTER TABLE public.user_sessions ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'Set user_id to NOT NULL';
END $$;

-- Synchronize existing data between user_id and userId columns
UPDATE public.user_sessions 
SET "userId" = user_id
WHERE "userId" IS NULL AND user_id IS NOT NULL;

UPDATE public.user_sessions 
SET user_id = "userId"
WHERE user_id IS NULL AND "userId" IS NOT NULL;

-- Create a trigger to keep userId and user_id in sync
DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_sessions;

CREATE OR REPLACE FUNCTION sync_user_sessions_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- If userId is provided but user_id is NULL, copy userId to user_id
        IF NEW."userId" IS NOT NULL AND NEW.user_id IS NULL THEN
            NEW.user_id := NEW."userId";
        END IF;
        
        -- If user_id is provided but userId is NULL, copy user_id to userId
        IF NEW.user_id IS NOT NULL AND NEW."userId" IS NULL THEN
            NEW."userId" := NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_id_trigger
BEFORE INSERT OR UPDATE ON public.user_sessions
FOR EACH ROW EXECUTE FUNCTION sync_user_sessions_fields();

-- Add a note about this fix
DO $$
BEGIN
    RAISE NOTICE 'User sessions table fixed. Both userId and user_id columns are now in sync and will remain synchronized.';
END $$;