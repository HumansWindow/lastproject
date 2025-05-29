#!/bin/bash

# Script to generate file structure of specified directories in three different formats
# Excludes node_modules, dist, and other build directories
# Author: GitHub Copilot
# Date: May 25, 2025

# Define log directory
LOG_BASE_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/logs"
mkdir -p "$LOG_BASE_DIR"

# Timestamp for unique filenames and directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$LOG_BASE_DIR/structure_$TIMESTAMP"
mkdir -p "$LOG_DIR"

# Clean up old structure logs (keeping the last 5)
cleanup_old_structure_logs() {
  echo "Cleaning up old structure logs..."
  # List directories sorted by modification time, keep the newest 5, remove the rest
  find "$LOG_BASE_DIR" -type d -name "structure_*" | sort -r | tail -n +6 | xargs -r rm -rf
  echo "Cleanup complete."
}

# Project root directory
ROOT_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"

# Directories to process (including root project directory)
DIRS=(
  "$ROOT_DIR"
  "$ROOT_DIR/frontend"
  "$ROOT_DIR/backend"
  "$ROOT_DIR/admin"
)

# Create a root structure overview
create_root_overview() {
  local output_file="$LOG_DIR/root_overview.txt"
  echo "Generating root project overview..."
  echo "ROOT PROJECT STRUCTURE OVERVIEW" > "$output_file"
  echo "Generated on: $(date)" >> "$output_file"
  echo "----------------------------------------" >> "$output_file"
  echo "TOP-LEVEL DIRECTORIES:" >> "$output_file"
  find "$ROOT_DIR" -maxdepth 1 -type d -not -path "$ROOT_DIR" | sort | sed 's|'"$ROOT_DIR"'/||' >> "$output_file"
  echo "" >> "$output_file"
  echo "TOP-LEVEL FILES:" >> "$output_file"
  find "$ROOT_DIR" -maxdepth 1 -type f | sort | sed 's|'"$ROOT_DIR"'/||' >> "$output_file"
  
  echo "ROOT OVERVIEW - FORMAT #2: BASIC TREE" >> "$output_file"
  echo "----------------------------------------" >> "$output_file"
  if command -v tree &> /dev/null; then
    tree -L 2 -I "node_modules|dist|.git|build|.next|coverage|.cache" "$ROOT_DIR" >> "$output_file"
  else
    echo "Tree command not found. Using find command for overview." >> "$output_file"
    find "$ROOT_DIR" -maxdepth 2 -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" | sort | sed "s|$ROOT_DIR/||g" >> "$output_file"
  fi
  
  echo "" >> "$output_file"
  echo "ROOT OVERVIEW - FORMAT #3: DIRECTORY COUNTS" >> "$output_file"
  echo "----------------------------------------" >> "$output_file"
  echo "Directories by file count:" >> "$output_file"
  for dir in $(find "$ROOT_DIR" -maxdepth 1 -type d -not -path "$ROOT_DIR" -not -path "*/node_modules*" -not -path "*/.git*"); do
    count=$(find "$dir" -type f "${EXCLUSIONS[@]}" | wc -l)
    echo "$(basename "$dir"): $count files" >> "$output_file"
  done
  
  echo "Root overview saved to $output_file"
}

# Exclusion patterns for find command
EXCLUSIONS=(
  -not -path "*/node_modules/*"
  -not -path "*/dist/*"
  -not -path "*/.git/*"
  -not -path "*/build/*"
  -not -path "*/.next/*"
  -not -path "*/coverage/*"
  -not -path "*/.cache/*"
)

