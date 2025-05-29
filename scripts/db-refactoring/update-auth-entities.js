#!/usr/bin/env node

/**
 * Entity Update Script
 * This script automatically updates TypeORM entity files to ensure proper column name decorators.
 * It works with the authentication-related entities identified in our refactoring plan.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Define the base path to the backend directory
const baseDir = path.join(__dirname, '..', 'backend', 'src');
const backupDir = path.join(__dirname, '..', 'backup', 'entities', `backup-${Date.now()}`);

// Define entities to update
const authEntities = [
  'users/entities/user.entity.ts',
  'users/entities/user-device.entity.ts',
  'users/entities/user-session.entity.ts',
  'auth/entities/refresh-token.entity.ts',
  'wallets/entities/wallet.entity.ts',
  'wallets/entities/wallet-challenge.entity.ts',
  'wallets/entities/wallet-nonce.entity.ts'
];

// The column mappings from the standardization plan
const columnMappings = {
  // Common timestamp fields
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  
  // Common status fields
  'isActive': 'is_active',
  'isAdmin': 'is_admin',
  'isVerified': 'is_verified',
  'isApproved': 'is_approved',
  
  // User fields
  'walletAddress': 'wallet_address',
  'referralCode': 'referral_code',
  'referredById': 'referred_by_id',
  'referralTier': 'referral_tier',
  'firstName': 'first_name',
  'lastName': 'last_name',
  'avatarUrl': 'avatar_url',
  'verificationToken': 'verification_token',
  'resetPasswordToken': 'reset_password_token',
  'resetPasswordExpires': 'reset_password_expires',
  'lastLoginAt': 'last_login_at',
  'lastLoginIp': 'last_login_ip',
  
  // UserDevice fields
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
  
  // UserSession fields
  'walletId': 'wallet_id',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'expiresAt': 'expires_at',
  'endedAt': 'ended_at',
  
  // Wallet fields
  'privateKey': 'private_key',
  
  // WalletChallenge fields
  'challengeText': 'challenge_text',
  'isUsed': 'is_used',
  
  // RefreshToken fields
  'userId': 'user_id',
  'expires_at': 'expiresAt'
};

// Create backup directory
function createBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`Created backup directory: ${backupDir}`);
  }
}

// Backup a file before modifying it
function backupFile(entityPath) {
  const fullPath = path.join(baseDir, entityPath);
  const fileName = path.basename(fullPath);
  const dirName = path.dirname(entityPath).split('/').pop();
  
  // Create the module directory under backups if it doesn't exist
  const moduleBackupDir = path.join(backupDir, dirName);
  if (!fs.existsSync(moduleBackupDir)) {
    fs.mkdirSync(moduleBackupDir, { recursive: true });
  }
  
  const backupPath = path.join(moduleBackupDir, fileName);
  
  // Copy the file
  fs.copyFileSync(fullPath, backupPath);
  console.log(`Backed up ${entityPath} to ${backupPath}`);
}

// Process entity files to add proper column decorators
async function updateEntityFile(entityPath) {
  const fullPath = path.join(baseDir, entityPath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${fullPath}`);
    return {
      path: entityPath,
      exists: false,
      changes: []
    };
  }
  
  // Backup file first
  backupFile(entityPath);
  
  // Read the file content
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  const lines = content.split('\n');
  
  // Track changes
  const changes = [];
  
  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip import lines and other non-field lines
    if (line.trim().startsWith('import') || line.trim().startsWith('//')
        || line.trim().startsWith('@Entity') || line.trim().startsWith('@Index')) {
      continue;
    }
    
    // Look for field declarations (properties with types)
    const propertyMatch = line.match(/^\s*(\w+):\s*(\w+)/);
    if (propertyMatch) {
      const propertyName = propertyMatch[1];
      const snakeCaseName = columnMappings[propertyName];
      
      // Skip if no mapping is defined for this property
      if (!snakeCaseName) continue;
      
      // Check previous line for Column decorator
      if (i > 0) {
        const prevLine = lines[i-1];
        
        // If previous line has @Column
        if (prevLine.includes('@Column')) {
          
          // If it doesn't have name property or has wrong name
          if (!prevLine.includes('name:') || !prevLine.includes(`name: '${snakeCaseName}'`)) {
            if (!prevLine.includes('name:')) {
              // Add name to simple @Column() decorator
              if (prevLine.trim() === '@Column()') {
                lines[i-1] = prevLine.replace('@Column()', `@Column({ name: '${snakeCaseName}' })`);
                changes.push({
                  field: propertyName,
                  type: 'Added column name',
                  line: i
                });
              } 
              // Add name to @Column with other options
              else {
                const openBracePos = prevLine.indexOf('(');
                const closeBracePos = prevLine.lastIndexOf(')');
                
                if (openBracePos !== -1 && closeBracePos !== -1) {
                  const options = prevLine.substring(openBracePos + 1, closeBracePos).trim();
                  
                  // If already has object options
                  if (options.startsWith('{') && options.endsWith('}')) {
                    // Add name property to existing options
                    const optionsWithoutBraces = options.substring(1, options.length - 1).trim();
                    const newOptions = optionsWithoutBraces ? `{ ${optionsWithoutBraces}, name: '${snakeCaseName}' }` : `{ name: '${snakeCaseName}' }`;
                    lines[i-1] = prevLine.replace(options, newOptions);
                  } else {
                    // Convert simple options to object with name
                    const newOptions = options ? `{ ${options}, name: '${snakeCaseName}' }` : `{ name: '${snakeCaseName}' }`;
                    lines[i-1] = prevLine.replace(options, newOptions);
                  }
                  
                  changes.push({
                    field: propertyName,
                    type: 'Added column name to existing options',
                    line: i
                  });
                }
              }
            } else {
              // Replace incorrect column name with correct one
              const nameRegex = /name:\s*['"][\w_]+['"]/g;
              lines[i-1] = prevLine.replace(nameRegex, `name: '${snakeCaseName}'`);
              changes.push({
                field: propertyName,
                type: 'Changed column name',
                line: i
              });
            }
          }
        }
        // If no Column decorator, add one
        else if (!prevLine.includes('@') && !line.includes('@')) {
          // Calculate proper indentation
          const indent = line.match(/^\s*/)[0];
          lines.splice(i, 0, `${indent}@Column({ name: '${snakeCaseName}' })`);
          i++; // Increment i since we added a line
          changes.push({
            field: propertyName,
            type: 'Added Column decorator',
            line: i
          });
        }
      }
    }
  }
  
  // Save the file if changes were made
  if (changes.length > 0) {
    const newContent = lines.join('\n');
    if (newContent !== originalContent) {
      fs.writeFileSync(fullPath, newContent);
      console.log(`✅ Updated ${entityPath} with ${changes.length} changes`);
    } else {
      console.log(`ℹ️ No actual content changes needed for ${entityPath}`);
    }
  } else {
    console.log(`✅ No changes needed for ${entityPath}`);
  }
  
  return {
    path: entityPath,
    exists: true,
    changes
  };
}

