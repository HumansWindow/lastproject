-- Fix wallet-user relationships with proper case sensitivity
DO $$
BEGIN
    UPDATE public.wallets w
    SET user_id = u.id
    FROM public.users u
    WHERE LOWER(w.address) = LOWER(u."walletAddress")
    AND w.user_id IS NULL
    AND u.id IS NOT NULL;
    
    RAISE NOTICE 'Updated wallet-user relationships';
END $$;
