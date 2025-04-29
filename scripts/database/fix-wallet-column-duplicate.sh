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

-- Make a backup of the wallets table
CREATE TABLE wallets_backup AS SELECT * FROM wallets;

-- Update user_id values where they are null but userId has values
UPDATE wallets SET user_id = "userId" WHERE user_id IS NULL AND "userId" IS NOT NULL;

-- Update userId values where they are null but user_id has values
UPDATE wallets SET "userId" = user_id WHERE "userId" IS NULL AND user_id IS NOT NULL;

-- Now create a new version of the table with the correct structure
CREATE TABLE wallets_new (
    id uuid PRIMARY KEY,
    address character varying NOT NULL,
    "privateKey" character varying,
    chain character varying DEFAULT 'ETH'::character varying,
    "userId" uuid NOT NULL,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);

-- Copy data from the old table to the new one
INSERT INTO wallets_new (id, address, "privateKey", chain, "userId", "isActive", "createdAt", "updatedAt")
SELECT id, address, "privateKey", chain, COALESCE("userId", user_id), "isActive", COALESCE("createdAt", created_at), COALESCE("updatedAt", updated_at)
FROM wallets;

-- Drop the old table and rename the new one
DROP TABLE wallets;
ALTER TABLE wallets_new RENAME TO wallets;

-- Re-add the foreign key constraint
ALTER TABLE wallets
ADD CONSTRAINT wallets_userId_fkey
FOREIGN KEY ("userId")
REFERENCES users(id) ON DELETE CASCADE;

-- Add indices for performance
CREATE INDEX wallets_userId_idx ON wallets("userId");
CREATE INDEX wallets_address_idx ON wallets(address);

-- Verify the new table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallets';

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