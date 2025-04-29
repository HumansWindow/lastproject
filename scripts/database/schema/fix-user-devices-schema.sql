-- Fix for user_devices table schema issues
-- Add missing columns that are expected by the entity model

-- Check if columns exist before adding them
DO $$
BEGIN
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.user_devices ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_devices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add first_seen column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'first_seen') THEN
        ALTER TABLE public.user_devices ADD COLUMN first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add last_seen column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'last_seen') THEN
        ALTER TABLE public.user_devices ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add wallet_addresses column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'wallet_addresses') THEN
        ALTER TABLE public.user_devices ADD COLUMN wallet_addresses TEXT NULL;
    END IF;

    -- Add is_approved column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_devices' 
                   AND column_name = 'is_approved') THEN
        ALTER TABLE public.user_devices ADD COLUMN is_approved BOOLEAN DEFAULT true;
    END IF;
    
    -- Make sure the device_id constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.user_devices'::regclass 
        AND contype = 'u' 
        AND conname = 'user_devices_device_id_unique'
    ) THEN
        -- Create a unique index on device_id if not already exists
        -- Note: We don't make it truly unique to allow the same device 
        -- with different users in some cases
        CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON public.user_devices(device_id);
    END IF;
END$$;

-- Notify about completion
SELECT 'User devices table schema updated successfully' as result;