#!/bin/bash

echo "Installing missing dependencies..."

# Navigate to backend folder
cd /home/alivegod/Desktop/LastProject/backend

# Install missing dependencies
npm install --save @solana/web3.js tiny-secp256k1 helmet isomorphic-fetch
npm install --save-dev @types/helmet @types/isomorphic-fetch

echo "Missing dependencies installed. Now restart your backend server."
