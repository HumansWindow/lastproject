#!/bin/bash

# This script applies comprehensive database fixes to standardize column naming
# It addresses issues with column naming inconsistencies that are causing errors

echo "Applying comprehensive database fixes..."

# Database connection details from environment variables or defaults
DB_USER="${DB_USERNAME:-Aliveadmin}"
DB_PASSWORD="${DB_PASSWORD:-alivehumans@2024}"
DB_NAME="${DB_DATABASE:-Alive-Db}"

# Create a temporary .pgpass file for password-less authentication
echo "localhost:5432:${DB_NAME}:${DB_USER}:${DB_PASSWORD}" > ~/.pgpass
chmod 600 ~/.pgpass

echo "Applying database fixes from complete-db-fix.sql..."
psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/complete-db-fix.sql"
RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "✅ Database schema fixes applied successfully!"
else
  echo "❌ Error applying database fixes. Exit code: $RESULT"
  # Try with sudo if regular command fails
  echo "Trying with sudo..."
  echo "localhost:5432:${DB_NAME}:${DB_USER}:${DB_PASSWORD}" | sudo tee /var/lib/postgresql/.pgpass > /dev/null
  sudo chmod 600 /var/lib/postgresql/.pgpass
  sudo chown postgres:postgres /var/lib/postgresql/.pgpass
  sudo -u postgres psql -h localhost -d "$DB_NAME" -f "$(dirname "$0")/complete-db-fix.sql"
  RESULT=$?
  if [ $RESULT -eq 0 ]; then
    echo "✅ Database schema fixes applied successfully with sudo!"
  else
    echo "❌ Error applying database fixes even with sudo. Exit code: $RESULT"
  fi
fi

# Clean up
rm ~/.pgpass 2>/dev/null
sudo rm /var/lib/postgresql/.pgpass 2>/dev/null

echo "Database fix process completed."