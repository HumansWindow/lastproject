#!/bin/bash

# Find out who owns the tables in the database
echo "Checking table ownership..."
OWNER=$(psql -U Aliveadmin -d "Alive-Db" -c "\dt" -t | head -1 | awk '{print $4}')

if [ -z "$OWNER" ]; then
  echo "Could not determine table owner. Using postgres superuser."
  OWNER="postgres"
fi

echo "Table owner appears to be: $OWNER"

# Create a temporary SQL file with proper permissions statements
cat > backend/temp-db-fix.sql << EOL
-- Temporarily grant privileges to Aliveadmin
ALTER TABLE IF EXISTS user_devices OWNER TO Aliveadmin;
ALTER TABLE IF EXISTS user_sessions OWNER TO Aliveadmin;

-- Now run the schema modifications
DO \$\$
BEGIN
  -- Add user_agent column to user_sessions table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN user_agent TEXT NULL;
    RAISE NOTICE 'Added user_agent column to user_sessions table';
  ELSE
    RAISE NOTICE 'user_agent column already exists in user_sessions table';
  END IF;

  -- Add name column to user_devices table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'name'
  ) THEN
    ALTER TABLE user_devices ADD COLUMN name TEXT NULL;
    RAISE NOTICE 'Added name column to user_devices table';
  ELSE
    RAISE NOTICE 'name column already exists in user_devices table';
  END IF;

  -- Ensure wallet_addresses column exists in user_devices table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_devices' AND column_name = 'wallet_addresses'
  ) THEN
    ALTER TABLE user_devices ADD COLUMN wallet_addresses TEXT NULL;
    RAISE NOTICE 'Added wallet_addresses column to user_devices table';
  ELSE
    RAISE NOTICE 'wallet_addresses column already exists in user_devices table';
  END IF;
END \$\$;

-- Create index on device_id in user_devices table if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'user_devices' AND indexname = 'IDX_user_devices_device_id'
  ) THEN
    CREATE INDEX "IDX_user_devices_device_id" ON user_devices ("device_id");
    RAISE NOTICE 'Created index on device_id column in user_devices table';
  ELSE
    RAISE NOTICE 'Index on device_id column already exists in user_devices table';
  END IF;
END \$\$;

-- Return ownership to original owner if needed
ALTER TABLE IF EXISTS user_devices OWNER TO ${OWNER};
ALTER TABLE IF EXISTS user_sessions OWNER TO ${OWNER};
EOL

echo "Created temporary SQL file."

# Try to run the SQL file as postgres superuser if available
echo "Attempting to run SQL with postgres superuser..."
if command -v sudo &> /dev/null; then
  # If sudo is available
  echo "Using sudo to run as postgres user..."
  sudo -u postgres psql -d "Alive-Db" -f backend/temp-db-fix.sql
else
  # Otherwise try direct connection as postgres
  echo "Trying direct connection as postgres user..."
  psql -U postgres -d "Alive-Db" -f backend/temp-db-fix.sql
fi

# If that failed, try with original user
if [ $? -ne 0 ]; then
  echo "Failed with postgres user. Trying with current user..."
  psql -U Aliveadmin -d "Alive-Db" -f backend/temp-db-fix.sql
fi

# Clean up
echo "Cleaning up temporary files..."
rm backend/temp-db-fix.sql

echo "Database update complete."

# Function to run commands with or without sudo based on availability
run_command() {
  local cmd="$1"
  local explanation="$2"
  
  echo "==================================="
  echo "$explanation"
  echo "==================================="
  
  # Navigate to backend directory
  cd "$(dirname "$0")" || exit
  
  # Try with sudo if available
  if command -v sudo &> /dev/null; then
    echo "Using sudo to run command..."
    sudo $cmd
  else
    # Otherwise run directly
    echo "Running command directly..."
    $cmd
  fi
  
  # Return to original directory
  cd - > /dev/null
}

# Add command line parameter handling
case "$1" in
  "migration")
    run_command "npm run migration:run" "Running database migration..."
    ;;
  "id-check")
    run_command "npm run test:id-consistency" "Running ID consistency check..."
    ;;
  "help")
    echo "Usage: $0 [command]"
    echo "Commands:"
    echo "  (no command) - Run database permissions fix only"
    echo "  migration    - Run database migration"
    echo "  id-check     - Run ID consistency check"
    echo "  help         - Show this help message"
    ;;
  *)
    echo ""
    echo "To run migrations or ID consistency checks, use:"
    echo "  $0 migration    - Run database migration"
    echo "  $0 id-check     - Run ID consistency check"
    echo ""
    ;;
esac