-- Update script for adding the standard user_id fields
-- to tables that were updated in the entity files

-- First check the data type of users.id to determine how to set up relationships
DO $$
DECLARE
    id_type TEXT;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'id';
      
    RAISE NOTICE 'Users ID column type is: %', id_type;
END $$;

-- Check if token_transactions table exists and add user_id if needed
DO $$
DECLARE
    id_type TEXT;
BEGIN
    -- Get the data type of users.id
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'id';
      
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'token_transactions') THEN
        -- Check if user_id column already exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'token_transactions' 
                      AND column_name = 'user_id') THEN
            -- Add user_id column with matching data type to users.id
            EXECUTE format('ALTER TABLE token_transactions ADD COLUMN user_id %s NULL', id_type);
            
            -- By default, set user_id to be the same as sender_id 
            -- This maintains data consistency with existing records
            UPDATE token_transactions SET user_id = sender_id;
            
            -- Add foreign key constraint
            ALTER TABLE token_transactions 
            ADD CONSTRAINT fk_token_transactions_users 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
            
            -- Create index for performance
            CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
            
            RAISE NOTICE 'Added user_id column to token_transactions table';
        ELSE
            RAISE NOTICE 'user_id column already exists in token_transactions table';
        END IF;
    ELSE
        RAISE NOTICE 'token_transactions table does not exist, skipping';
    END IF;
END $$;

-- Check if users table needs a self-referential user_id field
DO $$
DECLARE
    id_type TEXT;
BEGIN
    -- Get the data type of users.id
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name = 'id';
      
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        -- Check if user_id column already exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'users' 
                      AND column_name = 'user_id') THEN
            -- Add user_id column with matching data type to users.id
            EXECUTE format('ALTER TABLE users ADD COLUMN user_id %s NULL', id_type);
            
            -- Add foreign key constraint (self-referential)
            ALTER TABLE users 
            ADD CONSTRAINT fk_users_self_reference 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
            
            -- Create index for performance
            CREATE INDEX idx_users_user_id ON users(user_id);
            
            RAISE NOTICE 'Added user_id column to users table';
        ELSE
            RAISE NOTICE 'user_id column already exists in users table';
        END IF;
    ELSE
        RAISE NOTICE 'users table does not exist, skipping';
    END IF;
END $$;

-- Check if there are any fields that have inconsistent ID types
DO $$
DECLARE
    inconsistent_count INT;
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM information_schema.columns c1
    JOIN information_schema.columns c2 ON c1.table_schema = c2.table_schema
    WHERE c1.table_schema = 'public' 
      AND c1.column_name = 'user_id' 
      AND c2.table_name = 'users'
      AND c2.column_name = 'id'
      AND c1.data_type <> c2.data_type;
    
    IF inconsistent_count > 0 THEN
        RAISE NOTICE '% tables have user_id fields with types inconsistent with users.id', inconsistent_count;
    ELSE
        RAISE NOTICE 'All user ID fields have consistent types';
    END IF;
END $$;

-- Display completion message
SELECT 'Database update for user ID consistency completed.' AS result;