#!/usr/bin/env node

/**
 * Entity Decorator Update Script
 * This script updates TypeORM entity decorators to match the standardized database schema.
 * It adds explicit @Column decorators with snake_case names to all entity properties.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Define paths
const backendDir = path.join(__dirname, '..', 'backend');
const entitiesPattern = path.join(backendDir, 'src', '**', '*.entity.ts');
const backupDir = path.join(__dirname, '..', 'backups', 'entities', new Date().toISOString().replace(/:/g, '-'));

// Mapping of camelCase property names to snake_case database column names
const columnMappings = {
  // Common fields
  'id': 'id', // ID fields remain unchanged
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'isActive': 'is_active',
  
  // User entity
  'email': 'email',
  'password': 'password',
  'username': 'username',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'isAdmin': 'is_admin',
  'isVerified': 'is_verified',
  'verificationToken': 'verification_token',
  'resetPasswordToken': 'reset_password_token',
  'resetPasswordExpires': 'reset_password_expires',
  'walletAddress': 'wallet_address',
  'avatarUrl': 'avatar_url',
  'referralCode': 'referral_code',
  'referredById': 'referred_by_id',
  'referralTier': 'referral_tier',
  
  // UserDevice entity
  'userId': 'user_id',
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
  'deviceId': 'device_id',
  'walletId': 'wallet_id',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'token': 'token',
  'expiresAt': 'expires_at',
  'endedAt': 'ended_at',
  
  // Wallet entity
  'address': 'address',
  'chainId': 'chain_id',
  'network': 'network',
  'privateKey': 'private_key',
  
  // WalletChallenge entity
  'challengeText': 'challenge_text',
  'isUsed': 'is_used',
  
  // RefreshToken entity
  'token': 'token',
  'userId': 'user_id',
  'expiresAt': 'expires_at',
  'isRevoked': 'is_revoked',
};

// Create backup directory
async function createBackupDir() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`Created backup directory: ${backupDir}`);
    }
  } catch (error) {
    console.error(`Failed to create backup directory: ${error.message}`);
    throw error;
  }
}

// Find all entity files
async function findEntityFiles() {
  try {
    const { stdout } = await exec(`find ${backendDir}/src -name "*.entity.ts"`);
    return stdout.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error(`Failed to find entity files: ${error.message}`);
    throw error;
  }
}

// Backup an entity file
function backupEntityFile(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(backendDir, filePath);
  const backupPath = path.join(backupDir, relativePath);
  
  // Create subdirectories if needed
  const backupDirPath = path.dirname(backupPath);
  if (!fs.existsSync(backupDirPath)) {
    fs.mkdirSync(backupDirPath, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backed up ${fileName} to ${backupPath}`);
}

// Process an entity file
function processEntityFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\nProcessing ${fileName}...`);
  
  // Read file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if the file contains a TypeORM entity
  if (!content.includes('@Entity') && !content.includes('@entity')) {
    console.log(`- Skipping ${fileName}: Not a TypeORM entity`);
    return false;
  }
  
  // First, try to determine the entity class name
  const entityClassMatch = content.match(/export\s+class\s+(\w+)(?:\s+extends\s+\w+)?\s+\{/);
  if (!entityClassMatch) {
    console.log(`- Skipping ${fileName}: Could not identify entity class name`);
    return false;
  }
  const entityName = entityClassMatch[1];
  console.log(`- Entity class name: ${entityName}`);
  
  // Process each property mapping
  for (const [propName, dbColumn] of Object.entries(columnMappings)) {
    // Skip if the property name doesn't exist in the file
    const propRegex = new RegExp(`\\b${propName}\\s*:\\s*`);
    if (!propRegex.test(content)) {
      continue;
    }
    
    // Check different patterns for column decorators
    const explicitColumnDecoratorRegex = new RegExp(`@Column\\(\\s*{[^}]*name:\\s*["']${dbColumn}["'][^}]*}\\s*\\)\\s*${propName}\\s*:`);
    const simpleColumnDecoratorRegex = new RegExp(`@Column\\([^{]*\\)\\s*${propName}\\s*:`);
    const noColumnDecoratorRegex = new RegExp(`(\\s*)${propName}\\s*:`, 'm');
    
    if (explicitColumnDecoratorRegex.test(content)) {
      // Already has the correct explicit decorator
      console.log(`- ${propName}: Already has correct @Column({ name: '${dbColumn}' })`);
    } else if (simpleColumnDecoratorRegex.test(content)) {
      // Has a simple @Column() decorator, replace with explicit one
      content = content.replace(
        simpleColumnDecoratorRegex,
        (match) => {
          // Extract decorator options if any
          const optionsMatch = match.match(/@Column\(([^)]*)\)/);
          const options = optionsMatch && optionsMatch[1] ? optionsMatch[1].trim() : '';
          
          let newDecorator;
          if (!options) {
            newDecorator = `@Column({ name: '${dbColumn}' }) ${propName}:`;
          } else if (options.startsWith('{') && options.endsWith('}')) {
            // Add name property to existing object
            newDecorator = `@Column(${options.slice(0, -1)}${options.length > 2 ? ', ' : ''}name: '${dbColumn}'}) ${propName}:`;
          } else {
            // Convert non-object options to object with name
            newDecorator = `@Column({ ${options}${options ? ', ' : ''}name: '${dbColumn}' }) ${propName}:`;
          }
          
          console.log(`- ${propName}: Updated @Column decorator to include name: '${dbColumn}'`);
          modified = true;
          return newDecorator;
        }
      );
    } else if (noColumnDecoratorRegex.test(content)) {
      // No @Column decorator, add one
      content = content.replace(
        noColumnDecoratorRegex,
        (match, indent) => {
          const newLine = `${indent}@Column({ name: '${dbColumn}' })\n${indent}${propName}:`;
          console.log(`- ${propName}: Added @Column({ name: '${dbColumn}' })`);
          modified = true;
          return newLine;
        }
      );
    }
  }
  
  // Check if @Entity has tableName
  const entityMatch = content.match(/@Entity\((.*?)\)/s);
  if (entityMatch) {
    // Find the table name from the file name or entity name
    let tableName;
    if (fileName.match(/user[.-]device/i)) {
      tableName = 'user_devices';
    } else if (fileName.match(/user[.-]session/i)) {
      tableName = 'user_sessions';
    } else if (fileName.match(/refresh[.-]token/i)) {
      tableName = 'refresh_tokens';
    } else if (fileName.match(/wallet[.-]nonce/i)) {
      tableName = 'wallet_nonces';
    } else if (fileName.match(/wallet[.-]challenge/i)) {
      tableName = 'wallet_challenges';
    } else if (fileName.match(/wallet/i)) {
      tableName = 'wallets';
    } else if (fileName.match(/user/i)) {
      tableName = 'users';
    }
    
    if (tableName && !entityMatch[1].includes('name:') && !entityMatch[1].includes("name:")) {
      // Add table name to @Entity decorator
      content = content.replace(
        /@Entity\((.*?)\)/s,
        (match, options) => {
          if (options.trim() === '') {
            return `@Entity({ name: '${tableName}' })`;
          } else if (options.trim().startsWith('{') && options.trim().endsWith('}')) {
            const lastBraceIndex = options.lastIndexOf('}');
            return `@Entity(${options.substring(0, lastBraceIndex)}${options.trim().length > 2 ? ', ' : ''}name: '${tableName}'})`;
          } else {
            return `@Entity({ ${options}, name: '${tableName}' })`;
          }
        }
      );
      console.log(`- Added table name '${tableName}' to @Entity decorator`);
      modified = true;
    }
  }
  
  // Make sure TypeORM Column is imported
  if (!content.includes('import { Column,') && !content.includes('import {Column,') && 
      !content.includes('import { Column ') && !content.includes('import {Column ')) {
    
    // Check if there are any TypeORM imports
    const typeormImportRegex = /import\s+{\s*([^}]*)\s*}\s+from\s+['"]typeorm['"]/;
    const typeormImportMatch = content.match(typeormImportRegex);
    
    if (typeormImportMatch) {
      // Add Column to existing TypeORM import
      content = content.replace(
        typeormImportRegex,
        (match, imports) => {
          if (!imports.split(',').some(i => i.trim() === 'Column')) {
            return `import { Column, ${imports} } from 'typeorm'`;
          }
          return match;
        }
      );
    } else {
      // Add new TypeORM import
      content = `import { Column } from 'typeorm';\n${content}`;
    }
    
    console.log('- Added missing Column import');
    modified = true;
  }
  
  // Save file if modified
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${fileName}`);
    return true;
  } else {
    console.log(`ℹ️ No changes needed for ${fileName}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Create backup directory
    await createBackupDir();
    
    // Find entity files
    const entityFiles = await findEntityFiles();
    console.log(`Found ${entityFiles.length} entity files`);
    
    // Process each file
    let updatedCount = 0;
    for (const filePath of entityFiles) {
      // Backup file
      backupEntityFile(filePath);
      
      // Process file
      const updated = processEntityFile(filePath);
      if (updated) {
        updatedCount++;
      }
    }
    
    // Summary
    console.log(`\n======== Summary ========`);
    console.log(`Total entity files found: ${entityFiles.length}`);
    console.log(`Files updated: ${updatedCount}`);
    console.log(`Files unchanged: ${entityFiles.length - updatedCount}`);
    console.log(`Backups created in: ${backupDir}`);
    console.log(`========================`);
  } catch (error) {
    console.error(`Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();