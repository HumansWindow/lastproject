
-- Create a script to inspect column names in the users table
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users';