# Generate file structure for each directory in three different formats
for dir in "${DIRS[@]}"; do
  dir_name=$(basename "$dir")
  
  # Format 1: Simple flat list of files
  output_file_flat="$LOG_DIR/${dir_name}_file_list.txt"
  echo "Generating flat file list for $dir_name..."
  echo "Directory: $dir" > "$output_file_flat"
  echo "Generated on: $(date)" >> "$output_file_flat"
  echo "FORMAT: Flat file list" >> "$output_file_flat"
  echo "----------------------------------------" >> "$output_file_flat"
  find "$dir" -type f "${EXCLUSIONS[@]}" | sort >> "$output_file_flat"
  echo "Flat file list saved to $output_file_flat"
  
  # Format 2: Hierarchical tree structure using tree command (install if needed)
  output_file_tree="$LOG_DIR/${dir_name}_tree.txt"
  echo "Generating tree structure for $dir_name..."
  echo "Directory: $dir" > "$output_file_tree"
  echo "Generated on: $(date)" >> "$output_file_tree"
  echo "FORMAT: Tree structure" >> "$output_file_tree"
  echo "----------------------------------------" >> "$output_file_tree"
  
  # Check if tree is installed, if not, suggest installation
  if command -v tree &> /dev/null; then
    tree -I "node_modules|dist|.git|build|.next|coverage|.cache" "$dir" >> "$output_file_tree"
  else
    echo "Tree command not found. Install it using: sudo apt-get install tree" >> "$output_file_tree"
    # Fallback to find with directory structure indication
    find "$dir" -type d -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.git/*" | sort >> "$output_file_tree"
    echo "" >> "$output_file_tree"
    echo "Files: " >> "$output_file_tree"
    find "$dir" -type f "${EXCLUSIONS[@]}" | sort >> "$output_file_tree"
  fi
  echo "Tree structure saved to $output_file_tree"
  
  # Format 3: File structure with details (size, permissions, etc.)
  output_file_details="$LOG_DIR/${dir_name}_details.txt"
  echo "Generating detailed file structure for $dir_name..."
  echo "Directory: $dir" > "$output_file_details"
  echo "Generated on: $(date)" >> "$output_file_details"
  echo "FORMAT: Detailed file structure (including size, permissions)" >> "$output_file_details"
  echo "----------------------------------------" >> "$output_file_details"
  
  # For each file found, get its details using ls
  echo "Starting detailed file listing..." >> "$output_file_details"
  find "$dir" -type f "${EXCLUSIONS[@]}" -print0 | xargs -0 ls -la >> "$output_file_details" 2>/dev/null
  
  # Add a summary section
  echo "" >> "$output_file_details"
  echo "SUMMARY:" >> "$output_file_details"
  echo "Total files: $(find "$dir" -type f "${EXCLUSIONS[@]}" | wc -l)" >> "$output_file_details"
  echo "Total directories: $(find "$dir" -type d "${EXCLUSIONS[@]}" | wc -l)" >> "$output_file_details"
  echo "Detailed structure saved to $output_file_details"
done

# Run cleanup before generating new logs
cleanup_old_structure_logs

# Generate the root overview
create_root_overview

# Create a readme file with information about the generated structure
cat > "$LOG_DIR/README.md" << EOF
# Project Structure Documentation

Generated on: $(date)

## Contents

This directory contains file structure information for the LastProject in three different formats:
1. **Flat lists** (*_file_list.txt): Simple flat list of all files in the directory
2. **Tree views** (*_tree.txt): Hierarchical tree structure of directories and files
3. **Detailed views** (*_details.txt): Detailed information including file sizes and permissions

## Root Project Structure

A summary of the main directories in the project:
- backend/: NestJS backend API
- frontend/: React frontend application
- admin/: Admin dashboard interface
- scripts/: Utility scripts for deployment and maintenance
- logs/: Log files and project documentation
EOF

echo "All file structures have been generated in three formats and saved to $LOG_DIR"
echo "Generated files:"
ls -l "$LOG_DIR" | grep -v "README.md"

# Create a symlink to the latest structure directory
rm -f "$LOG_BASE_DIR/latest_structure" 2>/dev/null
ln -sf "$LOG_DIR" "$LOG_BASE_DIR/latest_structure"
echo "Created symlink: $LOG_BASE_DIR/latest_structure -> $LOG_DIR"
