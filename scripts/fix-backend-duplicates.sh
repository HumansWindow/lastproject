#!/bin/bash

# Master script to run both cleanup and import update scripts
# Author: GitHub Copilot
# Date: May 24, 2025

echo "=== Starting Backend Duplicate Files Cleanup Process ==="
echo

# 1. Run the duplicate cleanup script
echo "Step 1: Cleaning up duplicate files"
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts/cleanup-backend-duplicates.sh
echo

# 2. Run the import update script
echo "Step 2: Updating import references"
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts/update-backend-imports.sh
echo

echo "=== Backend Cleanup Process Completed ==="
echo "Next steps:"
echo "1. Review the changes and test your application"
echo "2. Run tests to ensure everything works correctly"
echo "3. Commit your changes to version control"
