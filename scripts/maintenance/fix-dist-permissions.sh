#!/bin/bash

echo "====================================="
echo "    Fixing dist folder permissions"
echo "====================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DIST_DIR="$SCRIPT_DIR/backend/dist"

if [ ! -d "$DIST_DIR" ]; then
  echo "✗ The dist directory does not exist at: $DIST_DIR"
  exit 1
fi

echo "Fixing permissions for: $DIST_DIR"
echo "This might take a moment..."

# First, attempt to fix permissions without sudo
echo "Attempting to fix permissions without sudo..."
find "$DIST_DIR" -type d -exec chmod 755 {} \; 2>/dev/null
find "$DIST_DIR" -type f -exec chmod 644 {} \; 2>/dev/null

# Check if there were errors (if some files couldn't be updated)
if [ $? -ne 0 ]; then
  echo "Some permissions could not be updated without sudo. Trying with sudo..."
  
  # Check if sudo is available
  if command -v sudo &> /dev/null; then
    echo "Using sudo to update permissions..."
    sudo find "$DIST_DIR" -type d -exec chmod 755 {} \;
    sudo find "$DIST_DIR" -type f -exec chmod 644 {} \;
    
    # Change ownership to current user
    USER=$(whoami)
    sudo chown -R "$USER:$USER" "$DIST_DIR"
  else
    echo "✗ Sudo is not available. Please run this script with administrative privileges."
    exit 1
  fi
fi

# Make sure executable files remain executable
find "$DIST_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null
find "$DIST_DIR" -name "*.js" -path "*/bin/*" -exec chmod +x {} \; 2>/dev/null

echo "✓ Permissions fixed successfully"
echo ""
echo "Now you can run the following commands:"
echo "1. ./run-id-standardization.sh - To standardize user IDs"
echo "2. ./run-backend-commands.sh test:id-consistency - To check ID consistency"
echo ""