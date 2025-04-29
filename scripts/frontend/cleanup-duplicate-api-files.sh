#!/bin/bash

# Cleanup script to remove duplicate API service files from the flat structure
# after migration to the modular structure

echo "Starting cleanup of duplicate API service files..."

# List of flat API files to remove
API_FILES_TO_REMOVE=(
  "src/services/api/auth-service.ts"
  "src/services/api/diary-service.ts"
  "src/services/api/nft-service.ts"
  "src/services/api/realtime-service.ts"
  "src/services/api/referral-service.ts"
  "src/services/api/token-service.ts"
  "src/services/api/user-service.ts"
  "src/services/api/wallet-service.ts"
)

# Base directory
BASE_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

# Create backup directory
BACKUP_DIR="${BASE_DIR}/backup-api-files"
mkdir -p "$BACKUP_DIR"

echo "Created backup directory at ${BACKUP_DIR}"

# Backup and remove files
for file in "${API_FILES_TO_REMOVE[@]}"; do
  full_path="${BASE_DIR}/${file}"
  
  if [ -f "$full_path" ]; then
    # Create backup
    backup_path="${BACKUP_DIR}/$(basename $file)"
    echo "Backing up $full_path to $backup_path"
    cp "$full_path" "$backup_path"
    
    # Remove file
    echo "Removing $full_path"
    rm "$full_path"
  else
    echo "File $full_path does not exist, skipping"
  fi
done

echo "Cleanup complete! Duplicate API service files have been removed."
echo "Backups are stored in ${BACKUP_DIR} directory."