#!/bin/bash

# Get directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Running user data cleanup script..."
echo "This will permanently delete all user data from the database!"
read -p "Are you sure you want to continue? (y/n): " confirm

if [[ $confirm == "y" || $confirm == "Y" ]]; then
  # Check if PGPASSWORD is set, if not prompt for it
  if [ -z "$PGPASSWORD" ]; then
    read -sp "Enter PostgreSQL password: " PGPASSWORD
    export PGPASSWORD
    echo
  fi

  # Default values - modify these according to your database settings
  DB_USER=${DB_USER:-postgres}
  DB_NAME=${DB_NAME:-postgres}
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}

  # Execute the SQL script
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SCRIPT_DIR/clean-user-data.sql"
  
  result=$?
  if [ $result -eq 0 ]; then
    echo "User data cleanup completed successfully!"
  else
    echo "Error running user data cleanup. Exit code: $result"
  fi
  
  # Clear the password from environment for security
  if [ -n "$PGPASSWORD" ]; then
    unset PGPASSWORD
  fi
else
  echo "User data cleanup cancelled."
fi