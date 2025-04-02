-- Add token expiry tracking fields to the users table

-- Check if columns already exist before adding them
DO $$
BEGIN
    -- Add last_mint_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_mint_date'
    ) THEN
        ALTER TABLE users ADD COLUMN last_mint_date TIMESTAMP;
    END IF;

    -- Add token_expiry_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'token_expiry_date'
    ) THEN
        ALTER TABLE users ADD COLUMN token_expiry_date TIMESTAMP;
    END IF;

    -- Add minted_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'minted_amount'
    ) THEN
        ALTER TABLE users ADD COLUMN minted_amount DECIMAL(18,8) DEFAULT 0;
    END IF;

    -- Add has_expired_tokens column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'has_expired_tokens'
    ) THEN
        ALTER TABLE users ADD COLUMN has_expired_tokens BOOLEAN DEFAULT false;
    END IF;

    -- Create an index on token_expiry_date for faster queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_token_expiry'
    ) THEN
        CREATE INDEX idx_users_token_expiry ON users(token_expiry_date);
    END IF;

    -- Create an index on wallet_address for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'idx_users_wallet_address'
    ) THEN
        CREATE INDEX idx_users_wallet_address ON users(wallet_address);
    END IF;

    RAISE NOTICE 'Token expiry tracking fields added successfully';
END $$;

-- Add a comment to explain the schema change
COMMENT ON COLUMN users.last_mint_date IS 'Timestamp of when tokens were last minted for this user';
COMMENT ON COLUMN users.token_expiry_date IS 'Date when the user''s tokens will expire (1 year after minting)';
COMMENT ON COLUMN users.minted_amount IS 'Total amount of tokens minted for this user';
COMMENT ON COLUMN users.has_expired_tokens IS 'Flag indicating whether expired tokens have already been burned';