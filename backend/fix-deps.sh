#!/bin/bash

echo "Fixing dependency issues..."

# Make sure we're in the backend directory
cd "$(dirname "$0")"

# Install missing type definitions
echo "Installing missing type definitions..."
npm install --save-dev @types/node @types/jest @types/cookie-parser @types/dotenv

# Install missing NestJS packages with fixed versions
echo "Installing NestJS dependencies..."
npm install --save @nestjs/core@9.0.0 @nestjs/common@9.0.0 @nestjs/config@3.0.0 \
  @nestjs/platform-express@9.0.0 @nestjs/swagger@7.0.0 

# Install other missing packages
npm install --save cookie-parser helmet dotenv

# Create the fix-all-deps.js script to apply targeted fixes
cat > fix-all-deps.js << 'EOF'
const fs = require('fs');
const path = require('path');

console.log('Starting application setup...');

// Fix dependencies directly
console.log('Fixing dependency issues directly...');

// Fix schedule explorer for the syntax error only
try {
  const scheduleExplorerPath = path.join(__dirname, 'node_modules/@nestjs/schedule/dist/schedule.explorer.js');
  
  if (fs.existsSync(scheduleExplorerPath)) {
    console.log('Checking schedule.explorer.js...');
    const content = fs.readFileSync(scheduleExplorerPath, 'utf-8');
    
    if (content.includes('const instanceWrappers = [')) {
      const modifiedContent = content.replace('const instanceWrappers = [', 'var instanceWrappers = [');
      fs.writeFileSync(scheduleExplorerPath, modifiedContent, 'utf-8');
      console.log('Fixed variable declaration in schedule.explorer.js');
    } else {
      console.log('No issues found in schedule.explorer.js');
    }
  } else {
    console.log('schedule.explorer.js not found');
  }
} catch (error) {
  console.error('Error modifying schedule explorer:', error.message);
}

// Create temporary fixes for module issues
console.log('Creating temporary fixes for module issues...');

// Fix InstanceLinksHost
try {
  const instanceLinksHostPath = path.join(__dirname, 'node_modules/@nestjs/core/injector/instance-links-host.js');
  
  if (fs.existsSync(instanceLinksHostPath)) {
    console.log('Checking instance-links-host.js...');
    const content = fs.readFileSync(instanceLinksHostPath, 'utf-8');
    
    // Fix potential undefined property access
    if (content.includes('if (!wrapper.id) {')) {
      const modifiedContent = content.replace('if (!wrapper.id) {', 'if (!wrapper || !wrapper.id) {');
      fs.writeFileSync(instanceLinksHostPath, modifiedContent, 'utf-8');
      console.log('Fixed wrapper check in instance-links-host.js');
    } else {
      console.log('No issues found in instance-links-host.js');
    }
  } else {
    console.log('instance-links-host.js not found');
  }
} catch (error) {
  console.error('Error fixing InstanceLinksHost:', error.message);
}

// Create CORS config file if it doesn't exist
try {
  const corsConfigDir = path.join(__dirname, 'src/shared/config');
  const corsConfigPath = path.join(corsConfigDir, 'cors.config.ts');
  
  if (!fs.existsSync(corsConfigDir)) {
    fs.mkdirSync(corsConfigDir, { recursive: true });
  }
  
  if (!fs.existsSync(corsConfigPath)) {
    console.log('Creating CORS config file...');
    const corsConfigContent = `import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS configuration for the application
 * Adjusts allowed origins based on environment
 */
export const getCorsConfig = (): CorsOptions => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://alivehuman.com',
        'https://app.alivehuman.com',
        // Add other production domains as needed
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Add other development domains as needed
      ];

  return {
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};`;
    fs.writeFileSync(corsConfigPath, corsConfigContent, 'utf-8');
    console.log('CORS config file created');
  }
} catch (error) {
  console.error('Error creating CORS config file:', error.message);
}

console.log('NestJS compatibility fixes applied.');
EOF

# Update start-app.js to load our fixes
cat > start-app.js << 'EOF'
#!/usr/bin/env node

console.log('Starting application setup...');

// Apply only necessary fixes
try {
  // Run a minimal set of fixes
  require('./fix-all-deps');
} catch (error) {
  console.error('Error applying fixes:', error);
}

