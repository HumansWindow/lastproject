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
    user_id INTEGER NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add index for faster querying by user_id
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diaries(user_id);

-- Add index for created_at for sorting by date
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diaries(created_at);

-- Add diary_location enum type if not using VARCHAR
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diary_location') THEN
--         CREATE TYPE diary_location AS ENUM (
--             'in_dream',
--             'in_sleep',
--             'in_memories',
--             'in_awaking',
--             'in_meditation',
--             'in_conversation',
--             'other'
--         );
--         
--         -- ALTER TABLE diaries ALTER COLUMN location TYPE diary_location USING location::diary_location;
--     END IF;
-- END $$;

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON diaries TO app_user;