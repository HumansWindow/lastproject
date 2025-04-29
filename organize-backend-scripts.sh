#!/bin/bash

# Script to organize JavaScript and shell files in the backend directory
# Created: April 28, 2025

# Base directories
BACKEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend"
SCRIPTS_DIR="${BACKEND_DIR}/scripts"
PROJECT_SCRIPTS_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts"

# Make sure scripts directories exist
mkdir -p "${SCRIPTS_DIR}"
mkdir -p "${PROJECT_SCRIPTS_DIR}"

# Files to keep in the root directory (don't move these)
KEEP_FILES=(
  ".eslintrc.js"
  "jest.config.js"
  "webpack.config.js"
  "start-app.js"
  "package.json"
  "nest-cli.json"
  "tsconfig.json"
  "tsconfig.build.json"
  "tsconfig.test.json"
  "typeorm.config.ts"
)

# Move JS utility files to the backend scripts directory
echo "Moving JavaScript utility files to backend scripts directory..."
for file in "${BACKEND_DIR}/"*.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    # Check if it's in the keep files list
    if [[ ! " ${KEEP_FILES[@]} " =~ " ${filename} " ]]; then
      echo "  Moving $filename to backend scripts directory"
      mv "$file" "${SCRIPTS_DIR}/"
    else
      echo "  Keeping $filename in root directory"
    fi
  fi
done

# Move shell scripts to project scripts directory
echo "Moving shell scripts to project scripts directory..."
for file in "${BACKEND_DIR}/"*.sh; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "  Moving $filename to project scripts directory"
    mv "$file" "${PROJECT_SCRIPTS_DIR}/"
  fi
done

# Update script references in package.json (optional, may need to be done manually)
echo "Done organizing files!"
echo "Note: You may need to update script references in package.json manually if moved scripts are referenced there."
echo "Files in '${BACKEND_DIR}/src/blockchain' were not touched as requested."