#!/bin/bash

echo "Fixing project dependencies..."

# Navigate to the root project folder
cd /home/alivegod/Desktop/LastProject

# Remove node_modules in root and backend to start fresh
rm -rf node_modules
rm -rf backend/node_modules

# Install root dependencies
npm install

# Navigate to backend and install its dependencies
cd backend
npm install

# Install specific missing dependencies
npm install --save @solana/web3.js tiny-secp256k1 helmet
npm install --save-dev @types/helmet

# Rebuild the project
npm run build

# Return to the project root
cd ..

echo "Dependencies fixed. Now you can start your backend server."
