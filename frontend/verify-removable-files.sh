#!/bin/bash

PROJECT_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

# List of files to be removed
FILES_TO_REMOVE=(
  "$PROJECT_DIR/src/services/api/modules/auth/wallet-auth-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-integration.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/multi-wallet-provider.ts"
  "$PROJECT_DIR/src/services/api/wallet-service.ts"
)

echo "Verifying files to be removed:"
echo "=============================="

for file in "${FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ File exists and can be removed: $file"
    
    # Check if any other files import this file
    importers=$(grep -r --include="*.ts*" "from ['\"].*$(basename "$file" .ts)['\"]" "$PROJECT_DIR" | grep -v "$file")
    
    if [ -n "$importers" ]; then
      echo "⚠️  Warning: This file is still imported by:"
      echo "$importers"
    else
      echo "✓ No other files import this file"
    fi
  else
    echo "❌ File not found: $file"
  fi
  echo ""
done

echo "Verification complete!"
