-- Migration script to standardize ID fields in the database
-- This script addresses inconsistencies in user ID fields and related foreign keys

-- Step 1: Begin transaction to ensure all changes succeed or fail together
BEGIN;

-- Step 2: Handle any duplicate or inconsistent user_id fields in the users table
-- First, identify if we have any inconsistencies where user_id != id
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO inconsistent_count 
    FROM users 
    WHERE user_id IS NOT NULL AND user_id != id::text;
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE 'Found % users with inconsistent user_id values', inconsistent_count;
        -- We won't automatically fix these as they might require manual review
    END IF;
END $$;

-- Step 3: Update the refresh_tokens table to ensure it uses user_id consistently
-- First check if the column exists with a different name
DO $$
BEGIN
    IF EXISTS(SELECT column_name FROM information_schema.columns 
        WHERE table_name='refresh_tokens' AND column_name='userid') THEN
        
        -- Rename the column to the standard snake_case format
        ALTER TABLE refresh_tokens RENAME COLUMN userid TO user_id;
        
        RAISE NOTICE 'Renamed refresh_tokens.userid to user_id';
    END IF;
END $$;

-- Step 4: Standardize wallet table to ensure consistent user_id field
DO $$
BEGIN
    -- Check if any inconsistent naming exists
    IF EXISTS(SELECT column_name FROM information_schema.columns 
        WHERE table_name='wallets' AND column_name='userid') THEN
        
        -- Create a temporary column with the correct name if needed
        ALTER TABLE wallets ADD COLUMN IF NOT EXISTS user_id UUID;
        
        -- Copy data if the old column exists
        UPDATE wallets SET user_id = userid::uuid WHERE userid IS NOT NULL AND user_id IS NULL;
        
        -- Drop the old column after ensuring data is transferred
        ALTER TABLE wallets DROP COLUMN IF EXISTS userid;
        
        RAISE NOTICE 'Standardized wallets.userid to user_id';
    END IF;
END $$;

-- Step 5: Ensure foreign key constraints use the standard naming pattern
-- We'll check each table's constraints and adjust as needed
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name, kcu.column_name,
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND (kcu.column_name LIKE '%id' OR kcu.column_name LIKE '%Id')
            AND kcu.column_name NOT LIKE '%_id'  -- Identify non-snake_case FK columns
    LOOP
        RAISE NOTICE 'Found non-standard FK column: %.% referencing %.%', 
              constraint_record.table_name, 
              constraint_record.column_name, 
              constraint_record.foreign_table_name, 
              constraint_record.foreign_column_name;
        
        -- To modify constraints, you would need to add specific ALTER TABLE statements here
        -- This is just identifying the issues for now
    END LOOP;
END $$;

-- Step 6: Validate the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND (column_name = 'id' OR column_name LIKE '%_id' OR column_name LIKE '%id')
ORDER BY 
    table_name, column_name;

-- Step 7: Commit the transaction if everything looks good
COMMIT;