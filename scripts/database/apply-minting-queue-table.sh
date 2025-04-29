#!/bin/bash

# Database configuration - using the correct credentials
DB_NAME="Alive-Db"
DB_USER="Aliveadmin"
DB_PASSWORD="new_password"
DB_HOST="localhost"
DB_PORT="5432"

echo "Applying minting_queue_items table migration to database $DB_NAME..."

# Run the SQL file with sudo
sudo PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f create-minting-queue-table.sql

if [ $? -eq 0 ]; then
  echo "✅ Successfully created minting_queue_items table"
else
  echo "❌ Failed to create minting_queue_items table"
  exit 1
fi

echo "Migration completed!"