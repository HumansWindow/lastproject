#!/bin/bash

# Kill any existing processes on ports 3001-3005
echo "Checking for existing processes on ports 3001-3005..."
for port in {3001..3005}; do
  pid=$(lsof -ti :$port)
  if [ ! -z "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 $pid
  fi
done

# Set NODE_OPTIONS for improved memory management
export NODE_OPTIONS="--max-old-space-size=2048 --max-semi-space-size=64 --optimize-for-size --gc-interval=100"

# Find an available port starting from 3001
PORT=3001
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    echo "Port $PORT is already in use, trying next port..."
    PORT=$((PORT+1))
    if [ $PORT -gt 3010 ]; then
        echo "No available ports found in range 3001-3010."
        exit 1
    fi
done

export PORT=$PORT
echo "Starting server on port $PORT with optimized memory settings..."

# Start the application with garbage collection exposed
node --expose-gc ./node_modules/.bin/nest start --watch
