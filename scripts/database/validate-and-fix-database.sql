-- Comprehensive Database Schema Validation and Fix Script
-- This script identifies and fixes all schema inconsistencies in one pass
-- Created: April 18, 2025

-- Start transaction
BEGIN;

-- Create a temporary log table to record all changes
CREATE TEMP TABLE schema_fix_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT,
    column_name TEXT,
    action TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Function to log fixes
CREATE OR REPLACE FUNCTION log_fix(t_name TEXT, c_name TEXT, act TEXT) RETURNS VOID AS $$
BEGIN
    INSERT INTO schema_fix_log(table_name, column_name, action) 
    VALUES (t_name, c_name, act);
    RAISE NOTICE 'Fixed: % % - %', t_name, c_name, act;
END;
$$ LANGUAGE plpgsql;

-- 1. Fix users table inconsistencies
DO $$
BEGIN
    -- Ensure user_id column exists with correct type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_id') THEN
        PERFORM log_fix('users', 'user_id', 'Verified column exists');
    ELSE
        -- Add user_id column if it doesn't exist
        ALTER TABLE public.users ADD COLUMN user_id UUID UNIQUE DEFAULT uuid_generate_v4();
        PERFORM log_fix('users', 'user_id', 'Added missing column');
    END IF;

    -- Ensure proper timestamps exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE public.users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        PERFORM log_fix('users', 'created_at', 'Added missing timestamp column');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        PERFORM log_fix('users', 'updated_at', 'Added missing timestamp column');
    END IF;
END $$;

-- 2. Fix wallets table inconsistencies
DO $$
BEGIN
    -- Ensure user_id column exists with correct reference to users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'user_id') THEN
        ALTER TABLE public.wallets ADD COLUMN user_id UUID REFERENCES public.users(id);
        PERFORM log_fix('wallets', 'user_id', 'Added missing foreign key column');
    END IF;

    -- If both userId and user_id exist, synchronize them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'userId') AND
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'user_id') THEN
        UPDATE public.wallets SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;
        UPDATE public.wallets SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;
        PERFORM log_fix('wallets', 'user_id/userId', 'Synchronized column values');
    END IF;

    -- Ensure timestamp columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'created_at') THEN
        ALTER TABLE public.wallets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        PERFORM log_fix('wallets', 'created_at', 'Added missing timestamp column');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallets' AND column_name = 'updated_at') THEN
        ALTER TABLE public.wallets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        PERFORM log_fix('wallets', 'updated_at', 'Added missing timestamp column');
    END IF;
END $$;

-- 3. Fix refresh_tokens table
DO $$
BEGIN
    -- Ensure expires_at column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'expires_at') THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        PERFORM log_fix('refresh_tokens', 'expires_at', 'Added missing expiration column');
    END IF;

    -- Ensure proper user reference exists (either user_id or userId)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'user_id') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'refresh_tokens' AND column_name = 'userId') THEN
        ALTER TABLE public.refresh_tokens ADD COLUMN user_id UUID REFERENCES public.users(id);
        PERFORM log_fix('refresh_tokens', 'user_id', 'Added missing user reference column');
    END IF;
END $$;

-- 4. Fix user_devices table
DO $$
BEGIN
    -- Ensure both userId and user_id exist and are synchronized
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_devices' AND column_name = 'userId') THEN
        ALTER TABLE public.user_devices ADD COLUMN "userId" UUID;
        PERFORM log_fix('user_devices', 'userId', 'Added missing column');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_devices' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_devices ADD COLUMN user_id UUID REFERENCES public.users(id);
        PERFORM log_fix('user_devices', 'user_id', 'Added missing foreign key column');
    END IF;

    -- Synchronize user_id and userId columns
    UPDATE public.user_devices SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;
    UPDATE public.user_devices SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;
    PERFORM log_fix('user_devices', 'user_id/userId', 'Synchronized column values');

    -- Set NOT NULL constraints if values are populated
    IF EXISTS (SELECT 1 FROM public.user_devices WHERE "userId" IS NULL) THEN
        RAISE WARNING 'Some user_devices records have null userId values - not setting NOT NULL constraint';
    ELSE
        ALTER TABLE public.user_devices ALTER COLUMN "userId" SET NOT NULL;
        PERFORM log_fix('user_devices', 'userId', 'Set NOT NULL constraint');
    END IF;

    -- Create synchronization trigger for future changes
    DROP TRIGGER IF EXISTS sync_user_id_trigger ON public.user_devices;
    
    CREATE OR REPLACE FUNCTION sync_user_id_columns()
    RETURNS TRIGGER AS 
    $BODY$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.user_id IS NULL AND NEW."userId" IS NOT NULL THEN
                NEW.user_id := NEW."userId";
            ELSIF NEW."userId" IS NULL AND NEW.user_id IS NOT NULL THEN
                NEW."userId" := NEW.user_id;
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF OLD.user_id IS DISTINCT FROM NEW.user_id AND OLD."userId" = NEW."userId" THEN
                NEW."userId" := NEW.user_id;
            ELSIF OLD."userId" IS DISTINCT FROM NEW."userId" AND OLD.user_id = NEW.user_id THEN
                NEW.user_id := NEW."userId";
            END IF;
        END IF;
        RETURN NEW;
    END;
    $BODY$
    LANGUAGE plpgsql;
    
    CREATE TRIGGER sync_user_id_trigger
    BEFORE INSERT OR UPDATE ON public.user_devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_id_columns();
    
    PERFORM log_fix('user_devices', 'user_id/userId', 'Created synchronization trigger');
