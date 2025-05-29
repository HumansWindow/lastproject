#!/bin/bash
# Create a timestamped backup of the database
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="alive_db_backup_$TIMESTAMP.sql"
BACKUP_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup the database
PGPASSWORD=aliveHumans@2024 pg_dump -h localhost -p 5432 -U Aliveadmin -d Alive-Db > "$BACKUP_DIR/$BACKUP_FILE"

echo "Database backup created at $BACKUP_DIR/$BACKUP_FILE"