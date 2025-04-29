
-- Create a complete fix for the verification tokens issue
-- This script ensures columns exist with proper name and case

-- For verification_token column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);

-- For reset_password_token column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);

-- For reset_password_expires column
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Check that TypeORM user columns exist
\d public.users

