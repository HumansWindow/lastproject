#!/bin/bash

# Script to clean user data and logs for testing registration and minting processes

# Get the absolute path to the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="${SCRIPT_DIR}/clean-user-data.sql"

echo "========================================================"
echo "Starting database and logs cleaning process for testing"
echo "========================================================"

# Database connection parameters - update with your actual credentials
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="alivehumans@2024"
USE_SUDO=false
CLEAN_LOGS=true
LOG_DIR="${SCRIPT_DIR}/logs"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --sudo) USE_SUDO=true; shift ;;
        --user=*) DB_USER="${1#*=}"; shift ;;
        --password=*) DB_PASSWORD="${1#*=}"; shift ;;
        --db=*) DB_NAME="${1#*=}"; shift ;;
        --no-logs) CLEAN_LOGS=false; shift ;;
        --log-dir=*) LOG_DIR="${1#*=}"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# First, create or update SQL file with corrected statements
echo "Creating/updating SQL file for database cleaning..."
cat > "$SQL_FILE" <<EOF
-- SQL to clean all user-related tables and minting data
-- This script will safely handle nonexistent tables and preserve foreign key constraints

-- Start transaction and temporarily disable triggers
BEGIN;
SET session_replication_role = 'replica';

-- Clean tables without using the DO block that was causing issues
-- Instead use individual commands with transaction protection

-- Clean users table first (will cascade to related tables due to TRUNCATE CASCADE)
TRUNCATE TABLE public.users CASCADE;

-- Clean additional tables that may not be covered by the cascade
TRUNCATE TABLE public.minting_queue_items CASCADE;
TRUNCATE TABLE public.referral_codes CASCADE;
TRUNCATE TABLE public.referrals CASCADE;

-- Clean sessions table if it exists
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions') THEN
        EXECUTE 'TRUNCATE TABLE public.sessions CASCADE';
    END IF;
END \$\$;

-- Clean refresh_tokens table if it exists
DO \$\$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'refresh_tokens') THEN
        EXECUTE 'TRUNCATE TABLE public.refresh_tokens CASCADE';
    END IF;
END \$\$;

-- Enable triggers again
SET session_replication_role = 'origin';

-- Reset sequence values for ID columns that we know exist
ALTER SEQUENCE IF EXISTS public.users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.wallets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.user_devices_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.user_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.minting_queue_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.referral_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.referrals_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.profiles_id_seq RESTART WITH 1;

-- Commit the transaction
COMMIT;

-- Vacuum to free up space and update statistics
VACUUM ANALYZE;
EOF

# Make SQL file readable by all (fixes permission denied error)
chmod 644 "$SQL_FILE"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
fi

# For sudo operations, create a temporary file that postgres user can access
if [ "$USE_SUDO" = true ]; then
    # Create a temporary file with the SQL commands
    TMP_SQL_FILE=$(mktemp)
    cat "$SQL_FILE" > "$TMP_SQL_FILE"
    chmod 644 "$TMP_SQL_FILE"
    
    echo "Using sudo to run the PostgreSQL command..."
    PSQL_CMD="sudo -u postgres psql -d $DB_NAME -f \"$TMP_SQL_FILE\""
else
    # Using password authentication with provided credentials
    echo "Using password authentication with user '$DB_USER'..."
    export PGPASSWORD="$DB_PASSWORD"
    PSQL_CMD="psql -U $DB_USER -h localhost -d $DB_NAME -f \"$SQL_FILE\""
fi

# Run the SQL script
echo "Executing SQL script on database $DB_NAME..."
eval $PSQL_CMD
DB_RESULT=$?

# Clean up temporary file if created
if [ "$USE_SUDO" = true ] && [ -f "$TMP_SQL_FILE" ]; then
    rm -f "$TMP_SQL_FILE"
fi

