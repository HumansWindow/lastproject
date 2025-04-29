#!/bin/bash

# Script to fix internal service import paths
echo "Fixing internal service import paths..."

# Create a temporary directory for backup
mkdir -p temp_backup

# Function to fix imports within a file
fix_internal_imports() {
  local file=$1
  local dir=$(dirname "$file")
  echo "Fixing imports in $file"
  
  # Capture the original file for backup
  cp "$file" "temp_backup/$(basename "$file")"
  
  # Fix relative imports with proper paths based on file location
  
  # Fix imports for api-client
  if [[ "$file" == *"api/client/optimized"* ]]; then
    # In optimized client files
    sed -i 's|from \x27\./api\x27|from \x27../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./api/api-client\x27|from \x27../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./cache-utils\x27|from \x27../../../storage/cache/cache-utils\x27|g' "$file"
    sed -i 's|from \x27\./encryption-service\x27|from \x27../../../security/encryption/encryption-service\x27|g' "$file"
    sed -i 's|from \x27\./security-service\x27|from \x27../../../security/security-service\x27|g' "$file"
    sed -i 's|from \x27\./captcha-service\x27|from \x27../../../security/protection/captcha-service\x27|g' "$file"
  elif [[ "$file" == *"api/modules/auth"* ]]; then
    # In auth module files
    sed -i 's|from \x27\./api-client\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./api\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./security-service\x27|from \x27../../../security/security-service\x27|g' "$file"
  elif [[ "$file" == *"api/modules/diary"* ]]; then
    # In diary module files
    sed -i 's|from \x27\./api-client\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./api\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\.\./types/diary\x27|from \x27../../../../types/diary\x27|g' "$file"
  elif [[ "$file" == *"api/modules/nft"* ]]; then
    # In nft module files
    sed -i 's|from \x27\./api-client\x27|from \x27../../../api-client\x27|g' "$file"
  elif [[ "$file" == *"api/modules/user"* ]]; then
    # In user module files
    sed -i 's|from \x27\./api-client\x27|from \x27../../../api-client\x27|g' "$file"
  elif [[ "$file" == *"api/modules/wallet"* ]]; then
    # In wallet module files
    sed -i 's|from \x27\./api-client\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./api\x27|from \x27../../../api-client\x27|g' "$file"
    sed -i 's|from \x27\./security-service\x27|from \x27../../../security/security-service\x27|g' "$file"
  elif [[ "$file" == *"notifications"* ]]; then
    # In notifications files
    sed -i 's|from \x27\./api\x27|from \x27../api/api-client\x27|g' "$file"
    sed -i 's|from \x27\./api/realtime-service\x27|from \x27../realtime/websocket/realtime-service\x27|g' "$file"
    sed -i 's|from \x27\.\./types/api-types\x27|from \x27../types/api-types\x27|g' "$file"
  elif [[ "$file" == *"realtime/websocket"* ]]; then
    # In realtime service files
    sed -i 's|from \x27\.\./websocket-manager\x27|from \x27./websocket-manager\x27|g' "$file"
  elif [[ "$file" == *"security/encryption"* ]]; then
    # In encryption files
    sed -i 's|from \x27\./api\x27|from \x27../../api/api-client\x27|g' "$file"
    sed -i 's|from \x27\./security-service\x27|from \x27../security-service\x27|g' "$file"
  elif [[ "$file" == *"security"* ]]; then
    # In security files
    sed -i 's|from \x27\./api\x27|from \x27../api/api-client\x27|g' "$file"
    sed -i 's|from \x27\./device-fingerprint\x27|from \x27./protection/device-fingerprint\x27|g' "$file"
  elif [[ "$file" == *"storage/memory"* ]]; then
    # In memory manager files
    sed -i 's|from \x27\./cached-api\x27|from \x27../../api/client/optimized/cached-api\x27|g' "$file"
  fi
  
  # Fix specific component errors
  if [[ "$file" == *"components/WebSocketStatus.tsx"* ]]; then
    # WebSocketStatus implementation fix
    sed -i 's|realtimeService.onMessage|realtimeService.subscribeToMessage|g' "$file"
  elif [[ "$file" == *"contexts/auth.tsx"* ]]; then
    # Auth context implementation fix
    sed -i 's|authService.getUserProfile|authService.getProfile|g' "$file"
    sed -i 's|authService.loginWithWallet|authService.loginWithSignature|g' "$file"
  elif [[ "$file" == *"pages/real-time-demo.tsx"* ]]; then
    # Real time demo implementation fixes
    sed -i 's|realtimeService.onMessage|realtimeService.subscribeToMessage|g' "$file"
    sed -i 's|realtimeService.setAutoReconnect|realtimeService.configureReconnection|g' "$file"
    sed -i 's|realtimeService.reconnect|realtimeService.connect|g' "$file"
    sed -i 's|realtimeService.subscribe|realtimeService.subscribeToChannel|g' "$file"
    sed -i 's|realtimeService.unsubscribe|realtimeService.unsubscribeFromChannel|g' "$file"
  fi
}

# Fix imports in service files
echo "Fixing service module import paths..."
find /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services -type f -name "*.ts" ! -name "index.ts" | while read -r file; do
  fix_internal_imports "$file"
done

# Fix the service file that has ambiguous exports
echo "Fixing ambiguous exports in services/index.ts..."
sed -i 's|export \* from '\''./api'\''|// export * from '\''./api'\'' - Commented out to avoid ambiguity\nexport { api as apiClient } from '\''./api'\''|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/index.ts"

# Fix components with service usage
echo "Fixing components with service usage..."
COMPONENTS=(
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WebSocketStatus.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
  "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NotificationsPanel.tsx"
)

for comp in "${COMPONENTS[@]}"; do
  if [ -f "$comp" ]; then
    fix_internal_imports "$comp"
  fi
done

# Create api-client.ts file at root of services/api
echo "Creating api-client.ts at services/api root..."
mkdir -p "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api"
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/api-client.ts" << EOF
// Base API client that can be imported by any service
import axios from 'axios';
import { setupCache } from 'axios-cache-adapter';

// Create axios instance with default config
const cache = setupCache({
  maxAge: 15 * 60 * 1000, // 15 minutes cache
});

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: cache.adapter,
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
EOF

# Update all barrel files to properly export their modules
echo "Updating barrel files..."

# Update services/index.ts
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/index.ts" << EOF
// Main services barrel file
export * from './api';
export * from './security';
export * from './storage';
export * from './realtime';
export * from './notifications';
EOF

# Fix the real-time-demo.tsx file
echo "Updating real-time-demo import references..."
sed -i 's|subscribeToMessage|onMessage|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's|configureReconnection|setAutoReconnect|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's|subscribeToChannel|subscribe|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's|unsubscribeFromChannel|unsubscribe|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"

# Run TypeScript check to see if we fixed the errors
echo "Running TypeScript check to validate fixes..."
cd "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend" && npx tsc --noEmit

echo ""
echo "Import path fixing completed. Please check the output above to see if errors remain."
echo "Backup files are saved in the temp_backup directory."
echo ""
echo "If errors persist, you might need to manually fix some imports."
echo "Once all errors are resolved, you can safely remove the backup directory with:"
echo "rm -rf temp_backup"