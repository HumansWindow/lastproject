#!/usr/bin/env node

/**
 * Entity Analysis Script
 * This script analyzes TypeORM entity files to determine which fields need 
 * proper column name decorators to standardize the database schema.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Define the base path to the backend directory
const baseDir = path.join(__dirname, '..', 'backend', 'src');

// Define entities to analyze
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
  'userId': 'user_id'
};

// Function to analyze a single entity file
async function analyzeEntityFile(entityPath) {
  const fullPath = path.join(baseDir, entityPath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return {
      path: entityPath,
      exists: false,
      fields: []
    };
  }
  
  // Read the file content
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  // Extract class fields
  const fields = [];
  let inClass = false;
  let classIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect class start
    if (line.includes('export class ') && line.includes('{')) {
      inClass = true;
      classIndent = line.indexOf('{');
      continue;
    }
    
    // Skip if not in class
    if (!inClass) continue;
    
    // Detect end of class
    if (line.indexOf('}') === classIndent) {
      inClass = false;
      continue;
    }
    
    // Look for field declarations (properties with types)
    const propertyMatch = line.match(/^\s*(\w+):\s*(\w+)/);
    if (propertyMatch) {
      const propertyName = propertyMatch[1];
      const propertyType = propertyMatch[2];
      
      // Check previous line for decorators
      let decoratorLine = lines[i - 1] || '';
      let hasColumnDecorator = decoratorLine.includes('@Column');
      let hasColumnName = decoratorLine.includes('name:');
      let snakeCaseName = columnMappings[propertyName] || null;
      let currentColumnName = null;
      
      if (hasColumnDecorator && hasColumnName) {
        // Extract the current column name
        const columnNameMatch = decoratorLine.match(/name:\s*['"]([\w_]+)['"]/);
        if (columnNameMatch) {
          currentColumnName = columnNameMatch[1];
        }
      }
      
      fields.push({
        name: propertyName,
        type: propertyType,
        hasColumnDecorator,
        hasColumnName,
        snakeCaseName,
        currentColumnName,
        line: i,
        decoratorLine: i - 1
      });
    }
  }
  
  return {
    path: entityPath,
    exists: true,
    fields
  };
}

// Main analysis function
async function analyzeEntities() {
  console.log('Analyzing Authentication-Related Entity Files');
  console.log('===========================================\n');
  
  const results = [];
  
  for (const entityPath of authEntities) {
    try {
      const analysis = await analyzeEntityFile(entityPath);
      
      if (!analysis.exists) {
        console.log(`⚠️ File not found: ${entityPath}`);
        continue;
      }
      
      results.push(analysis);
      
      // Output the analysis
      console.log(`\n📄 ${entityPath}`);
      console.log('-------------------------');
      
      let needsUpdates = false;
      
      analysis.fields.forEach(field => {
        if (!field.hasColumnDecorator) {
          console.log(`  - ❌ ${field.name}: Missing @Column decorator`);
          needsUpdates = true;
        } else if (!field.hasColumnName && field.snakeCaseName) {
          console.log(`  - ⚠️ ${field.name}: Has @Column but missing name: '${field.snakeCaseName}'`);
          needsUpdates = true;
        } else if (field.currentColumnName && field.snakeCaseName && field.currentColumnName !== field.snakeCaseName) {
          console.log(`  - ⚠️ ${field.name}: Column name mismatch - current: '${field.currentColumnName}', should be: '${field.snakeCaseName}'`);
          needsUpdates = true;
        } else if (field.snakeCaseName) {
          console.log(`  - ✅ ${field.name}: Properly defined with name: '${field.snakeCaseName}'`);
        } else {
          console.log(`  - ℹ️ ${field.name}: No mapping defined, current state: ${field.hasColumnDecorator ? (field.hasColumnName ? `has name: '${field.currentColumnName}'` : 'missing name') : 'no @Column'}`);
        }
      });
      
      if (!needsUpdates) {
        console.log('  ✅ No updates needed for this entity');
      }
    } catch (error) {
      console.error(`Error analyzing ${entityPath}:`, error);
    }
  }
  
  return results;
}

// Execute the analysis
analyzeEntities()
  .then(results => {
    console.log('\n\nAnalysis Summary');
    console.log('===============');
    const total = results.length;
    const needsUpdates = results.filter(r => r.fields.some(f => 
      (!f.hasColumnDecorator && f.snakeCaseName) || 
      (f.hasColumnDecorator && !f.hasColumnName && f.snakeCaseName) ||
      (f.currentColumnName && f.snakeCaseName && f.currentColumnName !== f.snakeCaseName)
    )).length;
    
    console.log(`Total entity files analyzed: ${total}`);
    console.log(`Files needing updates: ${needsUpdates}`);
    console.log(`\nNext steps: Run the entity update script to fix these issues.`);
  })
  .catch(error => {
    console.error('Error during analysis:', error);
  });