#!/usr/bin/env node

/**
 * Script to standardize entity column names in all entity files
 * This script ensures all TypeORM column decorators have explicit snake_case names
 * that match our database standardization plan
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const backendDir = path.join(__dirname, '../../backend/src');
const backupsDir = path.join(__dirname, '../../backups/entities', new Date().toISOString());
const reportPath = path.join(__dirname, 'column-standardization-report.md');

// Map of camelCase entity properties to snake_case DB columns
const columnMappings = {
  // Common fields across entities
  'id': 'id',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'isActive': 'is_active',
  'userId': 'user_id',
  
  // Users entity
  'isAdmin': 'is_admin',
  'isVerified': 'is_verified',
  'walletAddress': 'wallet_address',
  'referralCode': 'referral_code',
  'referredById': 'referred_by_id',
  'referralTier': 'referral_tier',
  'verificationToken': 'verification_token',
  'resetPasswordToken': 'reset_password_token',
  'resetPasswordExpires': 'reset_password_expires',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'avatarUrl': 'avatar_url',
  'lastLoginAt': 'last_login_at',
  'lastLoginIp': 'last_login_ip',
  
  // UserDevice entity
  'deviceId': 'device_id',
  'deviceType': 'device_type',
  'osName': 'os_name',
  'osVersion': 'os_version',
  'browserVersion': 'browser_version',
  'lastUsedAt': 'last_used_at',
  'walletAddresses': 'wallet_addresses',
  'lastIpAddress': 'last_ip_address',
  'visitCount': 'visit_count',
  'lastSeenAt': 'last_seen_at',
  'firstSeen': 'first_seen',
  'lastSeen': 'last_seen',
  'isApproved': 'is_approved',
  
  // UserSession entity
  'walletId': 'wallet_id',
  'deviceId': 'device_id',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'expiresAt': 'expires_at',
  'endedAt': 'ended_at',
  
  // Wallet entity
  'privateKey': 'private_key',
  
  // WalletChallenge entity
  'challengeText': 'challenge_text',
  'isUsed': 'is_used',
  
  // General naming patterns
  'isEnabled': 'is_enabled',
  'isDeleted': 'is_deleted',
  'isDefault': 'is_default',
  'isPublic': 'is_public',
  'isPrivate': 'is_private',
  'isShared': 'is_shared',
  'lastModified': 'last_modified',
  'lastAccessed': 'last_accessed',
  'dateCreated': 'date_created',
  'dateModified': 'date_modified',
  'dateDeleted': 'date_deleted',
  'datePublished': 'date_published'
};

// Create backup directory
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Find all entity files
function findEntityFiles() {
  try {
    const result = execSync(`find ${backendDir} -name "*.entity.ts"`, { encoding: 'utf-8' });
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding entity files:', error.message);
    return [];
  }
}

// Create a backup of a file before modifying it
function backupFile(filePath) {
  const relativePath = path.relative(path.join(__dirname, '../../'), filePath);
  const backupPath = path.join(backupsDir, relativePath);
  
  // Create directory if it doesn't exist
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy the file
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Convert any camelCase property name to snake_case
function camelToSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function standardizeColumnNames(filePath) {
  const fileName = path.basename(filePath);
  const entityName = fileName.replace('.entity.ts', '');
  console.log(`Processing ${entityName} (${filePath})...`);
  
  // Backup the file
  const backupPath = backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changes = [];
  
  // First, extract all class property names (potential entity fields)
  const propertyRegex = /(\w+):\s*([^;]+);/g;
  const properties = [];
  let match;
  
  while ((match = propertyRegex.exec(content)) !== null) {
    properties.push(match[1]);
  }
  
  // Process each property to ensure it has correct column name in decorator
  for (const prop of properties) {
    // Skip if property is likely not a column (typically methods or computed getters)
    if (/^(get|set|is|has|update|delete|create|find)/.test(prop)) continue;
    
    // Determine the appropriate snake_case column name
    const snakeCaseColumn = columnMappings[prop] || camelToSnakeCase(prop);
    
    // Check for @Column decorator without name or with incorrect name
    const columnWithoutName = new RegExp(`@Column\\((\\s*|\\s*{[^}]*(?!name)[^}]*}\\s*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    const columnWithName = new RegExp(`@Column\\(\\s*{[^}]*name:\\s*["']([^"']+)["'][^}]*}\\s*\\)[\\s\\n]*${prop}\\s*:`, 'g');
    
    // Also check for specialized column types
    const createDateColumn = new RegExp(`@CreateDateColumn\\((\\s*|\\s*{[^}]*(?!name)[^}]*}\\s*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    const updateDateColumn = new RegExp(`@UpdateDateColumn\\((\\s*|\\s*{[^}]*(?!name)[^}]*}\\s*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    const deleteDateColumn = new RegExp(`@DeleteDateColumn\\((\\s*|\\s*{[^}]*(?!name)[^}]*}\\s*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    
    // Check for primary column types
    const primaryColumn = new RegExp(`@PrimaryColumn\\((\\s*|\\s*{[^}]*(?!name)[^}]*}\\s*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    const primaryGeneratedColumn = new RegExp(`@PrimaryGeneratedColumn\\(([^)]*)\\)[\\s\\n]*${prop}\\s*:`, 'g');
    
    let modified = false;

    // First reset search positions to start of string
    columnWithoutName.lastIndex = 0;
    columnWithName.lastIndex = 0;
    createDateColumn.lastIndex = 0;
    updateDateColumn.lastIndex = 0;
    deleteDateColumn.lastIndex = 0;
    primaryColumn.lastIndex = 0;
    primaryGeneratedColumn.lastIndex = 0;
    
    // Check for regular @Column with no name property or incorrect name
    let colNameMatch;
    if ((colNameMatch = columnWithName.exec(content)) !== null) {
      const existingName = colNameMatch[1];
      if (existingName !== snakeCaseColumn) {
        // Replace with correct name
        content = content.replace(
          new RegExp(`@Column\\(\\s*{[^}]*name:\\s*["']${existingName}["'][^}]*}\\s*\\)`, 'g'),
          `@Column({ name: '${snakeCaseColumn}' })`
        );
        changes.push(`Updated column name for '${prop}' from '${existingName}' to '${snakeCaseColumn}'`);
        modified = true;
      }
    } else if (columnWithoutName.test(content)) {
      // Add name property
      content = content.replace(
        columnWithoutName,
        (match, options) => {
          if (options.trim() === '') {
            return `@Column({ name: '${snakeCaseColumn}' })${prop}:`;
          } else {
            // Add name to existing options object
            return `@Column(${options.replace(/}$/, `, name: '${snakeCaseColumn}' }`)})${prop}:`;
          }
        }
      );
      changes.push(`Added column name '${snakeCaseColumn}' to '${prop}'`);
      modified = true;
    }
    
    // Check for @CreateDateColumn without name
    if (createDateColumn.test(content)) {
      content = content.replace(
        createDateColumn,
        (match, options) => {
          if (options.trim() === '') {
            return `@CreateDateColumn({ name: '${snakeCaseColumn}' })${prop}:`;
          } else {
            return `@CreateDateColumn(${options.replace(/}$/, `, name: '${snakeCaseColumn}' }`)})${prop}:`;
          }
        }
      );
      changes.push(`Added column name '${snakeCaseColumn}' to @CreateDateColumn for '${prop}'`);
      modified = true;
    }
    
    // Check for @UpdateDateColumn without name
    if (updateDateColumn.test(content)) {
      content = content.replace(
        updateDateColumn,
        (match, options) => {
          if (options.trim() === '') {
            return `@UpdateDateColumn({ name: '${snakeCaseColumn}' })${prop}:`;
          } else {
            return `@UpdateDateColumn(${options.replace(/}$/, `, name: '${snakeCaseColumn}' }`)})${prop}:`;
          }
        }
      );
      changes.push(`Added column name '${snakeCaseColumn}' to @UpdateDateColumn for '${prop}'`);
      modified = true;
    }
    
    // Check for @DeleteDateColumn without name
    if (deleteDateColumn.test(content)) {
      content = content.replace(
        deleteDateColumn,
        (match, options) => {
          if (options.trim() === '') {
            return `@DeleteDateColumn({ name: '${snakeCaseColumn}' })${prop}:`;
          } else {
            return `@DeleteDateColumn(${options.replace(/}$/, `, name: '${snakeCaseColumn}' }`)})${prop}:`;
          }
        }
      );
      changes.push(`Added column name '${snakeCaseColumn}' to @DeleteDateColumn for '${prop}'`);
      modified = true;
    }
    
    // Check for @PrimaryColumn without name
    if (primaryColumn.test(content)) {
      content = content.replace(
        primaryColumn,
        (match, options) => {
          if (options.trim() === '') {
            return `@PrimaryColumn({ name: '${snakeCaseColumn}' })${prop}:`;
          } else {
            return `@PrimaryColumn(${options.replace(/}$/, `, name: '${snakeCaseColumn}' }`)})${prop}:`;
          }
        }
      );
      changes.push(`Added column name '${snakeCaseColumn}' to @PrimaryColumn for '${prop}'`);
      modified = true;
    }
    
    // For now, don't add name to PrimaryGeneratedColumn as it may have own syntax
    // This is just to avoid breaking anything
  }
  
  // Fix @Entity decorator if needed
  const entityWithoutName = /@Entity\(\)\s*\n/;
  const entityWithName = /@Entity\(\s*{[^}]*name:\s*["']([^"']+)["'][^}]*}\s*\)/;
  
  if (!entityWithName.test(content) && entityWithoutName.test(content)) {
    // Convert class name to snake_case for table name
    const tableName = entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() + 's';
    content = content.replace(/@Entity\(\)/, `@Entity({ name: '${tableName}' })`);
    changes.push(`Added table name '${tableName}' to @Entity decorator`);
  }
  
  // Only write file if changes were made
  if (changes.length > 0) {
    fs.writeFileSync(filePath, content);
    return {
      entityName,
      filePath,
      backupPath,
      changes
    };
  }
  
  return null;
}

function generateReport(results) {
  let report = `# Column Standardization Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Count total entities and changes
  const totalEntities = results.length;
  const totalChanges = results.reduce((sum, result) => sum + result.changes.length, 0);
  
  report += `## Summary\n\n`;
  report += `- Total entities modified: ${totalEntities}\n`;
  report += `- Total column name changes: ${totalChanges}\n`;
  report += `- Backups stored in: \`${path.relative(process.cwd(), backupsDir)}\`\n\n`;
  
  // Details of changes per entity
  report += `## Changes by Entity\n\n`;
  results.forEach(result => {
    report += `### ${result.entityName}\n\n`;
    report += `File: \`${path.relative(process.cwd(), result.filePath)}\`\n\n`;
    report += `Changes made:\n`;
    result.changes.forEach(change => {
      report += `- ${change}\n`;
    });
    report += `\n`;
  });
  
  fs.writeFileSync(reportPath, report);
  console.log(`Report generated at ${reportPath}`);
}

function main() {
  console.log('Finding entity files...');
  const entityFiles = findEntityFiles();
  console.log(`Found ${entityFiles.length} entity files`);
  
  const results = [];
  
  entityFiles.forEach(filePath => {
    try {
      const result = standardizeColumnNames(filePath);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
    }
  });
  
  console.log(`\nProcessed ${entityFiles.length} files`);
  console.log(`Made changes to ${results.length} files`);
  
  if (results.length > 0) {
    generateReport(results);
  }
}

// Run the script
main();