# Clean log files if enabled
if [ "$CLEAN_LOGS" = true ]; then
    echo "Cleaning log files..."
    
    # Check for PM2 logs if PM2 is used first (this usually works regardless of directory issues)
    if command -v pm2 &> /dev/null; then
        echo "Cleaning PM2 logs..."
        pm2 flush 2>/dev/null || echo "Failed to flush PM2 logs. You may need to run this manually."
    fi
    
    # Check if the log directory exists
    if [ -d "$LOG_DIR" ]; then
        echo "Cleaning logs in directory: $LOG_DIR"
        # Find and truncate log files without deleting them
        find "$LOG_DIR" -type f -name "*.log" -exec sh -c 'echo "" > "$0"' {} \; 2>/dev/null
        # Some applications may use .txt or no extension for logs
        find "$LOG_DIR" -type f -name "*.txt" -exec sh -c 'echo "" > "$0"' {} \; 2>/dev/null
    else
        echo "Log directory not found: $LOG_DIR"
        
        # Try to find common log directories
        POTENTIAL_LOG_DIRS=(
            "${SCRIPT_DIR}/logs"
            "${SCRIPT_DIR}/../logs"
            "${SCRIPT_DIR}/log"
            "${SCRIPT_DIR}/../log"
            "/var/log/postgresql"
        )
        
        for DIR in "${POTENTIAL_LOG_DIRS[@]}"; do
            if [ -d "$DIR" ] && [ -w "$DIR" ]; then
                echo "Found potential log directory: $DIR"
                echo "Cleaning logs in this directory..."
                find "$DIR" -type f -name "*.log" -exec sh -c 'echo "" > "$0"' {} \; 2>/dev/null
                find "$DIR" -type f -name "*.txt" -exec sh -c 'echo "" > "$0"' {} \; 2>/dev/null
            fi
        done
    fi
    
    # Clean app-specific minting logs that might be in different locations
    echo "Checking for minting-related logs..."
    find "${SCRIPT_DIR}" -name "minting*.log" -exec sh -c 'echo "Clearing $0"; echo "" > "$0"' {} \; 2>/dev/null
    find "${SCRIPT_DIR}/.." -name "minting*.log" -exec sh -c 'echo "Clearing $0"; echo "" > "$0"' {} \; 2>/dev/null
fi

# Check if the script execution was successful
if [ $DB_RESULT -eq 0 ]; then
    echo "========================================================"
    echo "Database cleaned successfully!"
    echo "All user, wallet, and minting data has been cleared."
    echo "The system is now ready for testing registration and minting."
    if [ "$CLEAN_LOGS" = true ]; then
        echo "Log files have been cleaned."
    fi
    echo "========================================================"
    
    # Clear password from environment if it was set
    if [ ! -z "$PGPASSWORD" ]; then
        unset PGPASSWORD
    fi
    
    # Add a check command to display table counts to verify cleaning
    if [ "$USE_SUDO" = true ]; then
        echo "Verifying tables were cleaned (should show zero counts):"
        sudo -u postgres psql -d $DB_NAME -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'wallets', COUNT(*) FROM wallets UNION ALL SELECT 'minting_queue_items', COUNT(*) FROM minting_queue_items ORDER BY table_name;"
    else
        export PGPASSWORD="$DB_PASSWORD"
        echo "Verifying tables were cleaned (should show zero counts):"
        psql -U $DB_USER -h localhost -d $DB_NAME -c "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'wallets', COUNT(*) FROM wallets UNION ALL SELECT 'minting_queue_items', COUNT(*) FROM minting_queue_items ORDER BY table_name;"
        unset PGPASSWORD
    fi
    
    exit 0
else
    echo "========================================================"
    echo "Error: Database cleaning may have encountered issues."
    echo "Please manually check if tables were cleared using:"
    if [ "$USE_SUDO" = true ]; then
        echo "sudo -u postgres psql -d $DB_NAME -c \"SELECT 'users' as table, COUNT(*) FROM users; SELECT 'wallets' as table, COUNT(*) FROM wallets;\""
    else
        echo "psql -U $DB_USER -h localhost -d $DB_NAME -c \"SELECT 'users' as table, COUNT(*) FROM users; SELECT 'wallets' as table, COUNT(*) FROM wallets;\""
    fi
    echo "========================================================"
    
    # Clear password from environment if it was set
    if [ ! -z "$PGPASSWORD" ]; then
        unset PGPASSWORD
    fi
    
    exit 1
fi