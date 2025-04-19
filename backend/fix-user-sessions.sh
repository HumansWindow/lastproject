#!/bin/bash

# Script to apply fixes to user_sessions table

echo "Fixing user_sessions table schema..."

# Create temporary SQL file
cat > /tmp/fix-user-sessions.sql << 'EOSQL'
-- Fix user_sessions table column naming to match the entity
DO $$
BEGIN
    -- First, make sure the table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
        CREATE TABLE public.user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            device_id VARCHAR(255),
            token VARCHAR(500),
            ip_address VARCHAR(100),
            user_agent TEXT,
            expires_at TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            "endedAt" TIMESTAMP,
            duration INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- Make sure all required columns exist
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS token VARCHAR(500);
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS duration INTEGER;
    ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    -- Don't rename columns as they match the entity exactly, just ensure they exist
    -- The entity uses @Column({ name: 'user_id' }) so we keep column as user_id but class property as userId
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_user_sessions_user_id' 
        AND table_name = 'user_sessions'
    ) THEN
        -- Check if the users table has the id column
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id'
        ) THEN
            ALTER TABLE user_sessions 
            ADD CONSTRAINT FK_user_sessions_user_id
            FOREIGN KEY (user_id) 
            REFERENCES users(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS IDX_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS IDX_user_sessions_device_id ON user_sessions(device_id);
EOSQL

# Create a temporary .pgpass file for password-less authentication
echo "localhost:5432:Alive-Db:Aliveadmin:alivehumans@2024" > ~/.pgpass
chmod 600 ~/.pgpass

# Run the SQL script
echo "Executing SQL script..."
psql -h localhost -U Aliveadmin -d Alive-Db -f /tmp/fix-user-sessions.sql

# If psql fails, try with sudo
if [ $? -ne 0 ]; then
    echo "Failed to run SQL script directly, trying with sudo..."
    # Try with sudo if regular command fails
    sudo -u postgres psql -d Alive-Db -f /tmp/fix-user-sessions.sql
fi

# Clean up
rm ~/.pgpass 2>/dev/null
rm /tmp/fix-user-sessions.sql 2>/dev/null

echo "User_sessions table fix process completed."
