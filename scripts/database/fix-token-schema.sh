#!/bin/bash

# Script to fix wallet authentication schema issues related to refresh tokens and user devices

echo "Starting database schema fix for wallet authentication..."

# Get database credentials from .env file
if [ -f "/home/alivegod/Desktop/LastProjectendpoint/LastProject/backend/.env" ]; then
  source "/home/alivegod/Desktop/LastProjectendpoint/LastProject/backend/.env"
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}
  DB_USERNAME=${DB_USERNAME:-Aliveadmin}
  DB_PASSWORD=${DB_PASSWORD:-alivehumans@2024}
  DB_DATABASE=${DB_DATABASE:-Alive-Db}
else
  echo "Error: .env file not found. Using default database connection parameters."
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=Aliveadmin
  DB_PASSWORD=alivehumans@2024
  DB_DATABASE=Alive-Db
fi

echo "Connecting to database: $DB_DATABASE on $DB_HOST:$DB_PORT"

# Run the SQL fix script
echo "Applying refresh token schema fixes..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f "/home/alivegod/Desktop/LastProjectendpoint/LastProject/fix-refresh-token-schema.sql"

# Check the exit status of the psql command
if [ $? -eq 0 ]; then
  echo "Database schema fix successfully applied."
  
  echo "Restarting backend server..."
  
  # Navigate to project directory and restart the backend
  cd /home/alivegod/Desktop/LastProjectendpoint/LastProject
  ./start-backend.sh
  
  echo "Schema fixes have been applied. You should now be able to authenticate with your wallet."
else
  echo "Failed to apply database schema fix. Please check database connection parameters."
fi