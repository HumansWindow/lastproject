#!/bin/bash

# Exit on error
set -e

echo "=== Building NestJS application ==="
npm run build

echo "=== Creating simplified package.json for dist ==="
node scripts/create-dist-package.js

echo "=== Installing dependencies in dist folder ==="
cd dist
npm install --omit=dev

echo "=== Starting application ==="
echo "You can now run: cd dist && node run.js"
