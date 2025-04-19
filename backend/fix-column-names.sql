
-- Fix column naming inconsistencies by standardizing on snake_case
UPDATE public.users 
SET verification_token = "verificationToken" 
WHERE verification_token IS NULL AND "verificationToken" IS NOT NULL;

UPDATE public.users 
SET reset_password_token = "resetPasswordToken" 
WHERE reset_password_token IS NULL AND "resetPasswordToken" IS NOT NULL;

UPDATE public.users 
SET reset_password_expires = "resetPasswordExpires" 
WHERE reset_password_expires IS NULL AND "resetPasswordExpires" IS NOT NULL;

-- Then drop the camelCase columns
ALTER TABLE public.users DROP COLUMN IF EXISTS "verificationToken";
ALTER TABLE public.users DROP COLUMN IF EXISTS "resetPasswordToken";
ALTER TABLE public.users DROP COLUMN IF EXISTS "resetPasswordExpires";

