-- Clean user-related data from database without resetting sequences
-- Enhanced version to properly clean all user-related data for testing registration and minting

-- Start a transaction
BEGIN;

-- Disable triggers temporarily to avoid foreign key constraint issues
SET session_replication_role = 'replica';

-- Clean all tables using DO block with proper error handling
DO $$
DECLARE
  _table text;
  _tables text[] := ARRAY[
    'minting_queue_items',
    'user_nfts',
    'user_transactions',
    'user_wallet_balances',
    'user_sessions',
    'user_refresh_tokens',
    'user_devices',
    'user_access_tokens',
    'user_settings',
    'user_profiles',
    'user_referrals',
    'user_rewards',
    'user_notifications',
    'diary_entries',
    'wallet_connections',
    'verification_tokens',
    'user_preferences',
    'user_login_history',
    'users'
  ];
BEGIN
  FOREACH _table IN ARRAY _tables
  LOOP
    BEGIN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(_table) || ' CASCADE';
      RAISE NOTICE 'Truncated table %.', _table;
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Table % does not exist, skipping.', _table;
    END;
  END LOOP;
END
$$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'All user data has been successfully deleted. Database is clean for testing registration and minting workflows.';
END $$;