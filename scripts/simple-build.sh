#!/bin/bash

echo "Simple build script to compile TypeScript project..."

# Clean target directory
rm -rf dist
mkdir -p dist/src

# Copy source files for fallback to ts-node if needed
cp -r src dist/
cp package*.json dist/
cp .env dist/ 2>/dev/null || echo "No .env file to copy"

# Try to compile main.ts directly
echo "Compiling main.ts..."
npx tsc src/main.ts --skipLibCheck --outDir dist/src/ --esModuleInterop true

# Create a hybrid runner that will try to use compiled JS if available, or fall back to ts-node
cat > dist/run.js << 'EOF'
require('dotenv').config();
require('source-map-support').install();

try {
  // First try to run the compiled JavaScript
  console.log('Attempting to run compiled JavaScript...');
  require('./src/main.js');
} catch (error) {
  // If that fails, try running the TypeScript source directly with ts-node
  console.warn('Failed to load compiled JavaScript. Falling back to ts-node for TypeScript execution.');
  console.warn(error);
  
  try {
    require('ts-node').register({
      skipProject: true,
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true,
        skipLibCheck: true
      }
    });
    require('../src/main.ts');
  } catch (tsNodeError) {
    console.error('Failed to run with ts-node fallback:');
    console.error(tsNodeError);
    process.exit(1);
  }
}
EOF

chmod +x dist/run.js

echo "Build completed with fallback mechanism"
echo "Run with: node dist/run.js"
