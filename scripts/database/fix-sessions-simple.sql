-- Fix the user_sessions table to have both userId and user_id columns properly synchronized

-- First, make sure both columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'userId'
    ) THEN
        ALTER TABLE public.user_sessions ADD COLUMN "userId" UUID;
        RAISE NOTICE 'Added userId column to user_sessions table';
    ELSE
        RAISE NOTICE 'userId column already exists in user_sessions table';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.user_sessions ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to user_sessions table';
    ELSE
        RAISE NOTICE 'user_id column already exists in user_sessions table';
    END IF;
END $$;

-- Copy values from one column to another if one is NULL
UPDATE public.user_sessions
SET "userId" = user_id
WHERE "userId" IS NULL AND user_id IS NOT NULL;

UPDATE public.user_sessions
SET user_id = "userId"
WHERE user_id IS NULL AND "userId" IS NOT NULL;

-- Create a trigger function for syncing
CREATE OR REPLACE FUNCTION sync_user_sessions_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."userId" IS NOT NULL AND NEW.user_id IS NULL THEN
        NEW.user_id := NEW."userId";
    ELSIF NEW.user_id IS NOT NULL AND NEW."userId" IS NULL THEN
        NEW."userId" := NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_sessions;

-- Create a new trigger
CREATE TRIGGER sync_user_id_trigger
BEFORE INSERT OR UPDATE ON public.user_sessions
FOR EACH ROW EXECUTE FUNCTION sync_user_sessions_fields();

-- Make both columns nullable for now to avoid errors
ALTER TABLE public.user_sessions ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE public.user_sessions ALTER COLUMN user_id DROP NOT NULL;

-- Display the table structure
\d public.user_sessions
