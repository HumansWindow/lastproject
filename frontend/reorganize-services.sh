#!/bin/bash

# Create directories
echo "Creating new directory structure..."
mkdir -p src/services/api/client/base
mkdir -p src/services/api/client/optimized
mkdir -p src/services/api/modules/auth
mkdir -p src/services/api/modules/wallet
mkdir -p src/services/api/modules/diary
mkdir -p src/services/api/modules/user
mkdir -p src/services/api/modules/nft
mkdir -p src/services/security/encryption
mkdir -p src/services/security/protection
mkdir -p src/services/realtime/websocket
mkdir -p src/services/realtime/events
mkdir -p src/services/storage/cache
mkdir -p src/services/storage/memory
mkdir -p src/services/notifications

# Function to copy files with creation of parent directories
copy_file() {
  src=$1
  dest=$2
  
  if [ -f "$src" ]; then
    # Ensure destination directory exists
    mkdir -p $(dirname "$dest")
    
    # Copy the file
    cp "$src" "$dest"
    echo "Copied: $src -> $dest"
  else
    echo "Warning: Source file not found: $src"
  fi
}

# Copy API client files
copy_file "src/services/api/api-client.ts" "src/services/api/client/base/api-client.ts"

# Copy optimized API client files
copy_file "src/services/batch-request.ts" "src/services/api/client/optimized/batch-request.ts"
copy_file "src/services/cached-api.ts" "src/services/api/client/optimized/cached-api.ts"
copy_file "src/services/selective-api.ts" "src/services/api/client/optimized/selective-api.ts"
copy_file "src/services/compressed-api.ts" "src/services/api/client/optimized/compressed-api.ts"
copy_file "src/services/offline-api.ts" "src/services/api/client/optimized/offline-api.ts"
copy_file "src/services/monitoring-api.ts" "src/services/api/client/optimized/monitoring-api.ts"
copy_file "src/services/encrypted-api-client.ts" "src/services/api/client/optimized/encrypted-api-client.ts"
copy_file "src/services/secure-api-client.ts" "src/services/api/client/optimized/secure-api-client.ts"

# Copy authentication service files
copy_file "src/services/api/auth-service.ts" "src/services/api/modules/auth/auth-service.ts"
copy_file "src/services/auth-service.ts" "src/services/api/modules/auth/legacy-auth-service.ts"
copy_file "src/services/wallet-auth.service.ts" "src/services/api/modules/auth/wallet-auth-service.ts"

# Copy wallet service files
copy_file "src/services/wallet-integration.ts" "src/services/api/modules/wallet/wallet-integration.ts"
copy_file "src/services/api/wallet-service.ts" "src/services/api/modules/wallet/wallet-service.ts"
copy_file "src/services/multi-wallet-provider.ts" "src/services/api/modules/wallet/multi-wallet-provider.ts"

# Copy diary service files
copy_file "src/services/api/diary-service.ts" "src/services/api/modules/diary/diary-service.ts"
copy_file "src/services/diary.service.ts" "src/services/api/modules/diary/legacy-diary-service.ts"

# Copy user service files
copy_file "src/services/api/user-service.ts" "src/services/api/modules/user/user-service.ts"
copy_file "src/services/api/referral-service.ts" "src/services/api/modules/user/referral-service.ts"

# Copy NFT and token service files
copy_file "src/services/api/nft-service.ts" "src/services/api/modules/nft/nft-service.ts"
copy_file "src/services/api/token-service.ts" "src/services/api/modules/nft/token-service.ts"

# Copy security files
copy_file "src/services/encryption-service.ts" "src/services/security/encryption/encryption-service.ts"
copy_file "src/services/device-fingerprint.ts" "src/services/security/protection/device-fingerprint.ts"
copy_file "src/services/security-service.ts" "src/services/security/security-service.ts"
copy_file "src/services/captcha-service.ts" "src/services/security/protection/captcha-service.ts"

# Copy realtime communication files
copy_file "src/services/websocket-manager.ts" "src/services/realtime/websocket/websocket-manager.ts"
copy_file "src/services/api/realtime-service.ts" "src/services/realtime/websocket/realtime-service.ts"
copy_file "src/services/api/event-bus.ts" "src/services/realtime/events/event-bus.ts"

