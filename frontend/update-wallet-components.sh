#!/bin/bash

PROJECT_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

# Components to check and update
COMPONENTS=(
  "$PROJECT_DIR/src/components/NFTTransferMonitor.tsx"
  "$PROJECT_DIR/src/components/RealTimeBalance.tsx"
  "$PROJECT_DIR/src/components/WalletBalanceMonitor.tsx"
)

echo "Checking for components using old wallet service imports..."

for component in "${COMPONENTS[@]}"; do
  if [ -f "$component" ]; then
    echo "Found component: $(basename $component)"
    
    # First create a backup
    cp "$component" "${component}.bak"
    echo "✓ Backup created: ${component}.bak"
    
    # Check if it's using old wallet imports
    if grep -q -E "from ['\"].*services/api/(modules/wallet|modules/auth/wallet|wallet-service)['\"]" "$component"; then
      echo "⚠️  This component uses old wallet imports and needs updating"
      
      # Update imports from old wallet services to new consolidated service
      sed -i 's|from "../services/api/modules/wallet/.*"|from "../services/wallet"|g' "$component"
      sed -i 's|from "../services/api/wallet-service"|from "../services/wallet"|g' "$component"
      sed -i 's|from "../services/api/modules/auth/wallet-auth-service"|from "../services/wallet"|g' "$component"
      
      echo "✓ Updated imports in: $(basename $component)"
      
      # Now check for specific methods that might need updating
      if grep -q -E "(connectWallet|signMessage|getWalletAddress|disconnectWallet)" "$component"; then
        echo "⚠️  Component may use methods that have been renamed. Manual review recommended."
      fi
    else
      echo "✓ No old wallet imports found in this component"
    fi
  else
    echo "❌ Component not found: $(basename $component)"
  fi
  echo ""
done

echo "Component updates complete!"
