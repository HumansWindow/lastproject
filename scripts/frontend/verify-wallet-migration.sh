#!/bin/bash

PROJECT_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

echo "Verifying wallet authentication migration..."
echo "==========================================="

# Check if all required new files exist
NEW_FILES=(
  "$PROJECT_DIR/src/services/wallet/core/wallet-base.ts"
  "$PROJECT_DIR/src/services/wallet/core/connection.ts"
  "$PROJECT_DIR/src/services/wallet/providers/ethereum/metamask.ts"
  "$PROJECT_DIR/src/services/wallet/providers/ethereum/walletconnect.ts"
  "$PROJECT_DIR/src/services/wallet/auth/wallet-auth.ts"
  "$PROJECT_DIR/src/services/wallet/auth/challenge.ts"
  "$PROJECT_DIR/src/services/wallet/index.ts"
  "$PROJECT_DIR/src/contexts/wallet.tsx"
  "$PROJECT_DIR/src/contexts/auth.tsx"
)

for file in "${NEW_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ File exists: $(basename $file)"
  else
    echo "❌ Missing file: $(basename $file)"
  fi
done

echo ""
echo "Checking that old files are removed:"
echo "-----------------------------------"

# Check that old files are gone
OLD_FILES=(
  "$PROJECT_DIR/src/services/api/modules/auth/wallet-auth-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-integration.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/wallet-service.ts"
  "$PROJECT_DIR/src/services/api/modules/wallet/multi-wallet-provider.ts"
  "$PROJECT_DIR/src/services/api/wallet-service.ts"
)

for file in "${OLD_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "✓ Removed: $(basename $file)"
  else
    echo "⚠️ Still exists: $(basename $file)"
  fi
done

echo ""
echo "Checking for any remaining old imports:"
echo "-------------------------------------"

REMAINING_IMPORTS=$(grep -r --include="*.ts*" -E "from ['\"].*services/api/(modules/wallet|modules/auth/wallet-auth-service|wallet-service)['\"]" "$PROJECT_DIR")

if [ -z "$REMAINING_IMPORTS" ]; then
  echo "✓ No old wallet imports found in the codebase!"
else
  echo "⚠️ Found remaining old imports that need to be updated:"
  echo "$REMAINING_IMPORTS"
fi

echo ""
echo "Migration verification complete!"
