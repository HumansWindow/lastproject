#!/bin/bash

# Get the database credentials from the .env file
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2)
DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
DB_DATABASE=$(grep DB_DATABASE .env | cut -d '=' -f2)

echo "Creating SQL fix script..."

# Echo the SQL commands to a temporary file
cat > fix-wallet-column.sql << EOF
-- First, ensure we're in a transaction
BEGIN;

-- Look at the existing wallets table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallets';

-- Find current foreign key constraints on wallets table
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='wallets';

-- Find foreign key constraints referencing wallets table
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='wallets';

-- Instead of dropping the table, we'll alter the existing one
-- First, standardize the user_id column

-- If both userId and user_id exist and have values:
UPDATE wallets
SET "userId" = user_id
WHERE "userId" IS NULL AND user_id IS NOT NULL;

-- Create a function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(tbl text, col text) RETURNS boolean AS
\$\$
DECLARE
    exists boolean;
BEGIN
    SELECT count(*) > 0 INTO exists
    FROM information_schema.columns
    WHERE table_name = tbl AND column_name = col;
    RETURN exists;
END;
\$\$ LANGUAGE plpgsql;

-- Drop the user_id column if both userId and user_id exist
DO \$\$
BEGIN
    IF column_exists('wallets', 'userId') AND column_exists('wallets', 'user_id') THEN
        ALTER TABLE wallets DROP COLUMN user_id;
    ELSIF column_exists('wallets', 'user_id') AND NOT column_exists('wallets', 'userId') THEN
        ALTER TABLE wallets RENAME COLUMN user_id TO "userId";
    END IF;
END \$\$;

-- Now do the same for timestamp columns if needed
DO \$\$
BEGIN
    IF column_exists('wallets', 'createdAt') AND column_exists('wallets', 'created_at') THEN
        ALTER TABLE wallets DROP COLUMN created_at;
    ELSIF column_exists('wallets', 'created_at') AND NOT column_exists('wallets', 'createdAt') THEN
        ALTER TABLE wallets RENAME COLUMN created_at TO "createdAt";
    END IF;
END \$\$;

DO \$\$
BEGIN
    IF column_exists('wallets', 'updatedAt') AND column_exists('wallets', 'updated_at') THEN
        ALTER TABLE wallets DROP COLUMN updated_at;
    ELSIF column_exists('wallets', 'updated_at') AND NOT column_exists('wallets', 'updatedAt') THEN
        ALTER TABLE wallets RENAME COLUMN updated_at TO "updatedAt";
    END IF;
END \$\$;

-- Ensure the userId column has NOT NULL constraint
ALTER TABLE wallets ALTER COLUMN "userId" SET NOT NULL;

-- Check the final table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallets';

-- Clean up our function
DROP FUNCTION column_exists;

-- Commit the transaction
COMMIT;
EOF

echo "Running SQL fix script..."

# Run the SQL commands with error handling
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f fix-wallet-column.sql; then
    echo "Successfully fixed wallet table structure!"
else
    echo "Error fixing wallet table structure. Check the errors above."
    exit 1
fi

# Remove the temporary SQL file
rm fix-wallet-column.sql

echo "Wallet authentication database fix complete."
echo "Please restart your backend server for changes to take effect."