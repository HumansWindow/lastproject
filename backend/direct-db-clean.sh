#!/bin/bash

# This script runs SQL commands directly without using a file

echo "========================================================"
echo "Starting direct database cleaning process for testing"
echo "========================================================"

# Database connection parameters
DB_NAME="Alive-Db"

# Run SQL command directly using sudo
sudo -u postgres psql -d "$DB_NAME" <<EOF
-- Start transaction and temporarily disable triggers
BEGIN;
SET session_replication_role = 'replica';

-- Clean minting queue items
TRUNCATE TABLE public.minting_queue_items CASCADE;

-- Clean user devices
TRUNCATE TABLE public.user_devices CASCADE;

-- Clean wallets
TRUNCATE TABLE public.wallets CASCADE;

-- Clean referrals 
TRUNCATE TABLE public.referral_codes CASCADE;
TRUNCATE TABLE public.referral_uses CASCADE;

-- Clean sessions and auth tokens
TRUNCATE TABLE public.auth_tokens CASCADE;
TRUNCATE TABLE public.sessions CASCADE;

-- Clean user profiles
TRUNCATE TABLE public.profiles CASCADE;

-- Clean user accounts
TRUNCATE TABLE public.users CASCADE;

-- Enable triggers again
SET session_replication_role = 'origin';

-- Reset sequence values for ID columns
SELECT setval(pg_get_serial_sequence('public.users', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.wallets', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.user_devices', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.minting_queue_items', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.referral_codes', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.referral_uses', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.auth_tokens', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.sessions', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), 1, false);

-- Commit the transaction
COMMIT;

-- Vacuum to free up space and update statistics
VACUUM ANALYZE;
EOF

# Check if the SQL execution was successful
if [ $? -eq 0 ]; then
    echo "========================================================"
    echo "Database cleaned successfully!"
    echo "The system is now ready for testing registration and minting."
    echo "========================================================"
    exit 0
else
    echo "========================================================"
    echo "Error: Database cleaning failed."
    echo "========================================================"
    exit 1
fi
