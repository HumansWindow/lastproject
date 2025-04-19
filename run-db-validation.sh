#!/bin/bash

# Comprehensive Database Schema Validation and Fix Script
# Created: April 18, 2025

echo "====================================================="
echo "Database Schema Validation and Comprehensive Fix Tool"
echo "====================================================="
echo

# Get database credentials from .env file
if [ -f "./backend/.env" ]; then
  source "./backend/.env"
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}
  DB_USERNAME=${DB_USERNAME:-postgres}
  DB_PASSWORD=${DB_PASSWORD:-postgres}
  DB_DATABASE=${DB_DATABASE:-Alive-Db}
else
  echo "Warning: .env file not found. Using default database connection parameters."
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_DATABASE=Alive-Db
fi

echo "Database: $DB_DATABASE on $DB_HOST:$DB_PORT"
echo

# Check if uuid-ossp extension is installed
echo "Checking for uuid-ossp extension..."
uuid_exists=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'uuid-ossp';")

if [ "$uuid_exists" -eq "0" ]; then
  echo "Installing uuid-ossp extension..."
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
else
  echo "uuid-ossp extension is already installed."
fi

# Run the comprehensive validation and fix script
echo "Running comprehensive database schema validation and fix..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f "./validate-and-fix-database.sql"

# Check result
if [ $? -eq 0 ]; then
  echo
  echo "✅ Schema validation and fix completed successfully!"
  echo
  
  # Create backup of current schema
  timestamp=$(date +"%Y%m%d-%H%M%S")
  backup_file="./backups/database-schema-$timestamp.sql"
  mkdir -p ./backups
  
  echo "Creating schema backup at: $backup_file"
  PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE --schema-only > "$backup_file"
  
  echo
  echo "Would you like to restart the backend server now? [y/N]"
  read -r restart_choice
  
  if [[ $restart_choice =~ ^[Yy]$ ]]; then
    echo "Restarting backend server..."
    ./start-backend.sh
  else
    echo "Skipping server restart. Run ./start-backend.sh manually when you're ready."
  fi
else
  echo
  echo "❌ Schema validation and fix encountered errors."
  echo "Please check the error messages above and fix any issues manually."
  echo
fi