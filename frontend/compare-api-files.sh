#!/bin/bash

# Script to compare flat API files with their modular counterparts
# This helps determine which version is more complete before removing duplicates

echo "Starting API file comparison..."

# Define the flat files and their modular counterparts
declare -A FILE_PAIRS=(
  ["src/services/api/auth-service.ts"]="src/services/api/modules/auth/auth-service.ts"
  ["src/services/api/diary-service.ts"]="src/services/api/modules/diary/diary-service.ts"
  ["src/services/api/nft-service.ts"]="src/services/api/modules/nft/nft-service.ts"
  ["src/services/api/realtime-service.ts"]="src/services/api/modules/realtime/realtime-service.ts"
  ["src/services/api/referral-service.ts"]="src/services/api/modules/user/referral-service.ts"
  ["src/services/api/token-service.ts"]="src/services/api/modules/nft/token-service.ts"
  ["src/services/api/user-service.ts"]="src/services/api/modules/user/user-service.ts"
  ["src/services/api/wallet-service.ts"]="src/services/api/modules/wallet/wallet-service.ts"
)

# Base directory
BASE_DIR="/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend"
# Create report directory
REPORT_DIR="${BASE_DIR}/api-comparison-report"
mkdir -p "$REPORT_DIR"

echo "Created report directory at ${REPORT_DIR}"

# Generate a comparison report
for flat_file in "${!FILE_PAIRS[@]}"; do
  modular_file="${FILE_PAIRS[$flat_file]}"
  flat_path="${BASE_DIR}/${flat_file}"
  modular_path="${BASE_DIR}/${modular_file}"
  report_file="${REPORT_DIR}/$(basename "$flat_file" .ts)-comparison.txt"
  
  echo "Comparing: $flat_file with $modular_file"
  
  # Check if both files exist
  if [ -f "$flat_path" ] && [ -f "$modular_path" ]; then
    echo "Both files exist. Analyzing..."
    
    # Get line counts
    flat_lines=$(wc -l < "$flat_path")
    modular_lines=$(wc -l < "$modular_path")
    
    # Compare files and generate report
    {
      echo "=== API File Comparison Report ==="
      echo "Flat file: $flat_file ($flat_lines lines)"
      echo "Modular file: $modular_file ($modular_lines lines)"
      echo ""
      
      # Determine which file is likely more complete based on line count
      if [ "$flat_lines" -gt "$modular_lines" ]; then
        echo "The flat structure file appears to be more complete (has more lines)."
      elif [ "$modular_lines" -gt "$flat_lines" ]; then
        echo "The modular structure file appears to be more complete (has more lines)."
      else
        echo "Both files have the same number of lines."
      fi
      
      # Check for differences
      echo ""
      echo "=== Differences Summary ==="
      diff -u "$flat_path" "$modular_path" | diffstat
      
      # Show the actual differences
      echo ""
      echo "=== Detailed Differences ==="
      diff -u "$flat_path" "$modular_path" | grep -v "^---" | grep -v "^+++"
      
      # Check for method differences
      echo ""
      echo "=== Method Comparison ==="
      echo "Methods in flat file but not in modular file:"
      grep -o "async [a-zA-Z0-9_]\+(" "$flat_path" | sort > /tmp/flat_methods.txt
      grep -o "async [a-zA-Z0-9_]\+(" "$modular_path" | sort > /tmp/modular_methods.txt
      comm -23 /tmp/flat_methods.txt /tmp/modular_methods.txt
      
      echo ""
      echo "Methods in modular file but not in flat file:"
      comm -13 /tmp/flat_methods.txt /tmp/modular_methods.txt
    } > "$report_file"
    
    echo "Comparison completed. Report saved to $report_file"
    
  elif [ -f "$flat_path" ]; then
    echo "Warning: Only the flat file exists. Modular counterpart missing: $modular_file"
    {
      echo "=== API File Comparison Report ==="
      echo "Flat file: $flat_file ($flat_lines lines)"
      echo "Modular file: $modular_file (MISSING)"
      echo ""
      echo "WARNING: The modular file is missing. You should not remove the flat file without creating its modular counterpart."
    } > "$report_file"
    
  elif [ -f "$modular_path" ]; then
    echo "Only the modular file exists. Flat file missing: $flat_file"
    {
      echo "=== API File Comparison Report ==="
      echo "Flat file: $flat_file (MISSING)"
      echo "Modular file: $modular_file ($modular_lines lines)"
      echo ""
      echo "The flat file is already missing, no cleanup needed."
    } > "$report_file"
    
  else
    echo "Error: Neither file exists. Skipping comparison."
  fi
  
  echo "-----------------------------------"
done

echo "Comparison complete! Reports are stored in ${REPORT_DIR} directory."
echo "Please review these reports before removing any files to ensure functionality is preserved."