#!/bin/bash

# Script to find TypeScript errors in frontend files
echo "Finding TypeScript errors in frontend files..."

# Directory to check (adjust if necessary)
FRONTEND_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"

# Navigate to frontend directory
cd "$FRONTEND_DIR" || { echo "Cannot access frontend directory"; exit 1; }

# Run TypeScript compiler in noEmit mode to check for errors
echo "Running TypeScript compiler check..."
npx tsc --noEmit > ts-errors.log

# Check if there were any errors
if [ -s ts-errors.log ]; then
  echo "Found TypeScript errors:"
  echo "======================="
  
  # Parse and display the error file locations in a cleaner format
  grep -n "error TS" ts-errors.log | sed 's/(.*//' | sort | uniq -c | sort -nr
  
  # Count the total errors
  ERROR_COUNT=$(grep -c "error TS" ts-errors.log)
  echo ""
  echo "Total TypeScript errors found: $ERROR_COUNT"
  
  # Show the most common error types
  echo ""
  echo "Most common error types:"
  echo "======================="
  grep "error TS" ts-errors.log | sed 's/.*error \(TS[0-9]*\).*/\1/' | sort | uniq -c | sort -nr | head -10
  
  # Check for service-related errors specifically
  echo ""
  echo "Service-related errors:"
  echo "====================="
  grep -i "services\|service" ts-errors.log
  
  # Errors from files in the services directory
  echo ""
  echo "Errors in service files:"
  echo "======================"
  grep "src/services/" ts-errors.log
  
  echo ""
  echo "Error log saved to: $FRONTEND_DIR/ts-errors.log"
  echo "Use 'cat ts-errors.log' to see all errors."
else
  echo "No TypeScript errors found! Your codebase is clean."
  rm ts-errors.log
fi

echo ""
echo "Done!"