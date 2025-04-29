-- Fix user_sessions table userId/user_id inconsistency

-- First, check if the userId column exists
DO $$
BEGIN
    -- Create userId column if it doesn't exist
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

    -- Create user_id column if it doesn't exist
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

    -- Synchronize values between userId and user_id
    UPDATE public.user_sessions SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;
    UPDATE public.user_sessions SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;
    RAISE NOTICE 'Synchronized existing values between userId and user_id columns';

    -- Create a trigger to ensure both fields stay in sync
    DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_sessions;
    
    CREATE OR REPLACE FUNCTION sync_user_sessions_fields()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
            IF NEW."userId" IS NOT NULL AND NEW.user_id IS NULL THEN
                NEW.user_id := NEW."userId";
            ELSIF NEW.user_id IS NOT NULL AND NEW."userId" IS NULL THEN
                NEW."userId" := NEW.user_id;
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER sync_user_id_trigger
    BEFORE INSERT OR UPDATE ON public.user_sessions
    FOR EACH ROW EXECUTE FUNCTION sync_user_sessions_fields();
    
    RAISE NOTICE 'Created trigger to keep userId and user_id columns in sync';
    
    -- Make both columns NOT NULL (only if they have values)
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM public.user_sessions WHERE "userId" IS NULL OR user_id IS NULL
        ) THEN
            ALTER TABLE public.user_sessions ALTER COLUMN "userId" SET NOT NULL;
            ALTER TABLE public.user_sessions ALTER COLUMN user_id SET NOT NULL;
            RAISE NOTICE 'Set both userId and user_id columns to NOT NULL';
        ELSE
            RAISE NOTICE 'Some rows have NULL values, skipping NOT NULL constraint';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set NOT NULL constraints due to existing NULL values';
    END;
END $$;

-- Test by inserting a value with only one field populated, the trigger should fill the other
INSERT INTO public.user_sessions (user_id, device_id, token, ip_address, user_agent, expires_at, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'test-device', 'test-token', '127.0.0.1', 'test-agent', NOW() + INTERVAL '1 day', true)
ON CONFLICT DO NOTHING;

-- Check if the trigger works by selecting the inserted row
SELECT * FROM public.user_sessions WHERE user_id = '00000000-0000-0000-0000-000000000000' OR "userId" = '00000000-0000-0000-0000-000000000000' LIMIT 1;

-- Cleanup test data
DELETE FROM public.user_sessions WHERE user_id = '00000000-0000-0000-0000-000000000000' OR "userId" = '00000000-0000-0000-0000-000000000000';
