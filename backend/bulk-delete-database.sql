-- DANGER: This script will delete ALL data from your database
-- Make a backup before running this script!
-- This script maintains the table structure but removes all data

BEGIN;

-- Disable foreign key constraints temporarily to allow deletion in any order
SET CONSTRAINTS ALL DEFERRED;

-- Clear all tables (listed in order to minimize foreign key issues)
TRUNCATE TABLE public.user_sessions CASCADE;
TRUNCATE TABLE public.user_devices CASCADE;
TRUNCATE TABLE public.user_achievements CASCADE;
TRUNCATE TABLE public.user_settings CASCADE;
TRUNCATE TABLE public.user_tokens CASCADE;
TRUNCATE TABLE public.wallets CASCADE;
TRUNCATE TABLE public.referrals CASCADE;
TRUNCATE TABLE public.referral_uses CASCADE;
TRUNCATE TABLE public.referral_rewards CASCADE;
TRUNCATE TABLE public.nfts CASCADE;
TRUNCATE TABLE public.collections CASCADE;
TRUNCATE TABLE public.token_mints CASCADE;
TRUNCATE TABLE public.token_transfers CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.users CASCADE;

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
        EXECUTE 'ALTER SEQUENCE public.' || rec.sequence_name || ' RESTART WITH 1';
    END LOOP;
END $$;

COMMIT;

-- Alternative: Drop and recreate database (requires superuser privileges)
-- You would run this instead of the above commands if you want to completely reset:
-- 
-- 1. Connect to postgres database first:
--    sudo -u postgres psql postgres
-- 
-- 2. Then run:
--    DROP DATABASE "Alive-Db";
--    CREATE DATABASE "Alive-Db" WITH OWNER = "Aliveadmin" ENCODING = 'UTF8';
-- 
-- 3. Then reconnect and rerun all your migration scripts