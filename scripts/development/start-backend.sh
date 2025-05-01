#!/bin/bash

# Define constants
PORT=3001
LOG_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/logs"
TIMESTAMP=$(date "+%Y-%m-%d_%H-%M-%S")
LOG_FILE="${LOG_DIR}/backend_${TIMESTAMP}.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Check if port 3001 is in use and kill the process automatically
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Port $PORT is already in use!"
    echo "Killing process on port $PORT..."
    lsof -ti :$PORT | xargs kill -9
fi

# Navigate to backend directory and start the application
echo "Starting backend on port $PORT..."
echo "Log file will be saved at: $LOG_FILE"

# Method 1: First attempt with Node directly (if dist/main.js exists)
if [ -f "../../backend/dist/main.js" ]; then
    echo "Starting with Node directly with garbage collection enabled..."
    cd ../.. && cd backend && node --expose-gc --max-old-space-size=512 dist/main.js 2>&1 | tee "$LOG_FILE"
else
    # Method 2: Fallback to npm script with increased memory limit only
    echo "Starting with npm run start:dev with increased memory limit..."
    cd ../.. && cd backend && NODE_OPTIONS="--max-old-space-size=512" npm run start:dev 2>&1 | tee "$LOG_FILE"
fi
