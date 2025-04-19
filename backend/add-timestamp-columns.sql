-- Add timestamp columns to users and wallets tables

-- Add missing timestamp columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing timestamp columns to wallets table
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add comments for clarity
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN public.wallets.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.wallets.updated_at IS 'Timestamp when the record was last updated';