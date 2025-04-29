-- DANGER: This script will delete ALL data from your database
-- Make a backup before running this script!
-- This improved script checks if tables exist before truncating them

BEGIN;

-- Disable foreign key constraints temporarily to allow deletion in any order
SET CONSTRAINTS ALL DEFERRED;

-- Function to safely truncate a table if it exists
CREATE OR REPLACE FUNCTION safe_truncate(table_name text) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) THEN
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(table_name) || ' CASCADE';
        RAISE NOTICE 'Truncated table: %', table_name;
    ELSE
        RAISE NOTICE 'Skipping non-existent table: %', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- List all tables in the database
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    -- Skip system tables and only process user tables
    FOR table_rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(table_rec.tablename) || ' CASCADE';
        RAISE NOTICE 'Truncated table: %', table_rec.tablename;
    END LOOP;
END $$;

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

-- List the tables in the database after truncation
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_schema, table_name;