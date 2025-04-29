-- Add minting-related columns to users table

-- Add missing minting-related columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_mint_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS minted_amount DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_expired_tokens BOOLEAN DEFAULT FALSE;

-- Add comments for clarity
COMMENT ON COLUMN public.users.last_mint_date IS 'Date when the user last minted tokens';
COMMENT ON COLUMN public.users.token_expiry_date IS 'Date when the user tokens expire';
COMMENT ON COLUMN public.users.minted_amount IS 'Amount of tokens minted by the user';
COMMENT ON COLUMN public.users.has_expired_tokens IS 'Flag indicating if the user has any expired tokens';