END $$;

-- 5. Fix wallet_challenges table
DO $$
BEGIN
    -- Create if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_challenges') THEN
        CREATE TABLE public.wallet_challenges (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            wallet_address VARCHAR(255) NOT NULL,
            challenge_text TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
            is_used BOOLEAN DEFAULT FALSE
        );
        CREATE INDEX idx_wallet_challenges_address ON public.wallet_challenges(wallet_address);
        PERFORM log_fix('wallet_challenges', '*', 'Created wallet_challenges table');
    ELSE
        -- Ensure all expected columns exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_challenges' AND column_name = 'expires_at') THEN
            ALTER TABLE public.wallet_challenges ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes');
            PERFORM log_fix('wallet_challenges', 'expires_at', 'Added missing column');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wallet_challenges' AND column_name = 'is_used') THEN
            ALTER TABLE public.wallet_challenges ADD COLUMN is_used BOOLEAN DEFAULT FALSE;
            PERFORM log_fix('wallet_challenges', 'is_used', 'Added missing column');
        END IF;
    END IF;
END $$;

-- 6. Ensure wallet address indexes exist for fast lookups
DO $$
BEGIN
    -- Create index on users.walletAddress if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_wallet_address') THEN
        CREATE INDEX idx_users_wallet_address ON public.users(LOWER("walletAddress"));
        PERFORM log_fix('users', 'walletAddress', 'Added case-insensitive index');
    END IF;
    
    -- Create index on wallets.address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'wallets' AND indexname = 'idx_wallets_address') THEN
        CREATE INDEX idx_wallets_address ON public.wallets(LOWER(address));
        PERFORM log_fix('wallets', 'address', 'Added case-insensitive index');
    END IF;
END $$;

-- Display a summary of all fixes applied
SELECT table_name, count(*) as fixes_applied, array_agg(distinct action) as actions
FROM schema_fix_log 
GROUP BY table_name
ORDER BY fixes_applied DESC;

-- Check for any remaining issues (tables without timestamps, etc.)
DO $$
DECLARE
    tbl_record RECORD;
BEGIN
    RAISE NOTICE 'Checking for any remaining potential issues:';
    
    FOR tbl_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND 
              table_type = 'BASE TABLE' AND
              table_name NOT IN ('migrations', 'typeorm_metadata')
    LOOP
        -- Check for missing timestamp columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_record.table_name AND column_name = 'created_at') THEN
            RAISE WARNING 'Table % is missing created_at timestamp', tbl_record.table_name;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_record.table_name AND column_name = 'updated_at') THEN
            RAISE WARNING 'Table % is missing updated_at timestamp', tbl_record.table_name;
        END IF;
        
        -- Check for id type consistency
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_record.table_name AND column_name = 'id') THEN
            RAISE WARNING 'Table % has no primary id column', tbl_record.table_name;
        ELSE
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl_record.table_name AND column_name = 'id' AND data_type != 'uuid') THEN
                RAISE WARNING 'Table % has non-UUID id column', tbl_record.table_name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Commit all changes
COMMIT;

-- Note: This script applies all changes in a single transaction.
-- If any errors occur, all changes will be rolled back for safety.
-- Run this script periodically or whenever schema issues are suspected.