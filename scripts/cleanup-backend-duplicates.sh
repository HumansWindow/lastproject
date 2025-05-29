#!/bin/bash

# Script to clean up duplicate files in the backend codebase
# Author: GitHub Copilot
# Date: May 24, 2025

# Set the base directory for the backend
BACKEND_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend"

# Create a backup directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backup/backend_duplicates_$TIMESTAMP"

echo "Creating backup directory at $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Function to backup a file before deleting it
backup_file() {
    local file="$1"
    local relative_path=${file#$BACKEND_DIR/}
    local backup_path="$BACKUP_DIR/$relative_path"
    local backup_dir=$(dirname "$backup_path")
    
    # Create directory structure in backup
    mkdir -p "$backup_dir"
    
    # Copy the file to backup
    cp -f "$file" "$backup_path"
    echo "Backed up: $file"
}

echo "=== Starting Backend Duplicate Files Cleanup ==="
echo

# 1. Clean up all .bak files
echo "=== Cleaning up .bak files ==="
find "$BACKEND_DIR" -name "*.bak" -type f | while read -r file; do
    echo "Found .bak file: $file"
    backup_file "$file"
    echo "Removing: $file"
    rm "$file"
done
echo "Done cleaning .bak files"
echo

# 2. Fix Base Controller Duplicates
echo "=== Fixing Base Controller Duplicates ==="
BASE_CONTROLLER="$BACKEND_DIR/src/app/base.controller.ts"
if [ -f "$BASE_CONTROLLER" ]; then
    echo "Found duplicate base controller: $BASE_CONTROLLER"
    backup_file "$BASE_CONTROLLER"
    echo "Removing: $BASE_CONTROLLER"
    rm "$BASE_CONTROLLER"
    echo "Keep using: $BACKEND_DIR/src/app/controllers/base.controller.ts"
else
    echo "No duplicate base controller found"
fi
echo

# 3. Fix App Module Duplicates
echo "=== Fixing App Module Duplicates ==="
APP_MODULE_DUP="$BACKEND_DIR/src/app/app.module.ts"
if [ -f "$APP_MODULE_DUP" ]; then
    echo "Found duplicate app module: $APP_MODULE_DUP"
    backup_file "$APP_MODULE_DUP"
    echo "Removing: $APP_MODULE_DUP"
    rm "$APP_MODULE_DUP"
    echo "Keep using: $BACKEND_DIR/src/app.module.ts"
else
    echo "No duplicate app module found"
fi
echo

# 4. Fix TypeORM Config Duplicates
echo "=== Fixing TypeORM Config Duplicates ==="
TYPEORM_CONFIG_DUP="$BACKEND_DIR/typeorm.config.ts"
if [ -f "$TYPEORM_CONFIG_DUP" ]; then
    echo "Found duplicate typeorm config: $TYPEORM_CONFIG_DUP"
    backup_file "$TYPEORM_CONFIG_DUP"
    echo "Removing: $TYPEORM_CONFIG_DUP"
    rm "$TYPEORM_CONFIG_DUP"
    echo "Keep using: $BACKEND_DIR/src/typeorm.config.ts"
else
    echo "No duplicate typeorm config found"
fi
echo

# 5. Fix Request-with-user Interface Duplicates
echo "=== Fixing Request-with-user Interface Duplicates ==="
REQUEST_USER_DUP="$BACKEND_DIR/src/auth/interfaces/request-with-user.interface.ts"
if [ -f "$REQUEST_USER_DUP" ]; then
    echo "Found duplicate request-with-user interface: $REQUEST_USER_DUP"
    backup_file "$REQUEST_USER_DUP"
    echo "Removing: $REQUEST_USER_DUP"
    rm "$REQUEST_USER_DUP"
    echo "Keep using: $BACKEND_DIR/src/shared/interfaces/request-with-user.interface.ts"
else
    echo "No duplicate request-with-user interface found"
fi
echo

# 6. Fix ShahiToken ABI Duplicates
echo "=== Fixing ShahiToken ABI Duplicates ==="
SHAHITOKEN_JSON="$BACKEND_DIR/src/blockchain/abis/shahiToken.json"
SHAHITOKEN_CONTRACT="$BACKEND_DIR/src/blockchain/contracts/shahi-token.abi.json"

if [ -f "$SHAHITOKEN_JSON" ]; then
    echo "Found duplicate ShahiToken ABI: $SHAHITOKEN_JSON"
    backup_file "$SHAHITOKEN_JSON"
    echo "Removing: $SHAHITOKEN_JSON"
    rm "$SHAHITOKEN_JSON"
fi

if [ -f "$SHAHITOKEN_CONTRACT" ]; then
    echo "Found duplicate ShahiToken ABI: $SHAHITOKEN_CONTRACT"
    backup_file "$SHAHITOKEN_CONTRACT"
    echo "Removing: $SHAHITOKEN_CONTRACT"
    rm "$SHAHITOKEN_CONTRACT"
fi
echo "Keep using: $BACKEND_DIR/src/blockchain/abis/shahi-token.abi.json"
echo

# 7. Fix Database Initialization Scripts
echo "=== Fixing Database Initialization Scripts ==="
INIT_DB="$BACKEND_DIR/scripts/init-db.js"
INITIALIZE_DATABASE="$BACKEND_DIR/scripts/initialize-database.js"

if [ -f "$INIT_DB" ]; then
    echo "Found duplicate database init script: $INIT_DB"
    backup_file "$INIT_DB"
    echo "Removing: $INIT_DB"
    rm "$INIT_DB"
fi

if [ -f "$INITIALIZE_DATABASE" ]; then
    echo "Found duplicate database init script: $INITIALIZE_DATABASE"
    backup_file "$INITIALIZE_DATABASE"
    echo "Removing: $INITIALIZE_DATABASE"
    rm "$INITIALIZE_DATABASE"
fi
echo "Keep using: $BACKEND_DIR/scripts/database-init.js"
echo

# 8. Fix Main.ts Files
echo "=== Fixing Main.ts Files ==="
MAIN_NEW="$BACKEND_DIR/src/main.ts.new"
if [ -f "$MAIN_NEW" ]; then
    echo "Found duplicate main.ts: $MAIN_NEW"
    backup_file "$MAIN_NEW"
    echo "Removing: $MAIN_NEW"
    rm "$MAIN_NEW"
    echo "Keep using: $BACKEND_DIR/src/main.ts"
else
    echo "No duplicate main.ts.new found"
fi
echo

# 9. Fix Blockchain Provider Mock Duplicates
echo "=== Fixing Blockchain Provider Mock Duplicates ==="
MOCK_PROVIDERS_JS="$BACKEND_DIR/src/__tests__/blockchain/mock-providers.js"
MOCK_PROVIDERS_LEGACY="$BACKEND_DIR/src/__tests__/blockchain/mock-providers.legacy.js"

if [ -f "$MOCK_PROVIDERS_JS" ]; then
    echo "Found duplicate mock providers: $MOCK_PROVIDERS_JS"
    backup_file "$MOCK_PROVIDERS_JS"
    echo "Removing: $MOCK_PROVIDERS_JS"
    rm "$MOCK_PROVIDERS_JS"
fi

if [ -f "$MOCK_PROVIDERS_LEGACY" ]; then
    echo "Found duplicate mock providers: $MOCK_PROVIDERS_LEGACY"
    backup_file "$MOCK_PROVIDERS_LEGACY"
    echo "Removing: $MOCK_PROVIDERS_LEGACY"
    rm "$MOCK_PROVIDERS_LEGACY"
fi
echo "Keep using: $BACKEND_DIR/src/__tests__/blockchain/mock-providers.ts"
echo

echo "=== Backend Duplicate Files Cleanup Completed ==="
echo "All removed files were backed up to: $BACKUP_DIR"
echo "Review the changes and fix any import references as needed."
