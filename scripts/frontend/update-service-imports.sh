#!/bin/bash

# Update service import paths automatically
echo "Updating service import paths in all components and files..."

# Function to update imports in a file
update_imports() {
  local file=$1
  echo "Updating imports in $file"
  
  # Replace old import paths with new ones
  sed -i 's|from \x27../services/api\x27|from \x27../services/realtime/websocket/realtime-service\x27|g' "$file"
  sed -i 's|from \x27../services/websocket-manager\x27|from \x27../services/realtime/websocket/websocket-manager\x27|g' "$file"
  sed -i 's|from \x27../services/notification-service\x27|from \x27../services/notifications/notification-service\x27|g' "$file"
  sed -i 's|from \x27../services/wallet-auth.service\x27|from \x27../services/api/modules/auth/wallet-auth-service\x27|g' "$file"
  sed -i 's|from \x27../services/auth-service\x27|from \x27../services/api/modules/auth/auth-service\x27|g' "$file"
  
  # Update API client module imports
  sed -i 's|from \x27../services/api/auth-service\x27|from \x27../services/api/modules/auth/auth-service\x27|g' "$file"
  sed -i 's|from \x27../services/api/wallet-service\x27|from \x27../services/api/modules/wallet/wallet-service\x27|g' "$file"
  sed -i 's|from \x27../services/api/diary-service\x27|from \x27../services/api/modules/diary/diary-service\x27|g' "$file"
  sed -i 's|from \x27../services/api/token-service\x27|from \x27../services/api/modules/nft/token-service\x27|g' "$file"
  sed -i 's|from \x27../services/api/nft-service\x27|from \x27../services/api/modules/nft/nft-service\x27|g' "$file"
  
  # Update security and memory management imports
  sed -i 's|from \x27../services/security-service\x27|from \x27../services/security/security-service\x27|g' "$file"
  sed -i 's|from \x27../services/device-fingerprint\x27|from \x27../services/security/protection/device-fingerprint\x27|g' "$file"
  sed -i 's|from \x27../services/captcha-service\x27|from \x27../services/security/protection/captcha-service\x27|g' "$file"
  sed -i 's|from \x27../services/encryption-service\x27|from \x27../services/security/encryption/encryption-service\x27|g' "$file"
  
  # Update optimized API client imports
  sed -i 's|from \x27../services/batch-request\x27|from \x27../services/api/client/optimized/batch-request\x27|g' "$file"
  sed -i 's|from \x27../services/cached-api\x27|from \x27../services/api/client/optimized/cached-api\x27|g' "$file"
  sed -i 's|from \x27../services/selective-api\x27|from \x27../services/api/client/optimized/selective-api\x27|g' "$file"
  sed -i 's|from \x27../services/compressed-api\x27|from \x27../services/api/client/optimized/compressed-api\x27|g' "$file"
  sed -i 's|from \x27../services/offline-api\x27|from \x27../services/api/client/optimized/offline-api\x27|g' "$file"
  sed -i 's|from \x27../services/monitoring-api\x27|from \x27../services/api/client/optimized/monitoring-api\x27|g' "$file"
  sed -i 's|from \x27../services/encrypted-api-client\x27|from \x27../services/api/client/optimized/encrypted-api-client\x27|g' "$file"
  sed -i 's|from \x27../services/secure-api-client\x27|from \x27../services/api/client/optimized/secure-api-client\x27|g' "$file"
  
  # Update memory management imports
  sed -i 's|from \x27../services/memory-manager\x27|from \x27../services/storage/memory/memory-manager\x27|g' "$file"
  sed -i 's|from \x27../services/cache-utils\x27|from \x27../services/storage/cache/cache-utils\x27|g' "$file"
}

# Files identified by the finalization script
FILES=(
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/RealTimeBalance.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WalletBalanceMonitor.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NFTTransferMonitor.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NotificationsPanel.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NotificationBell.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WebSocketStatus.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/WebSocketDemo.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/hooks/useWebSocket.ts"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/wallet.tsx"
)

# Update imports in each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    update_imports "$file"
  else
    echo "Warning: File not found: $file"
  fi
done

# Check for any other files with old service imports
echo "Checking for any remaining files with old service imports..."
OTHER_FILES=$(grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -l "from '../services/[^/]" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/hooks /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts 2>/dev/null)

if [ -n "$OTHER_FILES" ]; then
  echo "Found additional files with old service imports:"
  for file in $OTHER_FILES; do
    echo "  $file"
    update_imports "$file"
  done
fi

# Fix circular dependencies in new structure
echo "Fixing potential circular dependencies in service files..."
find /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services -type f -name "*.ts" | xargs grep -l "import .* from '\.\./\.\./services" | while read -r file; do
  echo "Fixing imports in $file"
  # This is a complex operation that may need manual attention
  # We'll attempt to fix the most common patterns
  sed -i 's|from "\.\./\.\./services/api"|from "../../realtime/websocket/realtime-service"|g' "$file"
  sed -i "s|from '\.\./\.\./services/api'|from '../../realtime/websocket/realtime-service'|g" "$file"
  sed -i 's|from "\.\./\.\./services/websocket-manager"|from "../../realtime/websocket/websocket-manager"|g' "$file"
  sed -i "s|from '\.\./\.\./services/websocket-manager'|from '../../realtime/websocket/websocket-manager'|g" "$file"
done

echo "Import paths have been updated. Please test your application to ensure everything works correctly."