-- Fix for user_sessions table schema issues
-- Add missing columns that are expected by the entity model

DO $$
BEGIN
    -- Add endedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_sessions' 
                   AND column_name = 'endedAt') THEN
        ALTER TABLE public.user_sessions ADD COLUMN "endedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_sessions' 
                   AND column_name = 'duration') THEN
        ALTER TABLE public.user_sessions ADD COLUMN duration INTEGER DEFAULT NULL;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_sessions' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.user_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_sessions' 
                   AND column_name = 'user_agent') THEN
        ALTER TABLE public.user_sessions ADD COLUMN user_agent TEXT NULL;
    END IF;

    -- Make sure indexes exist for better performance
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON public.user_sessions(device_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);
END$$;

-- Notify about completion
SELECT 'User sessions table schema updated successfully' as result;