-- DANGER: This script will delete ALL data from your database
-- Make a backup before running this script!
-- This script targets only the specific tables that exist in your database

BEGIN;

-- Disable foreign key constraints temporarily to allow deletion in any order
SET CONSTRAINTS ALL DEFERRED;

-- Clear all tables in the correct order to avoid foreign key constraint issues
TRUNCATE TABLE public.user_sessions CASCADE;
TRUNCATE TABLE public.user_devices CASCADE;
TRUNCATE TABLE public.refresh_tokens CASCADE;
TRUNCATE TABLE public.nfts CASCADE;
TRUNCATE TABLE public.nft_collections CASCADE;
TRUNCATE TABLE public.referral_codes CASCADE;
TRUNCATE TABLE public.referrals CASCADE;
TRUNCATE TABLE public.wallets CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Skip migrations table as it tracks database schema updates
-- TRUNCATE TABLE public.migrations CASCADE;

-- Re-enable foreign key constraints
SET CONSTRAINTS ALL IMMEDIATE;

-- Reset sequences (auto-increment counters)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT sequence_name 
               FROM information_schema.sequences 
               WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(rec.sequence_name) || ' RESTART WITH 1';
        RAISE NOTICE 'Reset sequence: %', rec.sequence_name;
    END LOOP;
END $$;

COMMIT;

-- Confirm the tables are empty
SELECT table_name, (SELECT count(*) FROM public.users) as user_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'users';

SELECT 'All data has been cleared from the database.' AS result;