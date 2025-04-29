#!/bin/bash

echo "=== Fixing module resolution issues ==="
echo "This script will clean up node_modules and reinstall dependencies correctly"

# Navigate to the root project folder
cd /home/alivegod/Desktop/LastProject

echo "1. Removing node_modules folders..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf backend/dist

echo "2. Clearing npm cache..."
npm cache clean --force

echo "3. Installing backend dependencies..."
cd backend
npm install

echo "4. Making sure all NestJS dependencies are installed locally in backend..."
npm install @nestjs/core@9.0.0 @nestjs/common@9.0.0 @nestjs/config@3.0.0 @nestjs/platform-express@9.0.0 --save

echo "5. Installing missing dependencies..."
npm install --save @solana/web3.js tiny-secp256k1 helmet isomorphic-fetch
npm install --save-dev @types/helmet @types/isomorphic-fetch

echo "6. Creating a clean build..."
npm run build

echo "=== Dependency fix complete ==="
echo "Now you can start your backend server with: cd backend && npm run start:dev"
