-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referrerId" UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Check if wallet_address exists and rename it to walletAddress if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_address') THEN
        ALTER TABLE users RENAME COLUMN wallet_address TO "walletAddress";
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'walletAddress') THEN
        ALTER TABLE users ADD COLUMN "walletAddress" VARCHAR(255);
    END IF;
END $$;

-- Make sure wallets table has proper structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallets') THEN
        -- Check if userId exists and rename it
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'userId') THEN
            ALTER TABLE wallets RENAME COLUMN "userId" TO user_id;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'user_id') THEN
            ALTER TABLE wallets ADD COLUMN user_id UUID;
        END IF;
        
        -- Add other missing columns if needed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'privateKey') THEN
            ALTER TABLE wallets ADD COLUMN "privateKey" VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'chain') THEN
            ALTER TABLE wallets ADD COLUMN chain VARCHAR(50) DEFAULT 'ETH';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'isActive') THEN
            ALTER TABLE wallets ADD COLUMN "isActive" BOOLEAN DEFAULT true;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'created_at') THEN
            ALTER TABLE wallets ADD COLUMN created_at TIMESTAMP DEFAULT now();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'updated_at') THEN
            ALTER TABLE wallets ADD COLUMN updated_at TIMESTAMP DEFAULT now();
        END IF;
    ELSE
        -- Create wallets table if it doesn't exist
        CREATE TABLE wallets (
            id UUID NOT NULL DEFAULT uuid_generate_v4(),
            address VARCHAR(255) NOT NULL,
            "privateKey" VARCHAR(255),
            chain VARCHAR(50) DEFAULT 'ETH',
            user_id UUID NOT NULL,
            "isActive" BOOLEAN DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT now(),
            updated_at TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT PK_wallets PRIMARY KEY (id)
        );
        
        CREATE INDEX IDX_wallets_address ON wallets (address);
        CREATE INDEX IDX_wallets_user_id ON wallets (user_id);
    END IF;
END $$;

-- Grant permissions to Aliveadmin user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "Aliveadmin";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "Aliveadmin";