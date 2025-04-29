-- Add the user_id column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id UUID;

-- Update the column to use the id value where it's null
UPDATE public.users SET user_id = id WHERE user_id IS NULL;
