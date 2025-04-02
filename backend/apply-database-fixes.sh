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