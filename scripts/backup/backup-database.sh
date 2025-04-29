#!/bin/bash
# Script to backup the Alive-Db database before running standardization

# Create backups directory if it doesn't exist
mkdir -p backups

# Set database connection parameters from your configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=Aliveadmin
DB_PASSWORD=alivehumans@2024
DB_DATABASE=Alive-Db

# Create timestamp for unique backup filename
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="backups/pre_standardization_backup_${TIMESTAMP}.sql"

echo "Creating backup of ${DB_DATABASE} database..."
echo "Backup will be saved to: ${BACKUP_FILE}"

# Use PGPASSWORD environment variable to avoid password prompt
export PGPASSWORD="${DB_PASSWORD}"

# Run the pg_dump command with the appropriate parameters
pg_dump -U "${DB_USERNAME}" -h "${DB_HOST}" -p "${DB_PORT}" -F p -f "${BACKUP_FILE}" "${DB_DATABASE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "✅ Database backup completed successfully!"
  echo "Backup saved to: ${BACKUP_FILE}"
else
  echo "❌ Database backup failed. Please check your credentials and try again."
  exit 1
fi

# Clear the password from environment for security
unset PGPASSWORD

echo "You can now safely run ./run-id-standardization.sh"