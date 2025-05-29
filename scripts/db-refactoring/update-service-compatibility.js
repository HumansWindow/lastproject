#!/usr/bin/env node

/**
 * Service Compatibility Update Script
 * This script creates backward-compatible methods in services to handle
 * the transition from camelCase to snake_case database columns.
 */

const fs = require('fs');
const path = require('path');

// Define paths to service files that need updating
const serviceFiles = [
  'backend/src/users/users.service.ts',
  'backend/src/users/services/user-sessions.service.ts',
  'backend/src/users/services/user-devices.service.ts',
  'backend/src/auth/auth.service.ts',
  'backend/src/auth/services/auth.service.ts'
];

// Define method patterns and their replacements
const methodPatterns = [
  {
    pattern: /async\s+findByWalletAddress\s*\(\s*walletAddress\s*:\s*string\s*\)/g,
    replacement: `
  /**
   * Find a user by wallet address
   * @param walletAddress The wallet address to search for
   * @returns The user if found, null otherwise
   * @deprecated Use findByWalletAddress instead with property name (not DB column)
   */
  async findByWalletAddress(walletAddress: string)`
  },
  {
    pattern: /async\s+findByDeviceId\s*\(\s*deviceId\s*:\s*string\s*\)/g,
    replacement: `
  /**
   * Find devices by device ID
   * @param deviceId The device ID to search for
   * @returns An array of matching devices
   * @deprecated Use findByDeviceId instead with property name (not DB column)
   */
  async findByDeviceId(deviceId: string)`
  },
  {
    pattern: /async\s+findByUserId\s*\(\s*userId\s*:\s*string\s*\)/g,
    replacement: `
  /**
   * Find by user ID
   * @param userId The user ID to search for
   * @returns Matching records for the user
   * @deprecated Use findByUserId instead with property name (not DB column)
   */
  async findByUserId(userId: string)`
  },
  {
    pattern: /async\s+findByUserIdAndDeviceId\s*\(\s*userId\s*:\s*string\s*,\s*deviceId\s*:\s*string\s*\)/g,
    replacement: `
  /**
   * Find by user ID and device ID
   * @param userId The user ID to search for
   * @param deviceId The device ID to search for
   * @returns The matching record if found, null otherwise
   * @deprecated Use findByUserIdAndDeviceId with property names (not DB columns)
   */
  async findByUserIdAndDeviceId(userId: string, deviceId: string)`
  }
];

// Process a single file to add backwards compatibility
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  // Read the file
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return false;
  }
  
  // Create backup
  const backupPath = `${fullPath}.bak`;
  fs.copyFileSync(fullPath, backupPath);
  console.log(`Created backup at ${backupPath}`);
  
  // Read content
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Apply method patterns
  for (const { pattern, replacement } of methodPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
    }
  }
  
  // Replace QueryBuilder references if present
  const queryBuilderPatterns = [
    {
      // Replace direct column references in where clauses
      pattern: /\.where\(\s*['"`](\w+)\.(\w+)['"`]\s*,/g,
      replacement: (match, alias, column) => {
        // Only replace known problem columns
        if (['userId', 'deviceId', 'walletAddress', 'createdAt', 'updatedAt', 'isActive'].includes(column)) {
          const snakeCase = column.replace(/([A-Z])/g, '_$1').toLowerCase();
          return `.where(\`${alias}.${snakeCase}\`,`;
        }
        return match;
      }
    },
    {
      // Replace direct column references in orderBy clauses
      pattern: /\.orderBy\(\s*['"`](\w+)\.(\w+)['"`]\s*,/g,
      replacement: (match, alias, column) => {
        // Only replace known problem columns
        if (['userId', 'deviceId', 'walletAddress', 'createdAt', 'updatedAt', 'isActive'].includes(column)) {
          const snakeCase = column.replace(/([A-Z])/g, '_$1').toLowerCase();
          return `.orderBy(\`${alias}.${snakeCase}\`,`;
        }
        return match;
      }
    }
  ];
  
  // Apply query builder patterns
  for (const { pattern, replacement } of queryBuilderPatterns) {
    content = content.replace(pattern, replacement);
  }
  
  // Save the file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath}`);
    return true;
  } else {
    console.log(`ℹ️ No changes needed for ${filePath}`);
    return false;
  }
}

// Main function to process all files
function updateServiceFiles() {
  console.log('Updating Service Files for Column Standardization');
  console.log('===============================================\n');
  
  let changedFiles = 0;
  
  for (const serviceFile of serviceFiles) {
    try {
      if (processFile(serviceFile)) {
        changedFiles++;
      }
    } catch (error) {
      console.error(`Error processing ${serviceFile}:`, error);
    }
  }
  
  console.log(`\nUpdate Summary: ${changedFiles} files modified.`);
}

// Run the updates
updateServiceFiles();