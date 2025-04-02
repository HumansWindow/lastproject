-- Clean user-related data from database without resetting sequences

-- Start a transaction
BEGIN;

-- Delete all data from tables with CASCADE to handle dependencies automatically
TRUNCATE TABLE users CASCADE;

-- Commit the transaction
COMMIT;

-- Confirmation message
DO $$
BEGIN
  RAISE NOTICE 'All user data has been successfully deleted';
END $$;