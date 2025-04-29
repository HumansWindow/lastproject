#!/bin/bash

# Script to start backend with garbage collection enabled
# This will help with high memory usage warnings from MemoryMonitorService

# Check if logs directory exists, if not create it
LOGS_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/logs"
if [ ! -d "$LOGS_DIR" ]; then
    echo "Creating logs directory..."
    mkdir -p "$LOGS_DIR"
fi

# Create log filename with timestamp
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
LOG_FILE="$LOGS_DIR/backend_gc_$TIMESTAMP.txt"

# Check if port 3001 is available, if not, kill the process or use alternative port
PORT=3001
FALLBACK_PORT=3002

echo "Starting backend with garbage collection enabled..."
echo "Logs will be saved to: $LOG_FILE"

# Command to run with proper GC options
# Using node directly instead of through NODE_OPTIONS
RUN_CMD="node --expose-gc --max-old-space-size=4096 node_modules/.bin/nest start --watch"

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Port $PORT is already in use!"
    echo "Do you want to:"
    echo "1) Kill the process and use port $PORT"
    echo "2) Use alternative port $FALLBACK_PORT"
    echo "3) Quit"
    read -p "Select option (1-3): " OPTION
    
    case $OPTION in
        1)
            echo "Killing process on port $PORT..."
            lsof -ti :$PORT | xargs kill -9
            echo "Starting backend on port $PORT with garbage collection enabled..."
            cd backend && $RUN_CMD 2>&1 | tee -a "$LOG_FILE"
            ;;
        2)
            echo "Starting backend on port $FALLBACK_PORT with garbage collection enabled..."
            cd backend && PORT=$FALLBACK_PORT $RUN_CMD 2>&1 | tee -a "$LOG_FILE"
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting..."
            exit 1
            ;;
    esac
else
    echo "Port $PORT is available. Starting backend with garbage collection enabled..."
    cd backend && $RUN_CMD 2>&1 | tee -a "$LOG_FILE"
fi