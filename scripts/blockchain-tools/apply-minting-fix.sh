#!/bin/bash

# Apply minting columns migration to fix wallet authentication
echo "Applying minting columns migration..."
psql -U Aliveadmin -d Alive-Db -a -f add-minting-columns.sql

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully added minting columns to users table"
  echo "This should fix the wallet authentication issue"
else
  echo "❌ Failed to apply minting columns migration"
  echo "Please check your PostgreSQL credentials and try again"
fi