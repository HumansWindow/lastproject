#!/bin/bash

# Exit on error
set -e

echo "=== Starting NestJS application in development mode ==="

# Check if ts-node is installed
if ! command -v npx ts-node &> /dev/null; then
  echo "ts-node is not installed. Installing it now..."
  npm install -g ts-node
fi

# Make sure reflect-metadata is installed
if ! grep -q "reflect-metadata" package.json; then
  echo "Installing reflect-metadata..."
  npm install reflect-metadata
fi

# Make sure .env exists
if [ ! -f ".env" ]; then
  echo "Warning: .env file not found. Creating a basic one..."
  cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-change-this-in-production
DATABASE_URL=postgres://postgres:postgres@localhost:5432/alivehuman
EOF
  echo "Created basic .env file. Please update with your real configuration."
fi

# Start the application using ts-node
echo "Starting application with ts-node..."
npx ts-node --transpile-only src/main.ts
