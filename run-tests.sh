#!/bin/bash

# Set environment variable
export NODE_ENV=test

# Set test mnemonic (use a standard BIP39 mnemonic for testing only)
# This is a standard test mnemonic, NEVER use this in production!
export TEST_MNEMONIC="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

# Set text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running HotWallet Tests...${NC}"
echo

# Run the HotWallet test with memory leak detection
cd backend && npm run test:file:with-db:no-open-handles -- src/__tests__/blockchain/hotwallet.spec.ts

# Check exit code
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✓ HotWallet tests passed successfully!${NC}"
else
  echo -e "\n${RED}✗ HotWallet tests failed.${NC}"
  exit 1
fi
