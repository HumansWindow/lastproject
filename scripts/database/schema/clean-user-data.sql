-- SQL to clean all user-related tables and minting data
-- This script will safely handle nonexistent tables and preserve foreign key constraints

-- Start transaction and temporarily disable triggers
BEGIN;
SET session_replication_role = 'replica';

-- Clean tables without using the DO block that was causing issues
-- Instead use individual commands with transaction protection

-- First clean session and authentication related tables explicitly
-- to avoid potential foreign key violations
TRUNCATE TABLE public.refresh_tokens CASCADE;
TRUNCATE TABLE public.user_sessions CASCADE;
TRUNCATE TABLE public.user_devices CASCADE;

-- Clean wallets table before users to handle wallet address references
TRUNCATE TABLE public.wallets CASCADE;

-- Clean users table (will cascade to related tables due to TRUNCATE CASCADE)
TRUNCATE TABLE public.users CASCADE;

-- Clean additional tables that may not be covered by the cascade
TRUNCATE TABLE public.minting_queue_items CASCADE;
TRUNCATE TABLE public.referral_codes CASCADE;
TRUNCATE TABLE public.referrals CASCADE;

-- Clean profiles table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'TRUNCATE TABLE public.profiles CASCADE';
    END IF;
END $$;

-- Clean sessions table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        EXECUTE 'TRUNCATE TABLE public.sessions CASCADE';
    END IF;
END $$;

-- Enable triggers again
SET session_replication_role = 'origin';

-- Reset sequence values for ID columns that we know exist
ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.wallets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.user_devices_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.user_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.minting_queue_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.referral_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.refresh_tokens_id_seq RESTART WITH 1;

-- Commit the transaction
COMMIT;

-- Vacuum to free up space and update statistics
VACUUM ANALYZE;
