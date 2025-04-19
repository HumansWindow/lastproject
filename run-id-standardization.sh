#!/bin/bash
# ID Field Standardization Process Runner
# This script guides you through the process of standardizing ID fields in your backend

# Set colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set variables
BACKEND_DIR="./backend"
DB_NAME="alive_db" # Change this to your database name
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
LOG_DIR="./logs"
LOG_FILE="${LOG_DIR}/id_standardization_${TIMESTAMP}.log"

# Create log directory if it doesn't exist
mkdir -p $LOG_DIR

# Display banner
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}     ID Field Standardization Process Runner     ${NC}"
echo -e "${BLUE}=================================================${NC}"
echo -e "This script will help you standardize ID field naming"
echo -e "in your TypeORM entities and PostgreSQL database."
echo -e "Started at: $(date)\n"

# Function to log messages
log() {
  local message="$1"
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo -e "$timestamp - $message" | tee -a "$LOG_FILE"
}

# Function to check for TypeScript
check_ts_node() {
  if ! command -v ts-node &> /dev/null; then
    log "${YELLOW}⚠️  ts-node is not installed. Installing now...${NC}"
    npm install -g ts-node typescript @types/node
    if [ $? -ne 0 ]; then
      log "${RED}❌ Failed to install ts-node. Please install it manually:${NC}"
      log "   npm install -g ts-node typescript @types/node"
      exit 1
    fi
    log "${GREEN}✅ ts-node installed successfully${NC}"
  else
    log "${GREEN}✅ ts-node is already installed${NC}"
  fi
}

# Step 1: Check prerequisites
log "Step 1: Checking prerequisites..."
check_ts_node

# Check for required node modules
cd $BACKEND_DIR
log "Checking for required Node modules..."
npm list fs path > /dev/null 2>&1
if [ $? -ne 0 ]; then
  log "${YELLOW}⚠️  Installing required Node modules...${NC}"
  npm install --save-dev @types/node
  if [ $? -ne 0 ]; then
    log "${RED}❌ Failed to install required modules${NC}"
    exit 1
  fi
fi
cd ..

# Step 2: Analyze the codebase
log "\nStep 2: Analyzing the codebase (Dry Run)..."
cd $BACKEND_DIR
log "Running analysis of entity files..."
npx ts-node ../fix-id-standardization.ts --dry-run --verbose
if [ $? -ne 0 ]; then
  log "${RED}❌ Analysis failed. Check the script for errors.${NC}"
  cd ..
  exit 1
fi
cd ..
log "${GREEN}✅ Analysis completed${NC}"

# Step 3: Database backup
log "\nStep 3: Creating database backup..."
read -p "Do you want to back up your database before proceeding? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  BACKUP_FILE="backups/db_backup_before_id_standardization_${TIMESTAMP}.sql"
  mkdir -p backups
  
  log "Backing up database to $BACKUP_FILE..."
  read -p "Enter database user (default: postgres): " DB_USER
  DB_USER=${DB_USER:-postgres}
  
  # Don't echo the password
  read -s -p "Enter database password: " DB_PASSWORD
  echo
  
  PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h localhost -F p -f "$BACKUP_FILE" "$DB_NAME"
  if [ $? -ne 0 ]; then
    log "${YELLOW}⚠️  Database backup failed. You may want to create a backup manually.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log "Operation cancelled by user."
      exit 0
    fi
  else
    log "${GREEN}✅ Database backup created at $BACKUP_FILE${NC}"
  fi
else
  log "${YELLOW}⚠️  Skipping database backup. Make sure you have a recent backup.${NC}"
fi

# Step 4: Apply database changes using SQL script
log "\nStep 4: Applying database schema changes..."
read -p "Do you want to apply the database schema standardization? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log "Executing SQL standardization script..."
  
  if [ -z "$DB_USER" ]; then
    read -p "Enter database user (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    # Don't echo the password
    read -s -p "Enter database password: " DB_PASSWORD
    echo
  fi
  
  PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -h localhost -d "$DB_NAME" -f "$BACKEND_DIR/standardize-id-fields.sql" > logs/sql_execution_${TIMESTAMP}.log 2>&1
  
  if [ $? -ne 0 ]; then
    log "${RED}❌ SQL script execution failed. Check logs/sql_execution_${TIMESTAMP}.log for details.${NC}"
    log "You may need to restore from backup."
  else
    log "${GREEN}✅ Database schema updated successfully${NC}"
  fi
else
  log "${YELLOW}⚠️  Skipping database schema changes.${NC}"
fi

# Step 5: Apply TypeScript code fixes
log "\nStep 5: Apply TypeScript code fixes..."
read -p "Do you want to apply automatic fixes to TypeScript entity files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # First create a backup of the entity files
  log "Creating backup of entity files..."
  ENTITY_BACKUP="backups/entity_backup_${TIMESTAMP}"
  mkdir -p "$ENTITY_BACKUP"
  
  # Find all entity files and copy them to backup
  find "$BACKEND_DIR/src" -name "*.entity.ts" -exec cp --parents {} "$ENTITY_BACKUP" \;
  
  log "Running TypeScript fixes..."
  npx ts-node fix-id-standardization.ts --fix
  
  if [ $? -ne 0 ]; then
    log "${RED}❌ Some fixes may have failed. Check the output above.${NC}"
  else
    log "${GREEN}✅ Applied automatic fixes to entity files${NC}"
  fi
  
  # Check for TypeScript compilation errors
  log "Checking for TypeScript compilation errors..."
  cd "$BACKEND_DIR"
  npx tsc --noEmit
  
  if [ $? -ne 0 ]; then
    log "${YELLOW}⚠️  TypeScript compilation produced errors. You may need to manually fix some issues.${NC}"
    log "Entity file backups are available in: $ENTITY_BACKUP"
  else
    log "${GREEN}✅ TypeScript compilation completed without errors${NC}"
  fi
  cd ..
else
  log "${YELLOW}⚠️  Skipping TypeScript fixes.${NC}"
fi

# Step 6: Final verification
log "\nStep 6: Final verification..."
read -p "Do you want to run a final verification on the codebase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log "Running final analysis to check for any remaining issues..."
  npx ts-node fix-id-standardization.ts --verbose
  
  if [ $? -ne 0 ]; then
    log "${RED}❌ Final verification failed.${NC}"
  else
    log "${GREEN}✅ Final verification completed.${NC}"
  fi
else
  log "${YELLOW}⚠️  Skipping final verification.${NC}"
fi

# Summary
log "\n${BLUE}=================================================${NC}"
log "${BLUE}     ID Field Standardization Process Complete     ${NC}"
log "${BLUE}=================================================${NC}"
log "Finished at: $(date)"
log "Log file: $LOG_FILE"
log "\nNext steps:"
log "1. Review the id-standardization-report.md file"
log "2. Fix any remaining errors manually"
log "3. Test your application thoroughly"
log "4. Commit the changes to your repository"

echo -e "\n${GREEN}Done!${NC}"