# Copy storage files
copy_file "src/services/cache-utils.ts" "src/services/storage/cache/cache-utils.ts"
copy_file "src/services/memory-manager.ts" "src/services/storage/memory/memory-manager.ts"

# Copy notification files
copy_file "src/services/notification-service.ts" "src/services/notifications/notification-service.ts"

# Create index files for each directory to enable nice imports
echo "Creating index files for exports..."

# Root index file
cat > src/services/index.ts << EOF
// Main barrel file for all services
export * from './api';
export * from './security';
export * from './realtime';
export * from './storage';
export * from './notifications';
EOF

# API index file
cat > src/services/api/index.ts << EOF
// API services barrel file
export * from './client';
export * from './modules';
EOF

# API client index file
cat > src/services/api/client/index.ts << EOF
// API client barrel file
export * from './base';
export * from './optimized';
EOF

# API client base index file
cat > src/services/api/client/base/index.ts << EOF
// Base API client exports
export * from './api-client';
EOF

# API client optimized index file
cat > src/services/api/client/optimized/index.ts << EOF
// Optimized API clients export
export * from './batch-request';
export * from './cached-api';
export * from './selective-api';
export * from './compressed-api';
export * from './offline-api';
export * from './monitoring-api';
export * from './encrypted-api-client';
export * from './secure-api-client';
EOF

# API modules index file
cat > src/services/api/modules/index.ts << EOF
// API modules barrel file
export * from './auth';
export * from './wallet';
export * from './diary';
export * from './user';
export * from './nft';
EOF

# API modules auth index file
cat > src/services/api/modules/auth/index.ts << EOF
// Auth module exports
export * from './auth-service';
export * from './wallet-auth-service';
EOF

# API modules wallet index file
cat > src/services/api/modules/wallet/index.ts << EOF
// Wallet module exports
export * from './wallet-service';
export * from './wallet-integration';
export * from './multi-wallet-provider';
EOF

# API modules diary index file
cat > src/services/api/modules/diary/index.ts << EOF
// Diary module exports
export * from './diary-service';
EOF

# API modules user index file
cat > src/services/api/modules/user/index.ts << EOF
// User module exports
export * from './user-service';
export * from './referral-service';
EOF

# API modules nft index file
cat > src/services/api/modules/nft/index.ts << EOF
// NFT module exports
export * from './nft-service';
export * from './token-service';
EOF

# Security index file
cat > src/services/security/index.ts << EOF
// Security services barrel file
export * from './encryption';
export * from './protection';
export * from './security-service';
EOF

# Security encryption index file
cat > src/services/security/encryption/index.ts << EOF
// Encryption services exports
export * from './encryption-service';
EOF

# Security protection index file
cat > src/services/security/protection/index.ts << EOF
// Protection services exports
export * from './device-fingerprint';
export * from './captcha-service';
EOF

# Realtime index file
cat > src/services/realtime/index.ts << EOF
// Realtime services barrel file
export * from './websocket';
export * from './events';
EOF

# Realtime websocket index file
cat > src/services/realtime/websocket/index.ts << EOF
// Websocket services exports
export * from './websocket-manager';
export * from './realtime-service';
EOF

# Realtime events index file
cat > src/services/realtime/events/index.ts << EOF
// Event services exports
export * from './event-bus';
EOF

# Storage index file
cat > src/services/storage/index.ts << EOF
// Storage services barrel file
export * from './cache';
export * from './memory';
EOF

# Storage cache index file
cat > src/services/storage/cache/index.ts << EOF
// Cache services exports
export * from './cache-utils';
EOF

# Storage memory index file
cat > src/services/storage/memory/index.ts << EOF
// Memory services exports
export * from './memory-manager';
EOF

# Notifications index file
cat > src/services/notifications/index.ts << EOF
// Notification services exports
export * from './notification-service';
EOF

echo "Done creating reorganized service structure."
echo "IMPORTANT: This script only creates the new structure alongside the existing one."
echo "After verifying that everything works, you should update your imports and remove the old files."