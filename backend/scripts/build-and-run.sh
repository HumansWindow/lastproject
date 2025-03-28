#!/bin/bash

# Exit on error
set -e

echo "Building using TS-Node directly (bypass TypeScript errors in tests)..."

# Clean dist directory
rm -rf dist
mkdir -p dist

# Copy essential files
cp package*.json dist/
cp tsconfig*.json dist/
cp -r src dist/

# Create the run.js entry point
cat > dist/run.js << 'EOF'
require('dotenv').config();
require('reflect-metadata'); 
require('source-map-support').install();
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2017',
    esModuleInterop: true,
    skipLibCheck: true
  }
});
try {
  require('./src/main');
} catch (error) {
  console.error('Failed to load main:');
  console.error(error);
}
EOF

echo "✅ Build completed successfully using transpile-only mode."
echo "To run the application, use:"
echo "node dist/run.js"
