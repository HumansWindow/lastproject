-- Script to delete users from the Alive-Db database with proper cleanup
-- WARNING: This will permanently delete users and related data! Make a backup before running.

-- Transaction to ensure all operations complete successfully or rollback
BEGIN;

-- Function to delete a single user by ID with proper cleanup
CREATE OR REPLACE FUNCTION delete_user_by_id(user_id_param UUID) RETURNS VOID AS $$
BEGIN
    -- Delete user sessions
    DELETE FROM public.user_sessions WHERE user_id = user_id_param;
    
    -- Delete user devices
    DELETE FROM public.user_devices WHERE user_id = user_id_param;
    
    -- Delete wallets associated with user
    DELETE FROM public.wallets WHERE user_id = user_id_param;
    
    -- Delete referrals where user is either referrer or referee
    DELETE FROM public.referrals WHERE referrer_id = user_id_param OR referee_id = user_id_param;
    
    -- Delete user tokens/claims if they exist
    DELETE FROM public.user_tokens WHERE user_id = user_id_param;
    
    -- Delete user achievements if they exist
    DELETE FROM public.user_achievements WHERE user_id = user_id_param;
    
    -- Delete user settings if they exist
    DELETE FROM public.user_settings WHERE user_id = user_id_param;
    
    -- Finally delete the user
    DELETE FROM public.users WHERE id = user_id_param;
    
    RAISE NOTICE 'Successfully deleted user with ID: %', user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- Replace the UUID below with the actual user ID you want to delete
-- SELECT delete_user_by_id('11111111-1111-1111-1111-111111111111');

-- To delete user by email (safer than direct ID)
CREATE OR REPLACE FUNCTION delete_user_by_email(email_param TEXT) RETURNS VOID AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Find the user ID by email
    SELECT id INTO user_id_var FROM public.users WHERE email = email_param;
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No user found with email: %', email_param;
    END IF;
    
    -- Call the delete_user_by_id function
    PERFORM delete_user_by_id(user_id_var);
    
    RAISE NOTICE 'Successfully deleted user with email: %', email_param;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- Replace with the email of the user you want to delete
-- SELECT delete_user_by_email('user@example.com');

-- To delete user by wallet address
CREATE OR REPLACE FUNCTION delete_user_by_wallet(wallet_address_param TEXT) RETURNS VOID AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- Find user by wallet address stored directly in user table
    SELECT id INTO user_id_var FROM public.users 
    WHERE LOWER(walletAddress) = LOWER(wallet_address_param);
    
    -- If not found in users table, check wallets table
    IF user_id_var IS NULL THEN
        SELECT user_id INTO user_id_var 
        FROM public.wallets 
        WHERE LOWER(address) = LOWER(wallet_address_param);
    END IF;
    
    -- Check if user exists
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'No user found with wallet address: %', wallet_address_param;
    END IF;
    
    -- Call the delete_user_by_id function
    PERFORM delete_user_by_id(user_id_var);
    
    RAISE NOTICE 'Successfully deleted user with wallet address: %', wallet_address_param;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- Replace with the wallet address of the user you want to delete
-- SELECT delete_user_by_wallet('0xD2D53A3E16cf5dd2634Dd376bDc7CE81bD0F76Ff');

-- To delete all users matching a pattern (DANGER: USE WITH CAUTION!)
CREATE OR REPLACE FUNCTION delete_users_by_pattern(email_pattern TEXT) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Find all users matching the pattern
    FOR user_record IN 
        SELECT id FROM public.users WHERE email LIKE email_pattern
    LOOP
        -- Delete each matching user
        PERFORM delete_user_by_id(user_record.id);
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example usage: 
-- Delete all test users with emails containing 'test'
-- SELECT delete_users_by_pattern('%test%');

COMMIT;

-- Usage instructions:
-- 1. Connect to your database: psql -U Aliveadmin -d "Alive-Db"
-- 2. Run this script: \i /path/to/delete-users.sql
-- 3. Delete a specific user using one of the functions:
--    SELECT delete_user_by_id('user-uuid-here');
--    SELECT delete_user_by_email('user@example.com');
--    SELECT delete_user_by_wallet('0xWalletAddressHere');