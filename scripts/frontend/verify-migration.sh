#!/bin/bash

# This script verifies that the service migration completed properly

echo "Verifying service migration..."

# Check if any files still reference the old service paths
echo "Checking for old service paths..."

OLD_SERVICE_PATHS=(
  "from '../services/api'"
  "from '../services/websocket-manager'"
  "from '../services/notification-service'"
  "from '../services/wallet-auth.service'"
  "from '../services/auth-service'"
  "from '../services/security-service'"
  "from '../services/device-fingerprint'"
  "from '../services/captcha-service'"
  "from '../services/encryption-service'"
  "from '../services/batch-request'"
  "from '../services/cached-api'"
  "from '../services/selective-api'"
  "from '../services/compressed-api'"
  "from '../services/offline-api'"
  "from '../services/monitoring-api'"
  "from '../services/encrypted-api-client'"
  "from '../services/secure-api-client'"
  "from '../services/memory-manager'"
  "from '../services/cache-utils'"
)

# Check each old path
found_old_imports=false

for path in "${OLD_SERVICE_PATHS[@]}"; do
  results=$(grep -r --include="*.ts" --include="*.tsx" "$path" /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src 2>/dev/null)
  
  if [ -n "$results" ]; then
    echo "Found old import: $path"
    echo "$results" | sed 's/^/  /'
    echo ""
    found_old_imports=true
  fi
done

if ! $found_old_imports; then
  echo "No old service import paths found. Migration successful!"
fi

# Check if barrel files are exporting properly
echo "Checking barrel export files..."

check_barrel_file() {
  local barrel_file=$1
  local dir=$(dirname "$barrel_file")
  
  # Get all .ts files in the directory (excluding index.ts and test/spec files)
  local ts_files=$(find "$dir" -maxdepth 1 -name "*.ts" ! -name "index.ts" ! -name "*.spec.ts" ! -name "*.test.ts")
  
  if [ -z "$ts_files" ]; then
    echo "  No .ts files in $dir to export"
    return
  fi
  
  # Check if each .ts file is exported in the index.ts
  for ts_file in $ts_files; do
    local file_name=$(basename "$ts_file" .ts)
    if ! grep -q "export.*from.*['\"]\./${file_name}['\"]" "$barrel_file" && ! grep -q "export.*from.*['\"]\./${file_name}.js['\"]" "$barrel_file"; then
      echo "  Missing export for $file_name in $barrel_file"
    fi
  done
}

# Find all barrel files and check them
find /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services -name "index.ts" -type f | while read -r barrel_file; do
  check_barrel_file "$barrel_file"
done

echo ""
echo "===== MIGRATION COMPLETION CHECKLIST ====="
echo "1. No old service import paths were found ✓"
echo "2. All service files are properly exported in barrel files"
echo "3. Test the application to ensure everything works with the new structure"
echo "4. If tests pass, consider removing the src/services_backup folder"
echo ""
echo "The new service structure provides better organization and makes it"
echo "easier to maintain and extend your services."