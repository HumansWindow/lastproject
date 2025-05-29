#!/bin/bash

# Run migrations with sudo privileges
# This script runs database migrations for the Last Project backend

cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend

# Display information about what the script is doing
echo "=== Running database migrations with sudo privileges ==="
echo "Database: ${DB_DATABASE:-Alive-Db}"
echo "Host: ${DB_HOST:-localhost}"
echo "User: ${DB_USERNAME:-Aliveadmin}"
echo

# Check if PostgreSQL extension uuid-ossp is installed
echo "Checking if PostgreSQL extension uuid-ossp is installed..."
sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" || {
  echo "Error: Failed to create uuid-ossp extension. Please check your PostgreSQL installation."
  exit 1
}
echo "PostgreSQL extension uuid-ossp is installed."
echo

# Run TypeORM migrations
echo "Running TypeORM migrations..."
sudo npm run migration:run || {
  echo "Error: Migration failed."
  exit 1
}

# Check if migrations completed successfully
if [ $? -eq 0 ]; then
  echo "=== Migrations completed successfully! ==="
  
  # List all tables in the database
  echo
  echo "=== Current database tables ==="
  sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c '\dt'
else
  echo "=== Migration process failed! ==="
  exit 1
fi
