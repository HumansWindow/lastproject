
-- Add created_at column to refresh_tokens table
ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- If there are existing tokens, update them with creation timestamp
UPDATE public.refresh_tokens SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

