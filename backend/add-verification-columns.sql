
-- Add verification_token column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- Add reset_password_token column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);

-- Add reset_password_expires column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

