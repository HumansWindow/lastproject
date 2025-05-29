#!/bin/bash
# Run TypeORM migrations directly using the ts-node executable

# Navigate to the backend directory
cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend

# Set environment variables
export NODE_ENV=development

echo "=== Running database migrations ==="
echo "Postgres database: ${DB_DATABASE:-Alive-Db}"
echo "Host: ${DB_HOST:-localhost}"
echo "Username: ${DB_USERNAME:-Aliveadmin}"

# Make sure the uuid-ossp extension is installed
echo "Setting up PostgreSQL uuid-ossp extension..."
sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

# Run the migration using npx and typeorm directly
echo "Running migrations..."
npx typeorm-ts-node-commonjs migration:run -d src/config/database.config.ts

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "=== Migrations completed successfully! ==="
  
  # List all tables in the database
  echo
  echo "=== Current database tables ==="
  sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c '\dt'
else
  echo "=== Migration failed with the main config, trying alternative configs ==="
  
  # Try with root typeorm.config.ts
  echo "Trying root typeorm.config.ts..."
  npx typeorm-ts-node-commonjs migration:run -d typeorm.config.ts
  
  if [ $? -eq 0 ]; then
    echo "=== Migrations completed successfully with root config! ==="
    sudo -u postgres psql -d "${DB_DATABASE:-Alive-Db}" -c '\dt'
  else
    echo "Migration failed with all configs. Please check your database configuration."
    exit 1
  fi
fi

# Restart the backend service
echo "Restarting the backend service..."
pm2 restart backend || echo "PM2 not installed or backend service not found. Please restart the service manually."

echo "=== Migration process completed ==="
