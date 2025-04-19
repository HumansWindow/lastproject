-- Fix column case sensitivity issue in wallet-user relationship update

-- First check how the column is actually named in the database
DO $$
DECLARE
    actual_column_name TEXT;
BEGIN
    SELECT column_name INTO actual_column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND lower(column_name) = 'walletaddress';
    
    RAISE NOTICE 'Actual column name in users table: %', actual_column_name;
    
    -- Update the wallets table using the correct column case
    IF actual_column_name IS NOT NULL THEN
        EXECUTE format('
            UPDATE public.wallets w
            SET user_id = u.id
            FROM public.users u
            WHERE LOWER(w.address) = LOWER(u.%I)
            AND w.user_id IS NULL
            AND u.id IS NOT NULL', actual_column_name);
        
        RAISE NOTICE 'Updated wallet-user relationships using column name: %', actual_column_name;
    ELSE
        RAISE NOTICE 'Could not find a wallet address column in the users table';
    END IF;
END $$;

-- Recreate any necessary foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_wallets_users' 
        AND contype = 'f'
    ) THEN
        BEGIN
            ALTER TABLE public.wallets
            ADD CONSTRAINT fk_wallets_users
            FOREIGN KEY (user_id)
            REFERENCES public.users(id);
            
            RAISE NOTICE 'Added foreign key constraint to wallets table';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'Foreign key constraint already exists';
        END;
    END IF;
END $$;