// Set NODE_PATH to ensure modules can be found
process.env.NODE_PATH = './node_modules';
require('module').Module._initPaths();

// Start the application
try {
  require('./dist/main');
} catch (error) {
  console.error('Fatal error starting application:', error);
  process.exit(1);
}
EOF
chmod +x start-app.js

# Add blockchain-specific config 
mkdir -p src/blockchain/config
cat > src/blockchain/config/blockchain-environment.ts << 'EOF'
/**
 * Default blockchain configuration values
 * This file centralizes all default RPC URLs and other blockchain configuration
 * to ensure consistency across the application
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load blockchain-specific environment variables
const blockchainEnvPath = path.resolve(__dirname, '..', 'hotwallet', '.env');
if (fs.existsSync(blockchainEnvPath)) {
  dotenv.config({ path: blockchainEnvPath });
}

export const DEFAULT_RPC_URLS = {
  ETH_RPC_URL: 'https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
  BNB_RPC_URL: 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey',
  SOL_RPC_URL: 'https://mainnet.helius-rpc.com/?api-key=77ab1854-d2c4-4c8b-a682-dc32234ad17f',
  MATIC_RPC_URL: 'https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
  // Also provide WebSocket URLs where applicable
  ETH_WS_URL: 'wss://mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
  MATIC_WS_URL: 'wss://polygon-mainnet.infura.io/ws/v3/b9980d193a9e496e92e948e0f01ad7c4',
};

// Export a single static reference to prevent multiple configurations
let GLOBAL_CONFIG: Record<string, any> | null = null;

/**
 * Creates a complete blockchain configuration object with all required properties
 * @param config Optional partial configuration that will override defaults
 * @returns Complete configuration with all required properties
 */
export function createBlockchainConfig(config?: Record<string, any>) {
  // If config is already created and no new config is provided, return the global config
  if (GLOBAL_CONFIG && !config) {
    return GLOBAL_CONFIG;
  }
  
  const safeConfig = config || {};
  
  // Ensure we get values from environment variables first, then config
  const envConfig = {
    ETH_RPC_URL: process.env.ETH_RPC_URL,
    BNB_RPC_URL: process.env.BNB_RPC_URL, 
    SOL_RPC_URL: process.env.SOL_RPC_URL,
    MATIC_RPC_URL: process.env.MATIC_RPC_URL
  };
  
  // Start with defaults
  const result = {
    ETH_RPC_URL: envConfig.ETH_RPC_URL || DEFAULT_RPC_URLS.ETH_RPC_URL,
    BNB_RPC_URL: envConfig.BNB_RPC_URL || DEFAULT_RPC_URLS.BNB_RPC_URL,
    SOL_RPC_URL: envConfig.SOL_RPC_URL || DEFAULT_RPC_URLS.SOL_RPC_URL,
    MATIC_RPC_URL: envConfig.MATIC_RPC_URL || DEFAULT_RPC_URLS.MATIC_RPC_URL,
    // Shorthand versions
    ETH: envConfig.ETH_RPC_URL || DEFAULT_RPC_URLS.ETH_RPC_URL,
    BNB: envConfig.BNB_RPC_URL || DEFAULT_RPC_URLS.BNB_RPC_URL,
    SOL: envConfig.SOL_RPC_URL || DEFAULT_RPC_URLS.SOL_RPC_URL,
    MATIC: envConfig.MATIC_RPC_URL || DEFAULT_RPC_URLS.MATIC_RPC_URL,
    // Other common properties
    encryptPrivateKeys: false
  };
  
  // Override with input config values if present
  if (safeConfig.ETH_RPC_URL || safeConfig.ETH) {
    result.ETH_RPC_URL = safeConfig.ETH_RPC_URL || safeConfig.ETH || result.ETH_RPC_URL;
    result.ETH = result.ETH_RPC_URL;
  }
  
  if (safeConfig.BNB_RPC_URL || safeConfig.BNB) {
    result.BNB_RPC_URL = safeConfig.BNB_RPC_URL || safeConfig.BNB || result.BNB_RPC_URL;
    result.BNB = result.BNB_RPC_URL;
  }
  
  if (safeConfig.SOL_RPC_URL || safeConfig.SOL) {
    result.SOL_RPC_URL = safeConfig.SOL_RPC_URL || safeConfig.SOL || result.SOL_RPC_URL;
    result.SOL = result.SOL_RPC_URL;
  }
  
  if (safeConfig.MATIC_RPC_URL || safeConfig.MATIC) {
    result.MATIC_RPC_URL = safeConfig.MATIC_RPC_URL || safeConfig.MATIC || result.MATIC_RPC_URL;
    result.MATIC = result.MATIC_RPC_URL;
  }
  
  // Add any other properties from the input config
  Object.keys(safeConfig).forEach(key => {
    if (!result.hasOwnProperty(key)) {
      result[key] = safeConfig[key];
    }
  });
  
  // Store as global config for future reference
  GLOBAL_CONFIG = result;
  
  return result;
}

