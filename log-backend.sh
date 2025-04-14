#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate filename with timestamp
LOG_FILE="logs/backend-logs-$(date +%Y%m%d-%H%M%S).txt"

echo "Starting backend with logging to $LOG_FILE"
echo "=======================================" >> "$LOG_FILE"
echo "Backend Log Started: $(date)" >> "$LOG_FILE"
echo "=======================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Change to backend directory
cd backend

# Run backend with NODE_OPTIONS for increased memory if needed
NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev >> "../$LOG_FILE" 2>&1