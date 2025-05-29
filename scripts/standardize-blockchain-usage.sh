#!/bin/bash

# Script to help standardize blockchain constant usage across the frontend
# Run from the project root directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Blockchain Constants Usage Analysis =====${NC}"
echo -e "This script will help identify inconsistent blockchain type usage"
echo

# Find hardcoded blockchain strings
echo -e "${YELLOW}1. Looking for hardcoded blockchain strings${NC}"
grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "'polygon'" frontend/src/
grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "\"polygon\"" frontend/src/
echo

# Find functions that don't use normalized blockchain types 
echo -e "${YELLOW}2. Functions using blockchain types that don't import constants${NC}"
grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "blockchain.*type" frontend/src/ | grep -v "import.*blockchain/constants"
echo

# Find functions that should be standardized
echo -e "${YELLOW}3. Authentication functions that should be standardized${NC}"
grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "authenticateWithWallet" frontend/src/
echo

# Find wallet connection functions
echo -e "${YELLOW}4. Wallet connection functions${NC}"
grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "connect.*wallet" frontend/src/
echo

echo -e "${GREEN}===== Recommended Changes =====${NC}"
echo "1. Import blockchain constants from central file in all files using blockchain types"
echo "2. Replace hardcoded strings with constant values"
echo "3. Use normalizeBlockchainType() function when handling blockchain types from external sources"
echo "4. Standardize authentication implementations to use the same constants"