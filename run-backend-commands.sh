#!/bin/bash

# This script allows running backend commands from anywhere in the project
# It handles common tasks like running migrations and ID consistency checks

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Make sure backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: Backend directory not found at $BACKEND_DIR"
  exit 1
fi

# Function to run a command in the backend directory
run_backend_command() {
  local command="$1"
  
  echo "Running command in backend directory..."
  cd "$BACKEND_DIR" || exit 1
  
  # Execute the command
  if [ -x "$command" ]; then
    # If it's an executable script
    "$command" "${@:2}"
  else
    # Otherwise run with npm
    npm run "$command"
  fi
  
  # Return to original directory
  cd - > /dev/null
}

# Parse command line arguments
case "$1" in
  "migration:run")
    # First make sure fix-db-permissions.sh is executable
    chmod +x "$BACKEND_DIR/fix-db-permissions.sh"
    # Run the migration using fix-db-permissions.sh
    "$BACKEND_DIR/fix-db-permissions.sh" migration
    ;;
    
  "test:id-consistency")
    # First make sure fix-db-permissions.sh is executable
    chmod +x "$BACKEND_DIR/fix-db-permissions.sh"
    # Run the ID consistency check using fix-db-permissions.sh
    "$BACKEND_DIR/fix-db-permissions.sh" id-check
    ;;
    
  "migration:create")
    if [ -z "$2" ]; then
      echo "Error: Missing migration name"
      echo "Usage: $0 migration:create MigrationName"
      exit 1
    fi
    
    run_backend_command "migration:create" "$2"
    ;;
    
  "migration:revert")
    run_backend_command "migration:revert"
    ;;
    
  "fix-db-permissions")
    # Make sure fix-db-permissions.sh is executable
    chmod +x "$BACKEND_DIR/fix-db-permissions.sh"
    # Run fix-db-permissions.sh with any additional arguments
    "$BACKEND_DIR/fix-db-permissions.sh" "${@:2}"
    ;;
    
  *)
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Available commands:"
    echo "  migration:run          - Run database migrations"
    echo "  migration:create NAME  - Create a new migration with NAME"
    echo "  migration:revert       - Revert the last migration"
    echo "  test:id-consistency    - Run ID consistency check"
    echo "  fix-db-permissions     - Run the database permissions fix"
    echo ""
    ;;
esac