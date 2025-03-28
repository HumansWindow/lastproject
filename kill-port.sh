#!/bin/bash

# Check if port is provided
if [ -z "$1" ]; then
  echo "Please provide a port number"
  echo "Usage: ./kill-port.sh 3001"
  exit 1
fi

PORT=$1
PID=$(lsof -t -i:$PORT)

if [ -z "$PID" ]; then
  echo "No process is using port $PORT"
  exit 0
fi

echo "Found process $PID using port $PORT"
echo "Killing process..."
kill -9 $PID
echo "Process killed"
