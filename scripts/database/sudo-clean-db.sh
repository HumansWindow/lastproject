#!/bin/bash
# Enhanced sudo wrapper for clean-db-for-testing.sh that handles permissions properly

# Get the absolute path to the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/clean-user-data.sql"

echo "Running database cleaning script with sudo permissions..."

# Create a temporary copy of the SQL file in a location accessible to postgres user
TEMP_SQL="/tmp/clean-user-data-$(date +%s).sql"
cp "$SQL_FILE" "$TEMP_SQL"
chmod 644 "$TEMP_SQL"

# Run PostgreSQL command as postgres user with the temporary file
sudo -u postgres psql -d Alive-Db -f "$TEMP_SQL"
RESULT=$?

# Clean up temporary file
rm -f "$TEMP_SQL"

# Check if the clean script succeeded
if [ $RESULT -eq 0 ]; then
  echo "=========================================================="
  echo "✅ Database cleaning completed successfully!"
  echo "The system is now ready for testing registration and minting."
  echo "=========================================================="
else
  echo "=========================================================="
  echo "❌ Database cleaning failed. Check the error messages above."
  echo "Make sure the postgres user has access to the database 'Alive-Db'."
  echo "=========================================================="
fi