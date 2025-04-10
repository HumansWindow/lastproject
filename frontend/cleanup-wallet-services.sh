#!/bin/bash

# Define the directory and files to remove
PROJECT_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

# Files to remove
FILES_TO_REMOVE=(
  "$PROJECT_DIR/src/services/api/modules/auth/wallet-auth-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-integration.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/multi-wallet-provider.ts"
  "$PROJECT_DIR/src/services/api/wallet-service.ts"
)

echo "Cleaning up old wallet service files..."
echo "======================================"

# First create backups
BACKUP_DIR="$PROJECT_DIR/backups/wallet-services-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    # Get the directory structure relative to PROJECT_DIR
    rel_dir=$(dirname "${file#$PROJECT_DIR/}")
    
    # Create the same directory structure in backup
    mkdir -p "$BACKUP_DIR/$rel_dir"
    
    # Copy the file to backup
    cp "$file" "$BACKUP_DIR/$rel_dir/"
    echo "✓ Backed up: $file"
    
    # Remove the original file
    rm "$file"
    echo "✓ Removed: $file"
  else
    echo "❌ File not found (already removed?): $file"
  fi
done

echo ""
echo "Files have been backed up to: $BACKUP_DIR"
echo "Cleanup complete!"
