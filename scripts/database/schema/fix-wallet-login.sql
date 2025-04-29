-- Fix missing columns in database schema for wallet authentication
-- Created on April 16, 2025

DO $$
BEGIN
    -- Fix for users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.users ADD COLUMN user_id UUID DEFAULT gen_random_uuid();
        RAISE NOTICE 'Added user_id column to users table';
    END IF;

    -- Fix for user_devices table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'user_devices' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.user_devices ADD COLUMN user_id UUID NULL;
        
        -- Add foreign key if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'id') THEN
            -- Try to populate user_id from any existing relationship
            UPDATE public.user_devices 
            SET user_id = u.id 
            FROM public.users u 
            WHERE user_devices.user_id IS NULL
            AND EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'user_devices' 
                       AND column_name = 'user_id');
            
            -- Add foreign key constraint
            ALTER TABLE public.user_devices 
            ADD CONSTRAINT fk_user_devices_user 
            FOREIGN KEY (user_id) 
            REFERENCES public.users(id);
        END IF;
        
        RAISE NOTICE 'Added user_id column to user_devices table';
    END IF;

    -- Fix for wallets table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'wallets' 
                  AND column_name = 'user_id') THEN
        ALTER TABLE public.wallets ADD COLUMN user_id UUID NULL;
        
        -- Add foreign key if needed
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'users' 
                  AND column_name = 'id') THEN
            -- Try to populate user_id from any existing relationship (e.g., using walletAddress)
            UPDATE public.wallets w
            SET user_id = u.id
            FROM public.users u
            WHERE w.user_id IS NULL 
            AND LOWER(w.address) = LOWER(u.walletAddress);
            
            -- Add foreign key constraint
            ALTER TABLE public.wallets 
            ADD CONSTRAINT fk_wallets_user 
            FOREIGN KEY (user_id) 
            REFERENCES public.users(id);
        END IF;
        
        RAISE NOTICE 'Added user_id column to wallets table';
    END IF;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);

END $$;

-- Notify about completion
SELECT 'Database schema updated successfully' as result;
