#!/bin/bash

echo "===== COMPREHENSIVE DEPENDENCY FIX ====="
echo "This script will fix module resolution issues in both backend and frontend"

# Navigate to the project root
cd /home/alivegod/Desktop/LastProject

echo "1. Clearing all node_modules folders and caches..."
rm -rf node_modules
rm -rf backend/node_modules
rm -rf backend/dist
rm -rf frontend/node_modules
npm cache clean --force

echo "2. Installing consistent versions of NestJS dependencies in backend..."
cd backend
npm install --save @nestjs/common@9.0.0 \
  @nestjs/core@9.0.0 \
  @nestjs/config@3.0.0 \
  @nestjs/platform-express@9.0.0 \
  @nestjs/swagger@7.0.0

echo "3. Installing required backend dependencies and types..."
npm install --save helmet isomorphic-fetch @solana/web3.js tiny-secp256k1 cookie-parser dotenv
npm install --save-dev @types/helmet @types/isomorphic-fetch @types/cookie-parser @types/dotenv @types/node @types/jest

echo "4. Installing frontend dependencies..."
cd ../frontend
npm install --save react react-dom axios@0.27.2 ethers
npm install --save-dev @types/react @types/react-dom

echo "5. Fixing axios typings in the frontend..."
# Create a type fix for axios request interceptor
mkdir -p ./src/types
cat > ./src/types/axios.d.ts << 'EOF'
import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
EOF

# Update the API service to use the correct types
cat > ./src/utils/axios-config.ts << 'EOF'
import axios from 'axios';

// Add a retry property to the AxiosRequestConfig
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export default axios;
EOF

echo "6. Building backend project..."
cd ../backend
npm run build

echo "7. Running backend fixes script..."
cd ../backend
bash fix-deps.sh

echo "===== ALL DEPENDENCIES FIXED ====="
echo "You can now start your backend and frontend servers"
