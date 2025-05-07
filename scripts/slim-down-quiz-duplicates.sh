#!/bin/bash

# Script to slim down duplicate quiz service and repository files
# Created: May 5, 2025

BACKEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend"
GAME_DIR="$BACKEND_DIR/src/game"
BACKUP_DIR="$BACKEND_DIR/backups/quiz-files-slim-down-$(date +%Y%m%d-%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "Created backup directory at $BACKUP_DIR"

# Files to slim down
FILES_TO_SLIM=(
  "$GAME_DIR/services/quiz.service.ts"
  "$GAME_DIR/repositories/quiz.repository.ts"
  "$GAME_DIR/dto/quiz.dto.ts"
)

# Backup files before modification
for file in "${FILES_TO_SLIM[@]}"; do
  if [ -f "$file" ]; then
    # Create directory structure in backup
    backup_dest="$BACKUP_DIR/$(dirname "${file#$BACKEND_DIR/}")"
    mkdir -p "$backup_dest"
    # Copy file to backup
    cp "$file" "$backup_dest/"
    echo "Backed up: $file"
  else
    echo "Warning: File not found: $file"
  fi
done

# Function to extract and keep only compatibility layer
extract_compatibility_layer() {
  local file=$1
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "Error: File not found: $file"
    return 1
  fi
  
  # Find compatibility layer comment line
  local compat_line=$(grep -n "Compatibility Layer" "$file" | head -1 | cut -d: -f1)
  
  if [ -z "$compat_line" ]; then
    echo "Error: Compatibility layer not found in $file"
    return 1
  fi
  
  # Extract compatibility layer section
  local compat_section=$(sed -n "${compat_line},\$p" "$file")
  
  # Replace file with only compatibility layer
  echo "/**
 * Quiz Compatibility Layer
 * 
 * This file re-exports the modern quiz implementation to maintain compatibility
 * with code that still imports from the legacy location.
 */

$compat_section" > "$file"
  
  echo "Slimmed down: $file"
  return 0
}

# Process each file
echo ""
echo "Slimming down files to contain only compatibility layers..."

for file in "${FILES_TO_SLIM[@]}"; do
  if [ -f "$file" ]; then
    extract_compatibility_layer "$file"
  fi
done

echo ""
echo "Summary:"
echo "  - Backed up: ${#FILES_TO_SLIM[@]} files"
echo "  - Slimmed down: ${#FILES_TO_SLIM[@]} files"
echo "  - Backup location: $BACKUP_DIR"
echo ""
echo "Cleanup complete! The files now contain only compatibility layers that"
echo "redirect imports to the modern quiz file structure."