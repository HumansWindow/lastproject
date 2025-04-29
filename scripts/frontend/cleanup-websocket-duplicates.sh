#!/bin/bash

echo "Starting WebSocket code cleanup..."

echo "1. Checking for imports from old code..."
grep -r "from '.*realtime'" --include="*.ts" --include="*.tsx" ./src

echo "2. Checking for potential conflict files..."
find ./src -path "*/*realtime*.ts" -type f | sort

echo "3. Created backup of key files..."
mkdir -p ./backup-realtime
cp ./src/services/realtime.ts ./backup-realtime/ 2>/dev/null || echo "No realtime.ts to backup"
cp ./src/services/realtime/websocket/realtime-service.ts ./backup-realtime/ 2>/dev/null || echo "No realtime-service.ts to backup"
cp ./src/types/realtime-types.ts ./backup-realtime/ 2>/dev/null || echo "No realtime-types.ts to backup"

echo "Cleanup script finished. Run 'npm run build' to verify the changes."
echo "If build succeeds, you can safely delete any duplicate files listed above."
