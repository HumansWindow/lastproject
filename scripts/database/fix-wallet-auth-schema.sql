-- Fix schema issues for wallet authentication
-- Adding missing user_id column to user_devices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_devices' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.user_devices ADD COLUMN user_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Added user_id column to user_devices table';
    ELSE
        RAISE NOTICE 'user_id column already exists in user_devices table';
    END IF;
END $$;

-- Ensure we have the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if user_id column exists in users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN user_id UUID UNIQUE DEFAULT uuid_generate_v4();
        RAISE NOTICE 'Added user_id column to users table';
    ELSE
        RAISE NOTICE 'user_id column already exists in users table';
    END IF;
END $$;

-- Check if user_id column exists in wallets table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.wallets ADD COLUMN user_id UUID REFERENCES public.users(id);
        RAISE NOTICE 'Added user_id column to wallets table';
    ELSE
        RAISE NOTICE 'user_id column already exists in wallets table';
    END IF;
END $$;

-- Check if wallet_challenges table exists, create if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_challenges'
    ) THEN
        CREATE TABLE public.wallet_challenges (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            wallet_address VARCHAR(255) NOT NULL,
            challenge_text TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
            is_used BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX idx_wallet_challenges_address ON public.wallet_challenges(wallet_address);
        RAISE NOTICE 'Created wallet_challenges table';
    ELSE
        RAISE NOTICE 'wallet_challenges table already exists';
    END IF;
END $$;

-- Add wallet_address index to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'users' 
        AND indexname = 'idx_users_wallet_address'
    ) THEN
        CREATE INDEX idx_users_wallet_address ON public.users(LOWER("walletAddress"));
        RAISE NOTICE 'Created index on users.walletAddress';
    ELSE
        RAISE NOTICE 'Index on users.walletAddress already exists';
    END IF;
END $$;

-- Ensure wallet_nonces table exists for secure authentication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_nonces'
    ) THEN
        CREATE TABLE public.wallet_nonces (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            wallet_address VARCHAR(255) NOT NULL UNIQUE,
            nonce VARCHAR(255) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created wallet_nonces table';
    ELSE
        RAISE NOTICE 'wallet_nonces table already exists';
    END IF;
END $$;

-- Check if the walletAddress column in users is properly formatted
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'walletaddress'
    ) THEN
        -- Ensure walletAddress is case-consistent in the schema
        ALTER TABLE public.users RENAME COLUMN walletaddress TO "walletAddress";
        RAISE NOTICE 'Renamed walletaddress to walletAddress for consistency';
    END IF;
END $$;

-- Fix any NULL walletAddress values that might be causing issues
UPDATE public.users 
SET "walletAddress" = NULL 
WHERE "walletAddress" = '';

-- Update existing wallets to link to users by matching wallet address
DO $$
BEGIN
    UPDATE public.wallets w
    SET user_id = u.id
    FROM public.users u
    WHERE LOWER(w.address) = LOWER(u.walletAddress)
    AND w.user_id IS NULL
    AND u.id IS NOT NULL;
    
    RAISE NOTICE 'Updated wallet-user relationships';
END $$;

-- Recreate any necessary foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_wallets_users' 
        AND contype = 'f'
    ) THEN
        BEGIN
            ALTER TABLE public.wallets
            ADD CONSTRAINT fk_wallets_users
            FOREIGN KEY (user_id)
            REFERENCES public.users(id);
            
            RAISE NOTICE 'Added foreign key constraint to wallets table';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Foreign key constraint already exists';
        END;
    END IF;
END $$;