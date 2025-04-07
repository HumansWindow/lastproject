#!/bin/bash

# Script to clean user data for testing registration and minting processes

# Get the absolute path to the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/clean-user-data.sql"

echo "========================================================"
echo "Starting database cleaning process for testing purposes"
echo "========================================================"

# Database connection parameters - update with your actual credentials
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="aliveHumans@2024"
USE_SUDO=false

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --sudo) USE_SUDO=true; shift ;;
        --user=*) DB_USER="${1#*=}"; shift ;;
        --password=*) DB_PASSWORD="${1#*=}"; shift ;;
        --db=*) DB_NAME="${1#*=}"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
done

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found. Please install PostgreSQL."
    exit 1
fi

# Build the command with proper credentials
if [ "$USE_SUDO" = true ]; then
    echo "Using sudo to run the PostgreSQL command..."
    PSQL_CMD="sudo -u postgres psql -d $DB_NAME -f \"$SQL_FILE\""
else
    # Using password authentication with provided credentials
    echo "Using password authentication with user '$DB_USER'..."
    export PGPASSWORD="$DB_PASSWORD"
    PSQL_CMD="psql -U $DB_USER -h localhost -d $DB_NAME -f \"$SQL_FILE\""
fi

# Run the SQL script
echo "Executing clean-user-data.sql script on database $DB_NAME..."
eval $PSQL_CMD

# Check if the script execution was successful
if [ $? -eq 0 ]; then
    echo "========================================================"
    echo "Database cleaned successfully!"
    echo "The system is now ready for testing registration and minting."
    echo "========================================================"
    
    # Clear password from environment if it was set
    if [ ! -z "$PGPASSWORD" ]; then
        unset PGPASSWORD
    fi
    
    exit 0
else
    echo "========================================================"
    echo "Error: Database cleaning failed. Check the error messages above."
    echo "You may need to:"
    echo "1. Check if PostgreSQL server is running"
    echo "2. Verify the database '$DB_NAME' exists"
    echo "3. Ensure user '$DB_USER' has proper permissions"
    echo "4. Try running with --sudo option: ./clean-db-for-testing.sh --sudo"
    echo "========================================================"
    
    # Clear password from environment if it was set
    if [ ! -z "$PGPASSWORD" ]; then
        unset PGPASSWORD
    fi
    
    exit 1
fi