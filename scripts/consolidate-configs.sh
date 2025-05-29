#!/bin/bash

# Configuration Consolidation Script
# This script consolidates duplicate configuration files in the project 
# according to the plan in config-conflicts-resolution.md

echo "Starting configuration consolidation..."
BASE_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"
BACKUP_DIR="$BASE_DIR/backup/config_backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backups will be stored in: $BACKUP_DIR"

# Step 1: Consolidate TypeORM Configuration Files
# ----------------------------------------------
echo "Consolidating TypeORM configuration files..."

# Target file - we'll keep this as the main file
TARGET_TYPEORM_CONFIG="$BASE_DIR/backend/src/config/typeorm.config.ts"
TEMP_FILE="$BASE_DIR/backend/src/config/typeorm.config.ts.merged"

# Create the config directory if it doesn't exist
mkdir -p "$BASE_DIR/backend/src/config"

# Create the improved merged file with best parts from all versions
cat > "$TEMP_FILE" << 'EOL'
// Consolidated TypeORM Configuration
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Ensure dotenv is loaded
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found, using default environment variables');
  dotenv.config();
}

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Log database connection parameters (without password)
console.log('Database connection parameters:');
console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`Port: ${process.env.DB_PORT || '5432'}`);
console.log(`Database: ${process.env.DB_DATABASE || 'Alive-Db'}`);
console.log(`Username: ${process.env.DB_USERNAME || 'Aliveadmin'}`);

// TypeORM Configuration for the application
export const typeOrmConfig: DataSourceOptions = {
  type: process.env.DB_TYPE as any || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: !isProduction, // Set to false in production
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create a DataSource instance for CLI tools and external usage
export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  // Override entities and migrations path for root-level execution
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false // Always false for DataSource to prevent accidental schema changes
});

// Default export for compatibility with TypeORM CLI
export default AppDataSource;
EOL

# Backup original files before replacing
cp -f "$BASE_DIR/backend/typeorm.config.ts" "$BACKUP_DIR/" 2>/dev/null || echo "Root typeorm.config.ts not found - skipping backup"
cp -f "$BASE_DIR/backend/src/typeorm.config.ts" "$BACKUP_DIR/" 2>/dev/null || echo "src/typeorm.config.ts not found - skipping backup"
cp -f "$TARGET_TYPEORM_CONFIG" "$BACKUP_DIR/" 2>/dev/null || echo "src/config/typeorm.config.ts not found - skipping backup"

# Replace the target file with our merged version
mv -f "$TEMP_FILE" "$TARGET_TYPEORM_CONFIG"
echo "✅ Created consolidated TypeORM config at: $TARGET_TYPEORM_CONFIG"

# Create symlinks to maintain compatibility
ln -sf "../src/config/typeorm.config.ts" "$BASE_DIR/backend/typeorm.config.ts" 2>/dev/null || echo "Warning: Could not create symlink at backend/typeorm.config.ts"
ln -sf "config/typeorm.config.ts" "$BASE_DIR/backend/src/typeorm.config.ts" 2>/dev/null || echo "Warning: Could not create symlink at src/typeorm.config.ts"

echo "✅ Created symlinks for backward compatibility"

# Step 2: Consolidate Migration Configuration Files
# ----------------------------------------------
echo "Consolidating Migration configuration files..."

# Target file for migrations config
TARGET_MIGRATION_CONFIG="$BASE_DIR/backend/src/config/migration.config.ts"
TEMP_MIGRATION_FILE="$BASE_DIR/backend/src/config/migration.config.ts.merged"

# Create the improved merged file with best parts from all versions
cat > "$TEMP_MIGRATION_FILE" << 'EOL'
// Consolidated Migration Configuration
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Ensure dotenv is loaded
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('No .env file found, using default environment variables');
  dotenv.config();
}

// Create a data source for migrations
export const dataSource = new DataSource({
  type: process.env.DB_TYPE as any || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: false, // Always false for migrations to prevent accidental schema changes
  logging: process.env.DB_LOGGING === 'true' || true
});

// Default export for compatibility
export default dataSource;
EOL

# Backup original files before replacing
cp -f "$BASE_DIR/backend/migration.config.js" "$BACKUP_DIR/" 2>/dev/null || echo "migration.config.js not found - skipping backup"
cp -f "$BASE_DIR/backend/migration.config.ts" "$BACKUP_DIR/" 2>/dev/null || echo "migration.config.ts not found - skipping backup"
cp -f "$TARGET_MIGRATION_CONFIG" "$BACKUP_DIR/" 2>/dev/null || echo "src/config/migration.config.ts not found - skipping backup"

# Replace the target file with our merged version
mv -f "$TEMP_MIGRATION_FILE" "$TARGET_MIGRATION_CONFIG"
echo "✅ Created consolidated Migration config at: $TARGET_MIGRATION_CONFIG"

# Create a CommonJS version for compatibility with scripts that use require()
cat > "$BASE_DIR/backend/migration.config.js" << 'EOL'
// CommonJS wrapper for migration.config.ts
require('dotenv').config();
const path = require('path');
const { DataSource } = require('typeorm');

// Import the TypeScript config if available (for ts-node)
let importedDataSource;
try {
  importedDataSource = require('./src/config/migration.config').dataSource;
  console.log('Using TypeScript migration config');
} catch (e) {
  console.log('TypeScript config not available, using direct configuration');
}

// Create a data source for migrations - Same as the TS version
const dataSource = importedDataSource || new DataSource({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'Aliveadmin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'Alive-Db',
  entities: [path.join(__dirname, 'src', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src', 'migrations', '**', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true' || true
});

module.exports = { dataSource };
EOL

echo "✅ Created CommonJS version for migration config"

# Create symlinks to maintain compatibility
ln -sf "src/config/migration.config.ts" "$BASE_DIR/backend/migration.config.ts" 2>/dev/null || echo "Warning: Could not create symlink at migration.config.ts"
echo "✅ Created symlinks for backward compatibility"

# Step 3: Fix Swagger Configuration
# ----------------------------------------------
echo "Standardizing Swagger configuration..."

# Rename the file to follow dot.config.ts convention
if [ -f "$BASE_DIR/backend/src/swagger-config.ts" ]; then
  # Backup original file
  cp -f "$BASE_DIR/backend/src/swagger-config.ts" "$BACKUP_DIR/" || echo "Could not backup swagger-config.ts"
  
  # Create standardized name file
  cp -f "$BASE_DIR/backend/src/swagger-config.ts" "$BASE_DIR/backend/src/swagger.config.ts" || echo "Error creating swagger.config.ts"
  
  echo "✅ Created standard-named Swagger config: swagger.config.ts"
else
  echo "⚠️ Swagger config file not found - skipping"
fi

# Step 4: Update package.json references
# ----------------------------------------------
echo "Updating package.json references..."

# Backup package.json
cp -f "$BASE_DIR/backend/package.json" "$BACKUP_DIR/" || echo "Could not backup package.json"

# Update package.json references using sed
sed -i 's/typeorm migration:run -d typeorm\.config\.ts/typeorm migration:run -d src\/config\/typeorm.config.ts/g' "$BASE_DIR/backend/package.json"
sed -i 's/typeorm migration:revert -d typeorm\.config\.ts/typeorm migration:revert -d src\/config\/typeorm.config.ts/g' "$BASE_DIR/backend/package.json"

echo "✅ Updated package.json references"

echo ""
echo "Configuration Consolidation Complete!"
echo "Backups stored in: $BACKUP_DIR"
echo "Please test the application to ensure everything is working correctly."
echo ""
