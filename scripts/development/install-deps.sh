#!/bin/bash

# This script installs the needed dependencies for the tests

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install --save-dev jest@^29.5.0 ts-jest@^29.1.0
npm install --save ethers@^5.7.2 bip39@^3.0.4 @solana/web3.js@^1.73.0

# Check for errors
if [ $? -eq 0 ]; then
  echo "Dependencies installed successfully!"
else
  echo "Error installing dependencies. Please check the output above."
  exit 1
fi

echo "Now you can run the tests with: npm test -- src/__tests__/blockchain/hotwallet-basic.spec.ts"
