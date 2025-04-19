-- Add missing verification_token column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

