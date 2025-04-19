-- Add created_at column to refresh_tokens table
ALTER TABLE public.refresh_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

