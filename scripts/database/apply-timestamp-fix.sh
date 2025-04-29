#!/bin/bash

# Apply timestamp columns migration to fix wallet authentication
echo "Applying timestamp columns migration..."
psql -U Aliveadmin -d Alive-Db -a -f add-timestamp-columns.sql

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Successfully added timestamp columns to database tables"
  echo "This should fix the wallet authentication issue"
else
  echo "❌ Failed to apply timestamp columns migration"
  echo "Please check your PostgreSQL credentials and try again"
fi