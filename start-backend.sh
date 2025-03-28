#!/bin/bash

# Check if port 3001 is available, if not, kill the process or use alternative port
PORT=3001
FALLBACK_PORT=3002

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
            echo "Starting backend on port $PORT..."
            cd backend && npm run start:dev
            ;;
        2)
            echo "Starting backend on port $FALLBACK_PORT..."
            PORT=$FALLBACK_PORT cd backend && npm run start:dev
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
    echo "Port $PORT is available. Starting backend..."
    cd backend && npm run start:dev
fi