// Create default instance of config
createBlockchainConfig();

/**
 * Get the global blockchain config
 * This is useful when you need to access the configuration but can't use dependency injection
 */
export function getBlockchainConfig(): Record<string, any> {
  if (!GLOBAL_CONFIG) {
    GLOBAL_CONFIG = createBlockchainConfig();
  }
  return GLOBAL_CONFIG;
}
EOF

# Remove existing node_modules 
if [ -d "node_modules" ]; then
  echo "Removing existing node_modules..."
  rm -rf node_modules
fi

if [ -d "node_modules_local" ]; then
  echo "Removing node_modules_local..."
  rm -rf node_modules_local
fi

# Create directories
mkdir -p node_modules

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Create a simple project structure to force npm to install dependencies locally
echo "Setting up local npm environment..."
echo '{
  "name": "nestjs-local-deps",
  "version": "1.0.0",
  "dependencies": {
    "@nestjs/core": "^10.2.10",
    "@nestjs/common": "^10.2.10", 
    "@nestjs/event-emitter": "^2.1.1",
    "@nestjs/platform-express": "^10.2.10",
    "@nestjs/platform-socket.io": "^10.2.10",
    "@nestjs/websockets": "^10.2.10",
    "@nestjs/schedule": "^3.0.4",
    "nestjs-real-ip": "^3.0.1",
    "socket.io": "^4.7.2",
    "reflect-metadata": "^0.1.14"
  }
}' > temp-package.json

# Install the core dependencies explicitly in the backend directory
echo "Installing core NestJS dependencies locally..."
npm install --no-save @nestjs/core@10.2.10 @nestjs/common@10.2.10 @nestjs/event-emitter@2.1.1 @nestjs/platform-express@10.2.10 @nestjs/platform-socket.io@10.2.10 @nestjs/websockets@10.2.10 @nestjs/schedule@3.0.4 socket.io@4.7.2 nestjs-real-ip@3.0.1 reflect-metadata@0.1.14

# Create a modified package to prevent module resolution issues
echo "Creating package.json for nestjs-real-ip..."
mkdir -p node_modules/nestjs-real-ip/node_modules/@nestjs

# Set up symlinks for nested dependencies
echo "Setting up necessary symlinks..."
if [ -d "node_modules/@nestjs/common" ]; then
  ln -sf ../../../@nestjs/common node_modules/nestjs-real-ip/node_modules/@nestjs/common
fi

if [ -d "node_modules/@nestjs/core" ]; then
  ln -sf ../../../@nestjs/core node_modules/nestjs-real-ip/node_modules/@nestjs/core
fi

# Create a bootstrap script for node path
echo "#!/usr/bin/env node
// Apply fixes before starting the app
try {
  require('./fix-websockets');
} catch (error) {
  console.error('Error applying WebSocket fixes:', error);
}

process.env.NODE_PATH = './node_modules';
require('module').Module._initPaths();
require('./dist/main');
" > start-app.js
chmod +x start-app.js

# Create an empty .env file if it doesn't exist to prevent errors
if [ ! -f ".env" ]; then
  echo "Creating default .env file..."
  echo "SOL_RPC_URL=https://mainnet.helius-rpc.com/?api-key=77ab1854-d2c4-4c8b-a682-dc32234ad17f" > .env
  echo "ETH_RPC_URL=https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4" >> .env
  echo "BNB_RPC_URL=https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey" >> .env
  echo "MATIC_RPC_URL=https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4" >> .env
  echo "NODE_ENV=development" >> .env
fi

# Clean up
rm -f temp-package.json

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete. Now try running: npm run build && node patches/fix-schedule-explorer.js && npm run start:local"
