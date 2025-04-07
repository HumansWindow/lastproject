#!/bin/bash

# Script to safely remove old service files that have been moved to the new structure
# Created as part of the frontend service restructuring

SERVICE_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services"
BACKUP_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services-backup"

# Create a backup directory first
echo "Creating backup of old services..."
mkdir -p $BACKUP_DIR

# Files we know have been relocated to the new structure
FILES_TO_REMOVE=(
  "advanced-api-demo.ts"
  "api.ts"
  "api.ts.bak"
  "auth-service.ts"
  "batch-request.ts"
  "cached-api.ts"
  "cache-utils.ts"
  "captcha-service.ts"
  "compressed-api.ts"
  "device-fingerprint.ts"
  "diary.service.ts"
  "encrypted-api-client.ts"
  "encryption-service.ts"
  "memory-manager.ts"
  "monitoring-api.ts"
  "multi-wallet-provider.ts"
  "notification-service.ts"
  "offline-api.ts"
  "secure-api-client.ts"
  "security-service.ts"
  "selective-api.ts"
  "wallet-auth.service.ts"
  "wallet-integration.ts"
  "websocket-manager.ts"
)

# Move files to backup directory
for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$SERVICE_DIR/$file" ]; then
    echo "Moving $file to backup..."
    mv "$SERVICE_DIR/$file" "$BACKUP_DIR/"
  else
    echo "File $file not found, skipping..."
  fi
done

# Check if api-client.ts in the root is different from the one in the api/ directory
if [ -f "$SERVICE_DIR/api-client.ts" ] && [ -f "$SERVICE_DIR/api/api-client.ts" ]; then
  echo "Found api-client.ts in both root and api/ directory."
  echo "Moving root version to backup..."
  mv "$SERVICE_DIR/api-client.ts" "$BACKUP_DIR/"
fi

echo "Cleanup complete! Old service files are now in $BACKUP_DIR"
echo "If everything works correctly, you can delete the backup directory later."