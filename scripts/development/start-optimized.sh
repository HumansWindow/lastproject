#!/bin/bash

# Set NODE_OPTIONS for memory optimization (without --expose-gc which isn't allowed in NODE_OPTIONS)
export NODE_OPTIONS="--max-old-space-size=4096"

# Check if port 3001 is available, if not, use the fallback port
PORT=3001
FALLBACK_PORT=3002

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "Port $PORT is already in use, using fallback port $FALLBACK_PORT"
    export PORT=$FALLBACK_PORT
else
    export PORT=$PORT
fi

# Start the application with development mode
# Use node directly with --expose-gc flag instead of through NODE_OPTIONS
echo "Starting server on port $PORT with optimized memory settings..."
node --expose-gc ./node_modules/.bin/nest start --watch
