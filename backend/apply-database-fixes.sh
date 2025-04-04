#!/bin/bash

# Check if a script name was provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <sql-script-file> [additional-script-files...]"
    exit 1
fi

echo "Applying database schema fixes..."

# Database connection details
DB_NAME="Alive-Db"
DB_USER="alivegod"

echo "Attempting to connect to database $DB_NAME..."

# Loop through each provided script
for script in "$@"; do
    if [ -f "$script" ]; then
        echo "Applying fixes from $script..."
        
        # Get script name without extension for logging
        script_name=$(basename "$script" .sql)
        
        # Add explicit output for token expiry fields
        if [[ "$script" == *token-expiry-fields* ]]; then
            echo "Applying token expiry fields to users table..."
            
            # Use sudo to avoid permission issues
            sudo -u postgres psql -d "$DB_NAME" << EOF
-- Add token expiry tracking fields to the users table

-- Check if columns already exist before adding them
DO \$\$
BEGIN
    -- Add last_mint_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_mint_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_mint_date TIMESTAMP;
        RAISE NOTICE 'Added last_mint_date column';
    END IF;

    -- Add token_expiry_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'token_expiry_date'
    ) THEN
        ALTER TABLE users ADD COLUMN token_expiry_date TIMESTAMP;
        RAISE NOTICE 'Added token_expiry_date column';
    END IF;

    -- Add minted_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'minted_amount'
    ) THEN
        ALTER TABLE users ADD COLUMN minted_amount DECIMAL(18,8) DEFAULT 0;
        RAISE NOTICE 'Added minted_amount column';
    END IF;

    -- Add has_expired_tokens column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'has_expired_tokens'
    ) THEN
        ALTER TABLE users ADD COLUMN has_expired_tokens BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added has_expired_tokens column';
    END IF;

    -- Create an index on token_expiry_date for faster queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_token_expiry'
    ) THEN
        CREATE INDEX idx_users_token_expiry ON users(token_expiry_date);
        RAISE NOTICE 'Created index on token_expiry_date';
    END IF;

    -- Create an index on walletAddress (camelCase) for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_wallet_address'
    ) THEN
        -- First check which column name exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'walletAddress'
        ) THEN
            -- Use camelCase if that exists
            CREATE INDEX idx_users_wallet_address ON users("walletAddress");
            RAISE NOTICE 'Created index on walletAddress (camelCase)';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'wallet_address'
        ) THEN
            -- Use snake_case if that exists
            CREATE INDEX idx_users_wallet_address ON users(wallet_address);
            RAISE NOTICE 'Created index on wallet_address (snake_case)';
        ELSE
            RAISE NOTICE 'No wallet address column found to index';
        END IF;
    END IF;

    RAISE NOTICE 'Token expiry tracking fields processing completed';
END \$\$;

-- Add comments if possible (wrapped in try/catch)
DO \$\$
BEGIN
    BEGIN
        COMMENT ON COLUMN users.last_mint_date IS 'Timestamp of when tokens were last minted for this user';
        RAISE NOTICE 'Added comment on last_mint_date';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add comment on last_mint_date: %', SQLERRM;
    END;
    
    BEGIN
        COMMENT ON COLUMN users.token_expiry_date IS 'Date when the user''s tokens will expire (1 year after minting)';
        RAISE NOTICE 'Added comment on token_expiry_date';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add comment on token_expiry_date: %', SQLERRM;
    END;
    
    BEGIN
        COMMENT ON COLUMN users.minted_amount IS 'Total amount of tokens minted for this user';
        RAISE NOTICE 'Added comment on minted_amount';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add comment on minted_amount: %', SQLERRM;
    END;
    
    BEGIN
        COMMENT ON COLUMN users.has_expired_tokens IS 'Flag indicating whether expired tokens have already been burned';
        RAISE NOTICE 'Added comment on has_expired_tokens';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add comment on has_expired_tokens: %', SQLERRM;
    END;
END \$\$;

SELECT 'Token expiry fields added to users table' as result;
EOF
        # Add specific handling for diary table creation
        elif [[ "$script" == *create-diary-table* ]]; then
            echo "Creating diary table in database..."
            
            # Use sudo to avoid permission issues
            sudo -u postgres psql -d "$DB_NAME" << EOF
-- First check if uuid-ossp extension is available and install if needed
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        RAISE NOTICE 'Created uuid-ossp extension';
    END IF;
END \$\$;

-- Create the diary table
CREATE TABLE IF NOT EXISTS diaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    game_level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location VARCHAR(50) NOT NULL DEFAULT 'other',
    feeling VARCHAR(100),
    color VARCHAR(30),
    content TEXT NOT NULL,
    has_media BOOLEAN DEFAULT FALSE,
    media_paths TEXT[],
    is_stored_locally BOOLEAN DEFAULT FALSE,
    encryption_key VARCHAR(128),
    user_id UUID NOT NULL
);

-- Check if users table has id as UUID or INTEGER and adapt foreign key
DO \$\$
DECLARE
    user_id_type TEXT;
BEGIN
    -- Check users table id column type
    SELECT data_type INTO user_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_user'
    ) THEN
        ALTER TABLE diaries DROP CONSTRAINT fk_user;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;
    
    -- Add appropriate constraint based on users table id type
    IF user_id_type = 'uuid' THEN
        -- If user_id is UUID, ensure diary.user_id is also UUID
        ALTER TABLE diaries ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
        ALTER TABLE diaries ADD CONSTRAINT fk_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key with UUID type';
    ELSIF user_id_type = 'integer' THEN
        -- If user_id is INTEGER, ensure diary.user_id is also INTEGER
        ALTER TABLE diaries ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
        ALTER TABLE diaries ADD CONSTRAINT fk_user 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key with INTEGER type';
    ELSE
        RAISE NOTICE 'Users table id column has unexpected type: %', user_id_type;
    END IF;
END \$\$;

-- Add index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diaries(user_id);

-- Add index for created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diaries(created_at);

-- Grant appropriate permissions - adjust app_user to your actual database user
DO \$\$
BEGIN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON diaries TO ' || current_user;
    RAISE NOTICE 'Granted permissions to %', current_user;
    
    -- Try to grant to app_user if exists
    BEGIN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON diaries TO app_user';
        RAISE NOTICE 'Granted permissions to app_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not grant permissions to app_user: %', SQLERRM;
    END;
    
    -- Try to grant to alivegod if exists
    BEGIN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON diaries TO alivegod';
        RAISE NOTICE 'Granted permissions to alivegod';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not grant permissions to alivegod: %', SQLERRM;
    END;
END \$\$;

SELECT 'Diary table created successfully' as result;
EOF
        else
            # For other scripts, just execute them normally
            echo "Fixing ${script_name} table schema..."
            sudo -u postgres psql -d "$DB_NAME" -f "$script" 
        fi
    else
        echo "Error: Script file $script not found."
    fi
done

echo "Database schema fixes applied. Please restart your application."