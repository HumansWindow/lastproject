#!/bin/bash

# Game System Migration Script
# This script copies the entire game system from the current project to a new project
# Usage: ./migrate-game-system.sh /path/to/new/project

# Check if source directory exists
if [ ! -d "/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/game" ]; then
    echo "Error: Source game directory not found"
    exit 1
fi

# Check if destination path is provided
if [ -z "$1" ]; then
    echo "Usage: ./migrate-game-system.sh /path/to/new/project"
    exit 1
fi

NEW_PROJECT_PATH="$1"
SOURCE_PATH="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"
BACKEND_GAME_PATH="$SOURCE_PATH/backend/src/game"
FRONTEND_GAME_COMPONENTS="$SOURCE_PATH/frontend/src/components/game"
FRONTEND_GAME_ANIMATIONS="$SOURCE_PATH/frontend/src/animations/galaxy"
FRONTEND_GAME_STYLES="$SOURCE_PATH/frontend/src/styles/game"

# Create destination directories
mkdir -p "$NEW_PROJECT_PATH/backend/src/game"
mkdir -p "$NEW_PROJECT_PATH/frontend/src/components/game"
mkdir -p "$NEW_PROJECT_PATH/frontend/src/animations/galaxy"
mkdir -p "$NEW_PROJECT_PATH/frontend/src/styles/game"
mkdir -p "$NEW_PROJECT_PATH/docs/game"

echo "=== Starting Game System Migration ==="

# Copy backend files
echo "Copying backend game files..."
cp -r "$BACKEND_GAME_PATH"/* "$NEW_PROJECT_PATH/backend/src/game/"

# Copy frontend files
echo "Copying frontend game components..."
cp -r "$FRONTEND_GAME_COMPONENTS"/* "$NEW_PROJECT_PATH/frontend/src/components/game/"

echo "Copying galaxy animations..."
cp -r "$FRONTEND_GAME_ANIMATIONS"/* "$NEW_PROJECT_PATH/frontend/src/animations/galaxy/"

echo "Copying game styles..."
cp -r "$FRONTEND_GAME_STYLES"/* "$NEW_PROJECT_PATH/frontend/src/styles/game/"

# Copy documentation
echo "Copying game documentation..."
cp -r "$SOURCE_PATH/docs/frontend/Game"/* "$NEW_PROJECT_PATH/docs/game/"

# Copy migration documentation
echo "Copying migration documentation..."
cp -r "$SOURCE_PATH/docs/prompts/detail/Game"/* "$NEW_PROJECT_PATH/docs/game/"

echo "=== Game System Migration Complete ==="
echo "The game system has been copied to: $NEW_PROJECT_PATH"
echo "See $NEW_PROJECT_PATH/docs/game/ for integration instructions."