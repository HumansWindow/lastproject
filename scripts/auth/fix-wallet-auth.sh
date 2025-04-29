#!/bin/bash

# Get the database credentials from the .env file
DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2)
DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
DB_DATABASE=$(grep DB_DATABASE .env | cut -d '=' -f2)

# Echo the SQL commands to a temporary file
cat > fix-wallet-auth.sql << EOF
-- Check if the userId column exists, if not rename user_id to userId
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'userId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wallets' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE wallets RENAME COLUMN user_id TO "userId";
    END IF;
END
\$\$;

-- Output the current schema for validation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets';
EOF

# Run the SQL commands using PGPASSWORD to avoid password prompt
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -f fix-wallet-auth.sql

# Remove the temporary SQL file
rm fix-wallet-auth.sql

echo "Wallet authentication database check complete."