// Main function to update all entity files
async function updateEntities() {
  console.log('Updating Authentication-Related Entity Files');
  console.log('==========================================\n');
  
  // Create backup directory
  createBackupDir();
  
  const results = [];
  
  for (const entityPath of authEntities) {
    try {
      console.log(`\nProcessing ${entityPath}...`);
      const result = await updateEntityFile(entityPath);
      results.push(result);
    } catch (error) {
      console.error(`Error processing ${entityPath}:`, error);
    }
  }
  
  return results;
}

// Execute the update
updateEntities()
  .then(results => {
    console.log('\n\nUpdate Summary');
    console.log('=============');
    
    const successful = results.filter(r => r.exists).length;
    const withChanges = results.filter(r => r.exists && r.changes.length > 0).length;
    const totalChanges = results.reduce((sum, r) => sum + (r.changes?.length || 0), 0);
    
    console.log(`Files processed successfully: ${successful}/${results.length}`);
    console.log(`Files updated with changes: ${withChanges}`);
    console.log(`Total field changes: ${totalChanges}`);
    console.log(`\nBackups saved to: ${backupDir}`);
    
    console.log(`\nNext steps: Run TypeScript compiler to verify changes and fix any remaining issues.`);
  })
  .catch(error => {
    console.error('Error during entity updates:', error);
  });