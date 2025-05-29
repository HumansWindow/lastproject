#!/bin/bash

# Script to check for duplicate or deprecated files in the frontend
# Usage: ./check-frontend-duplicates.sh

FRONTEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend"
OUTPUT_FILE="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend-duplicate-check-$(date +%Y%m%d_%H%M%S).log"

echo "Frontend Duplicate & Deprecated Files Check" > $OUTPUT_FILE
echo "Run on: $(date)" >> $OUTPUT_FILE
echo "----------------------------------------" >> $OUTPUT_FILE

# Check for .bak files
echo -e "\n## Checking for .bak files:" >> $OUTPUT_FILE
find $FRONTEND_DIR -name "*.bak" -type f >> $OUTPUT_FILE

# Check for known deprecated files
echo -e "\n## Known deprecated files:" >> $OUTPUT_FILE
for file in \
    "$FRONTEND_DIR/src/services/realtime.ts" \
    "$FRONTEND_DIR/src/services/api/auth.ts" \
    "$FRONTEND_DIR/src/services/api/auth-service.ts" \
    "$FRONTEND_DIR/src/services/api/walletAuth.service.ts" \
    "$FRONTEND_DIR/src/services/wallet/auth/walletAuthService.ts" \
    "$FRONTEND_DIR/src/services/security/device-fingerprint.ts" \
    "$FRONTEND_DIR/src/services/security/protection/deviceFingerprint.ts"; do
    
    if [ -f "$file" ]; then
        echo "Still exists: $file" >> $OUTPUT_FILE
        grep -n "@deprecated" "$file" >> $OUTPUT_FILE || echo "  - Warning: No @deprecated tag found" >> $OUTPUT_FILE
    fi
done

# Check for imports from deprecated paths
echo -e "\n## Files still importing from deprecated paths:" >> $OUTPUT_FILE

echo -e "\n### Imports from 'services/realtime' (should use 'services/realtime/index'):" >> $OUTPUT_FILE
grep -r --include="*.ts" --include="*.tsx" "from ['\"].*services/realtime['\"]" $FRONTEND_DIR/src >> $OUTPUT_FILE

echo -e "\n### Imports from 'services/api/auth' (should use 'services/api/modules/auth'):" >> $OUTPUT_FILE
grep -r --include="*.ts" --include="*.tsx" "from ['\"].*services/api/auth['\"]" $FRONTEND_DIR/src >> $OUTPUT_FILE

echo -e "\n### Imports from 'services/api/auth-service' (should use 'services/api/modules/auth'):" >> $OUTPUT_FILE
grep -r --include="*.ts" --include="*.tsx" "from ['\"].*services/api/auth-service['\"]" $FRONTEND_DIR/src >> $OUTPUT_FILE

echo -e "\n### Imports from 'services/wallet/auth/walletAuthService' (should use 'services/api/modules/auth'):" >> $OUTPUT_FILE
grep -r --include="*.ts" --include="*.tsx" "from ['\"].*services/wallet/auth/walletAuthService['\"]" $FRONTEND_DIR/src >> $OUTPUT_FILE

echo -e "\n### Imports from 'security/device-fingerprint' (should use 'security/modules/device-fingerprint'):" >> $OUTPUT_FILE
grep -r --include="*.ts" --include="*.tsx" "from ['\"].*security/device-fingerprint['\"]" $FRONTEND_DIR/src >> $OUTPUT_FILE

echo -e "\nCheck completed. Results saved to $OUTPUT_FILE"
