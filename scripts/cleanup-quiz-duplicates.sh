#!/bin/bash

# Script to remove duplicate quiz files after verifying they're no longer needed
# Created: May 5, 2025

BACKEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend"
GAME_DIR="$BACKEND_DIR/src/game"
BACKUP_DIR="$BACKEND_DIR/backups/quiz-files-backup-$(date +%Y%m%d-%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo "Created backup directory at $BACKUP_DIR"

# File lists
LEGACY_FILES=(
  # Legacy quiz entities
  "$GAME_DIR/entities/quiz-question.entity.ts"
  "$GAME_DIR/entities/quiz-response.entity.ts"
  "$GAME_DIR/entities/user-quiz-response.entity.ts"
  
  # Legacy quiz repository - already has compatibility layer
  # "$GAME_DIR/repositories/quiz.repository.ts"
  
  # Legacy quiz service - already has compatibility layer
  # "$GAME_DIR/services/quiz.service.ts"
  
  # Legacy quiz DTOs - already has compatibility layer
  # "$GAME_DIR/dto/quiz.dto.ts"
)

# Backup and verify all files exist before removal
MISSING_FILES=0
for file in "${LEGACY_FILES[@]}"; do
  if [ -f "$file" ]; then
    # Create directory structure in backup
    backup_dest="$BACKUP_DIR/$(dirname "${file#$BACKEND_DIR/}")"
    mkdir -p "$backup_dest"
    # Copy file to backup
    cp "$file" "$backup_dest/"
    echo "Backed up: $file"
  else
    echo "Warning: File not found: $file"
    MISSING_FILES=$((MISSING_FILES + 1))
  fi
done

if [ $MISSING_FILES -gt 0 ]; then
  echo "Warning: $MISSING_FILES files were not found. Some cleanup may have already been performed."
fi

# Ask for confirmation before removing files
echo ""
echo "The following files will be removed:"
for file in "${LEGACY_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  - $file"
  fi
done

read -p "Are you sure you want to remove these files? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Operation cancelled. No files were removed."
  exit 0
fi

# Remove files
REMOVED=0
for file in "${LEGACY_FILES[@]}"; do
  if [ -f "$file" ]; then
    rm "$file"
    echo "Removed: $file"
    REMOVED=$((REMOVED + 1))
  fi
done

echo ""
echo "Summary:"
echo "  - Backed up: $((${#LEGACY_FILES[@]} - MISSING_FILES)) files"
echo "  - Removed: $REMOVED files"
echo "  - Backup location: $BACKUP_DIR"
echo ""
echo "Note: The compatibility layers in the following files have been kept:"
echo "  - $GAME_DIR/entities/quiz-compat.ts"
echo "  - $GAME_DIR/repositories/quiz.repository.ts"
echo "  - $GAME_DIR/services/quiz.service.ts"
echo "  - $GAME_DIR/dto/quiz.dto.ts"
echo ""
echo "These compatibility layers ensure that any code still importing from legacy paths"
echo "will continue to work correctly while using the modern quiz file structure."