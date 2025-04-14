-- SQL to clean all user-related tables and minting data
-- This script will safely handle nonexistent tables and preserve foreign key constraints

-- Start transaction and temporarily disable triggers
BEGIN;
SET session_replication_role = 'replica';

-- First check which tables actually exist
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Clean minting queue items if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'minting_queue_items') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: minting_queue_items';
        EXECUTE 'TRUNCATE TABLE public.minting_queue_items CASCADE';
    END IF;

    -- Clean user devices if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_devices') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: user_devices';
        EXECUTE 'TRUNCATE TABLE public.user_devices CASCADE';
    END IF;

    -- Clean wallets if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: wallets';
        EXECUTE 'TRUNCATE TABLE public.wallets CASCADE';
    END IF;

    -- Clean referrals if table exists (correct table name)
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_codes') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: referral_codes';
        EXECUTE 'TRUNCATE TABLE public.referral_codes CASCADE';
    END IF;

    -- Alternative referral table - referrals instead of referral_uses
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referrals') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: referrals';
        EXECUTE 'TRUNCATE TABLE public.referrals CASCADE';
    END IF;

    -- Clean auth tokens if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auth_tokens') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: auth_tokens';
        EXECUTE 'TRUNCATE TABLE public.auth_tokens CASCADE';
    END IF;

    -- Clean sessions if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: sessions';
        EXECUTE 'TRUNCATE TABLE public.sessions CASCADE';
    END IF;

    -- Clean profiles if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: profiles';
        EXECUTE 'TRUNCATE TABLE public.profiles CASCADE';
    END IF;

    -- Clean users if table exists
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') INTO table_exists;
    IF table_exists THEN
        RAISE NOTICE 'Truncating table: users';
        EXECUTE 'TRUNCATE TABLE public.users CASCADE';
    END IF;
END $$;

-- Enable triggers again
SET session_replication_role = 'origin';

-- Reset sequence values for ID columns if they exist
DO $$
DECLARE
    sequence_exists BOOLEAN;
    sequence_name TEXT;
BEGIN
    -- For users table
    SELECT pg_get_serial_sequence('public.users', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For wallets table
    SELECT pg_get_serial_sequence('public.wallets', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For user_devices table
    SELECT pg_get_serial_sequence('public.user_devices', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For minting_queue_items table
    SELECT pg_get_serial_sequence('public.minting_queue_items', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For referral_codes table
    SELECT pg_get_serial_sequence('public.referral_codes', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For referrals table (alternative to referral_uses)
    SELECT pg_get_serial_sequence('public.referrals', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For auth_tokens table
    SELECT pg_get_serial_sequence('public.auth_tokens', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For sessions table
    SELECT pg_get_serial_sequence('public.sessions', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;

    -- For profiles table
    SELECT pg_get_serial_sequence('public.profiles', 'id') INTO sequence_name;
    IF sequence_name IS NOT NULL THEN
        EXECUTE 'SELECT setval(''' || sequence_name || ''', 1, false)';
    END IF;
END $$;

-- Commit the transaction
COMMIT;

-- Vacuum to free up space and update statistics
VACUUM ANALYZE;
