#!/bin/bash

# Finalize the services folder restructuring
echo "Finalizing services folder restructuring..."

# Create a backup of the old services directory
echo "Creating backup of original services directory..."
mkdir -p src/services_backup
rsync -a src/services/ src/services_backup/
echo "Backup created in src/services_backup/"

# Find files that need import path updates
echo "Finding files that still need import path updates..."

FILES_TO_FIX=$(grep -r --include="*.ts" --include="*.tsx" -l "from '../services/" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/hooks /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts 2>/dev/null)

if [ -n "$FILES_TO_FIX" ]; then
  echo "The following files still need import path updates:"
  echo "$FILES_TO_FIX" | sed 's/^/  /'
  
  echo -n "Do you want to see the specific imports that need to be changed? [y/N]: "
  read SHOW_IMPORTS
  
  if [ "$SHOW_IMPORTS" = "y" ] || [ "$SHOW_IMPORTS" = "Y" ]; then
    for file in $FILES_TO_FIX; do
      echo "In file: $file"
      grep -n "from '../services/" "$file" | sed 's/^/  /'
      echo ""
    done
  fi
else
  echo "No files found that need import path updates. Great!"
fi

# Create a file with import mapping suggestions
echo "Creating import mapping suggestions file..."
cat > src/services/import-mapping.txt << EOF
# Import path migration guide

This file contains a mapping of old imports to their new locations 
to help with updating import statements in your code.

## Common Imports

from '../services/api' → from '../services/realtime/websocket/realtime-service'
from '../services/websocket-manager' → from '../services/realtime/websocket/websocket-manager'
from '../services/notification-service' → from '../services/notifications/notification-service'
from '../services/wallet-auth.service' → from '../services/api/modules/auth/wallet-auth-service'
from '../services/auth-service' → from '../services/api/modules/auth/auth-service'
from '../services/api/auth-service' → from '../services/api/modules/auth/auth-service'
from '../services/api/wallet-service' → from '../services/api/modules/wallet/wallet-service'
from '../services/api/diary-service' → from '../services/api/modules/diary/diary-service'
from '../services/api/token-service' → from '../services/api/modules/nft/token-service'
from '../services/api/nft-service' → from '../services/api/modules/nft/nft-service'
from '../services/security-service' → from '../services/security/security-service'

## Optimized API Clients

from '../services/batch-request' → from '../services/api/client/optimized/batch-request'
from '../services/cached-api' → from '../services/api/client/optimized/cached-api'
from '../services/selective-api' → from '../services/api/client/optimized/selective-api'
from '../services/compressed-api' → from '../services/api/client/optimized/compressed-api'
from '../services/offline-api' → from '../services/api/client/optimized/offline-api'
from '../services/monitoring-api' → from '../services/api/client/optimized/monitoring-api'
from '../services/encrypted-api-client' → from '../services/api/client/optimized/encrypted-api-client'
from '../services/secure-api-client' → from '../services/api/client/optimized/secure-api-client'

## Security Features

from '../services/device-fingerprint' → from '../services/security/protection/device-fingerprint'
from '../services/captcha-service' → from '../services/security/protection/captcha-service'
from '../services/encryption-service' → from '../services/security/encryption/encryption-service'

## Memory Management

from '../services/memory-manager' → from '../services/storage/memory/memory-manager'
from '../services/cache-utils' → from '../services/storage/cache/cache-utils'
EOF

echo "Import mapping suggestions created at src/services/import-mapping.txt"

# Check if there are circular dependencies that need fixing
echo "Checking for circular dependencies in service files..."

CIRCULAR_DEPS=$(grep -r --include="*.ts" "import .* from '\.\./\.\./services" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services 2>/dev/null)

if [ -n "$CIRCULAR_DEPS" ]; then
  echo "Warning: Potential circular dependencies found:"
  echo "$CIRCULAR_DEPS" | sed 's/^/  /'
  echo "These may need manual fixing."
fi

# Check if barrel export files were correctly created
echo "Checking barrel export files..."

BARREL_FILES=$(find src/services -name "index.ts" -type f)

echo "The following barrel files exist:"
echo "$BARREL_FILES" | sed 's/^/  /'

# Final instructions
echo ""
echo "===== MIGRATION STEPS TO COMPLETE MANUALLY ====="
echo "1. Update the remaining import paths in the files listed above"
echo "2. Fix any circular dependencies identified above"
echo "3. Test the application to ensure everything works with the new structure"
echo "4. Once everything works, you may optionally remove the src/services_backup folder"
echo ""
echo "The migration process has set up the new structure, but you'll need to manually"
echo "update any remaining import paths that reference the old structure."
echo ""
echo "For help with the import paths, refer to src/services/import-mapping.txt"
echo "======================================================"