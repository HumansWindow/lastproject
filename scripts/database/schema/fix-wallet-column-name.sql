-- Script to rename the column from userId to user_id in the wallets table
-- This will fix the error: null value in column "userId" of relation "wallets" violates not-null constraint

-- Check if the column exists first and then rename it
DO $$
BEGIN
    -- Check if the column 'userId' exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'wallets'
        AND column_name = 'userId'
    ) THEN
        -- Rename the column from 'userId' to 'user_id'
        ALTER TABLE wallets RENAME COLUMN "userId" TO "user_id";
        RAISE NOTICE 'Column "userId" renamed to "user_id"';
    ELSE
        RAISE NOTICE 'Column "userId" does not exist in wallets table.';
        
        -- Check if user_id already exists
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'wallets'
            AND column_name = 'user_id'
        ) THEN
            RAISE NOTICE 'Column "user_id" already exists in wallets table.';
        ELSE
            RAISE NOTICE 'Neither "userId" nor "user_id" columns exist. This is unexpected.';
        END IF;
    END IF;

    -- Show all column names in the wallets table for debugging
    RAISE NOTICE 'Columns in wallets table: %', (
        SELECT string_agg(column_name, ', ')
        FROM information_schema.columns
        WHERE table_name = 'wallets'
    );
END $$;