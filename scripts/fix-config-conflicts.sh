#!/bin/bash
# Script to fix configuration file conflicts
# Created on: May 25, 2025

set -e  # Exit on error

# Base directory
BASE_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"
BACKUP_DIR="${BASE_DIR}/backup/configs_backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Configuration Files Conflict Resolution Script ===${NC}"
echo -e "${YELLOW}Creating backup directory: ${BACKUP_DIR}${NC}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Function to backup a file
backup_file() {
    local file_path="$1"
    local relative_path="${file_path#$BASE_DIR/}"
    local backup_path="${BACKUP_DIR}/${relative_path}"
    
    # Create directory structure in backup folder
    mkdir -p "$(dirname "$backup_path")"
    
    # Copy file to backup
    if [ -f "$file_path" ]; then
        cp "$file_path" "$backup_path"
        echo -e "${GREEN}✓ Backed up:${NC} $relative_path"
    else
        echo -e "${RED}✗ File not found:${NC} $file_path"
        return 1
    fi
}

# Function to create symlink
create_symlink() {
    local target="$1"
    local link_name="$2"
    local relative_path="${link_name#$BASE_DIR/}"
    
    # Create directory structure for symlink
    mkdir -p "$(dirname "$link_name")"
    
    # Remove existing file/symlink if exists
    if [ -e "$link_name" ] || [ -L "$link_name" ]; then
        rm "$link_name"
    fi
    
    # Create symlink
    ln -s "$target" "$link_name"
    echo -e "${GREEN}✓ Created symlink:${NC} $relative_path -> $target"
}

echo -e "${BLUE}\n=== Backing up original configuration files ===${NC}"

# Backup all config files
config_files=(
    # TypeORM configurations
    "${BASE_DIR}/backend/typeorm.config.ts"
    "${BASE_DIR}/backend/src/typeorm.config.ts"
    "${BASE_DIR}/backend/src/config/typeorm.config.ts"
    
    # Migration configurations
    "${BASE_DIR}/backend/migration.config.ts"
    "${BASE_DIR}/backend/migration.config.js"
    "${BASE_DIR}/backend/src/config/migration.config.ts"
    
    # Development/Test configurations
    "${BASE_DIR}/backend/src/config/development.config.ts"
    "${BASE_DIR}/backend/src/config/test-database.config.ts"
    "${BASE_DIR}/backend/src/config/database.config.ts"
    
    # Swagger configuration
    "${BASE_DIR}/backend/src/swagger-config.ts"
    
    # CORS configurations
    "${BASE_DIR}/backend/src/config/cors.config.ts"
    "${BASE_DIR}/backend/src/shared/config/cors.config.ts"
)

for file in "${config_files[@]}"; do
    backup_file "$file" || true  # Continue even if file not found
done

echo -e "${BLUE}\n=== Consolidating TypeORM configurations ===${NC}"
# Keep /backend/src/config/typeorm.config.ts as the main file
if [ -f "${BASE_DIR}/backend/src/config/typeorm.config.ts" ]; then
    # Create symlinks for other locations
    create_symlink "../src/config/typeorm.config.ts" "${BASE_DIR}/backend/typeorm.config.ts"
    create_symlink "./config/typeorm.config.ts" "${BASE_DIR}/backend/src/typeorm.config.ts"
else
    echo -e "${RED}✗ Main TypeORM config file not found. Please fix manually.${NC}"
fi

echo -e "${BLUE}\n=== Consolidating Migration configurations ===${NC}"
# Keep /backend/src/config/migration.config.ts as the main file
if [ -f "${BASE_DIR}/backend/src/config/migration.config.ts" ]; then
    # Create symlinks for other locations
    create_symlink "../src/config/migration.config.ts" "${BASE_DIR}/backend/migration.config.ts"
    
    # For JS file, we need to compile the TS file
    echo -e "${YELLOW}Note: JavaScript versions need to be compiled from TypeScript.${NC}"
    echo -e "${YELLOW}You'll need to update build scripts to generate migration.config.js from migration.config.ts${NC}"
else
    echo -e "${RED}✗ Main Migration config file not found. Please fix manually.${NC}"
fi

echo -e "${BLUE}\n=== Standardizing Swagger configuration name ===${NC}"
# Rename swagger-config.ts to swagger.config.ts for consistency
if [ -f "${BASE_DIR}/backend/src/swagger-config.ts" ]; then
    cp "${BASE_DIR}/backend/src/swagger-config.ts" "${BASE_DIR}/backend/src/swagger.config.ts"
    echo -e "${GREEN}✓ Created standardized file:${NC} backend/src/swagger.config.ts"
    echo -e "${YELLOW}Note: Keep the old file until all references are updated${NC}"
else
    echo -e "${RED}✗ Swagger config file not found. Please fix manually.${NC}"
fi

echo -e "${BLUE}\n=== Consolidating CORS configurations ===${NC}"
# Keep /backend/src/shared/config/cors.config.ts as the main file
if [ -f "${BASE_DIR}/backend/src/shared/config/cors.config.ts" ]; then
    if [ -f "${BASE_DIR}/backend/src/config/cors.config.ts" ]; then
        echo -e "${YELLOW}Warning: Both CORS config files exist. Please manually merge before creating symlink.${NC}"
        echo -e "${YELLOW}Run: diff ${BASE_DIR}/backend/src/shared/config/cors.config.ts ${BASE_DIR}/backend/src/config/cors.config.ts${NC}"
    else
        # Create symlinks for other locations
        create_symlink "../shared/config/cors.config.ts" "${BASE_DIR}/backend/src/config/cors.config.ts"
    fi
else
    echo -e "${RED}✗ Main CORS config file not found. Please fix manually.${NC}"
fi

echo -e "${BLUE}\n=== Updating package.json references ===${NC}"
# Update package.json references to point to the correct configuration files
if [ -f "${BASE_DIR}/backend/package.json" ]; then
    # Create a backup of package.json
    cp "${BASE_DIR}/backend/package.json" "${BACKUP_DIR}/package.json"
    
    # Update TypeORM migration paths - adjust the sed command based on actual content
    sed -i 's|typeorm migration:run -d typeorm\.config\.ts|typeorm migration:run -d src/config/typeorm.config.ts|g' "${BASE_DIR}/backend/package.json"
    sed -i 's|typeorm migration:revert -d typeorm\.config\.ts|typeorm migration:revert -d src/config/typeorm.config.ts|g' "${BASE_DIR}/backend/package.json"
    
    echo -e "${GREEN}✓ Updated package.json references${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
fi

echo -e "${BLUE}\n=== Configuration cleanup completed ===${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Check that all symlinks are correctly created"
echo -e "2. Test that the application still works with the new configuration structure"
echo -e "3. Update any remaining hardcoded references in the code"
echo -e "4. Run automated tests to verify functionality"
echo -e "5. Once confirmed working, remove duplicate files that are now replaced by symlinks"

echo -e "${GREEN}\nBackup of original files saved to: ${BACKUP_DIR}${NC}"
