#!/bin/bash

# Find all TypeScript and JavaScript files
echo "Finding all TypeScript and JavaScript files with service imports..."
FILES=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l "from '../services/" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src)

echo "Files with service imports:"
echo "=========================="
for file in $FILES; do
  echo "$file"
  grep -n "from '../services/" "$file" | sed 's/^/  /'
  echo ""
done

echo "Looking for imports from specific service files..."
echo "================================================="
SERVICES=(
  "wallet-auth.service"
  "websocket-manager"
  "notification-service"
  "api"
  "wallet-integration"
  "memory-manager"
  "device-fingerprint"
  "security-service"
  "batch-request"
  "cached-api"
  "selective-api"
  "compressed-api"
  "offline-api"
  "encrypted-api-client"
  "secure-api-client"
)

for service in "${SERVICES[@]}"; do
  echo "Imports of $service:"
  grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -n "from .*${service}" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src | grep -v "node_modules"
  echo ""
done

echo "Done!"