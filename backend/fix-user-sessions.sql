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

    -- Ensure consistency between camelCase and snake_case columns (entity uses both)
    -- The SQL will be executed only if the column exists but with a different name

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
        ALTER TABLE user_sessions 
        ADD CONSTRAINT FK_user_sessions_user_id
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS IDX_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS IDX_user_sessions_device_id ON user_sessions(device_id);
