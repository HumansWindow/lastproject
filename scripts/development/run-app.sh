#!/bin/bash

# This script simplifies running the application

# Exit on error
set -e

echo "=== Preparing to run the application ==="

# Check if we should run in development mode
if [ "$1" == "dev" ]; then
  echo "Running in development mode"
  npx ts-node --transpile-only src/main.ts
  exit 0
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "Building the application first..."
  npm run build
fi

# Check if node_modules exists in dist
if [ ! -d "dist/node_modules" ]; then
  echo "Installing dependencies in dist folder..."
  (cd dist && npm install --omit=dev)
fi

# Check if run.js exists
if [ ! -f "dist/run.js" ]; then
  echo "Creating run.js file..."
  cat > dist/run.js << 'EOF'
require('dotenv').config();
require('reflect-metadata');
require('source-map-support').install();
try {
  require('./main.js'); // Use the correct main.js path
} catch (error) {
  console.error('Failed to load main.js:');
  console.error(error);
  
  // Try to provide more helpful error information
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('This might be because:');
    console.error('1. The main.js file was not generated correctly during build');
    console.error('2. Dependencies are missing - check if node_modules exists in this directory');
    console.error('3. Try running: npm install --omit=dev');
  }
}
EOF
fi

# Copy .env file if it doesn't exist in dist
if [ ! -f "dist/.env" ] && [ -f ".env" ]; then
  echo "Copying .env file to dist directory..."
  cp .env dist/
fi

# Create a package.json in dist without postinstall
if [ -f "dist/package.json" ]; then
  echo "Fixing package.json in dist..."
  # Remove postinstall script using a temporary file
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('dist/package.json', 'utf8'));
    if (pkg.scripts && pkg.scripts.postinstall) {
      delete pkg.scripts.postinstall;
    }
    pkg.scripts = { ...pkg.scripts, start: 'node run.js' };
    fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, 2));
  "
  echo "Package.json fixed."
fi

echo "=== Starting application ==="
echo "Running: cd dist && node run.js"

# Install dependencies in dist directory if they're missing
if [ ! -d "dist/node_modules" ]; then
  echo "Installing dependencies in dist directory..."
  (cd dist && npm install --omit=dev || echo "Ignoring possible postinstall errors")
fi

# Run the application
(cd dist && node run.js)
