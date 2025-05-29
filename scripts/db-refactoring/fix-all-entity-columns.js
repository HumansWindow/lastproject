#!/usr/bin/env node

/**
 * Script to systematically fix all entities with primary column issues
 * This script directly modifies all entity files to fix common issues:
 * - Missing primary column decorators
 * - Duplicate decorators on the same field
 * - Inconsistent column naming
 * - Timestamp field decorators
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const backendDir = path.join(__dirname, '../../backend/src');
const backupsDir = path.join(__dirname, '../../backups/entities', new Date().toISOString());
const reportPath = path.join(__dirname, 'entity-fixes-report.md');

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

function fixEntityFile(filePath) {
  const fileName = path.basename(filePath);
  const entityName = fileName.replace('.entity.ts', '');
  console.log(`Processing ${entityName} (${filePath})...`);
  
  // Backup the file
  const backupPath = backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let changes = [];
  
  // Check and fix: id field has both @PrimaryGeneratedColumn and @Column decorator
  const hasDuplicateIdDecorator = /(@PrimaryGeneratedColumn\([^)]*\))\s*\n\s*(@Column\([^)]*\))\s*\n\s*id:/s.test(content);
  if (hasDuplicateIdDecorator) {
    content = content.replace(/(@PrimaryGeneratedColumn\([^)]*\))\s*\n\s*@Column\([^)]*\)\s*\n\s*(id:)/s, '$1\n  $2');
    changes.push('Removed duplicate @Column decorator on id field');
  }
  
  // Check and fix: id field has @Column decorator only (should be @PrimaryColumn or @PrimaryGeneratedColumn)
  const hasIdWithoutPrimary = /@Column\([^)]*\)\s*\n\s*id:\s*string;/s.test(content) && 
                             !/@PrimaryColumn\([^)]*\)|@PrimaryGeneratedColumn\([^)]*\)/s.test(content);
  if (hasIdWithoutPrimary) {
    content = content.replace(/@Column\([^)]*\)(\s*\n\s*id:\s*string;)/s, '@PrimaryGeneratedColumn("uuid")$1');
    changes.push('Added @PrimaryGeneratedColumn("uuid") to id field');
  }
  
  // Check and fix: CreatedAt and UpdatedAt have duplicate decorators
  if (/@CreateDateColumn\([^)]*\)\s*\n\s*@Column\([^)]*\)\s*\n\s*createdAt:/s.test(content)) {
    content = content.replace(/(@CreateDateColumn\([^)]*\))\s*\n\s*@Column\([^)]*\)\s*\n\s*(createdAt:)/s, '$1\n  $2');
    changes.push('Removed duplicate @Column decorator on createdAt field');
  }
  
  if (/@UpdateDateColumn\([^)]*\)\s*\n\s*@Column\([^)]*\)\s*\n\s*updatedAt:/s.test(content)) {
    content = content.replace(/(@UpdateDateColumn\([^)]*\))\s*\n\s*@Column\([^)]*\)\s*\n\s*(updatedAt:)/s, '$1\n  $2');
    changes.push('Removed duplicate @Column decorator on updatedAt field');
  }
  
  // Check and fix: Missing column name in timestamp decorators
  if (/@CreateDateColumn\(\)\s*\n\s*createdAt:/s.test(content)) {
    content = content.replace(/@CreateDateColumn\(\)(\s*\n\s*createdAt:)/s, '@CreateDateColumn({ name: "created_at" })$1');
    changes.push('Added name: "created_at" to @CreateDateColumn decorator');
  }
  
  if (/@UpdateDateColumn\(\)\s*\n\s*updatedAt:/s.test(content)) {
    content = content.replace(/@UpdateDateColumn\(\)(\s*\n\s*updatedAt:)/s, '@UpdateDateColumn({ name: "updated_at" })$1');
    changes.push('Added name: "updated_at" to @UpdateDateColumn decorator');
  }

  // Check and fix: Missing @Entity table name
  if (/@Entity\(\)\s*\n/s.test(content)) {
    // Convert class name to snake_case for table name
    const tableName = entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() + 's';
    content = content.replace(/@Entity\(\)(\s*\n)/s, `@Entity({ name: '${tableName}' })$1`);
    changes.push(`Added table name: '${tableName}' to @Entity decorator`);
  }
  
  // Only write to file and report if changes were made
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
  let report = `# Entity Fixes Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Count total entities and changes
  const totalEntities = results.length;
  const totalChanges = results.reduce((sum, result) => sum + result.changes.length, 0);
  
  report += `## Summary\n\n`;
  report += `- Total entities processed: ${totalEntities}\n`;
  report += `- Total changes made: ${totalChanges}\n`;
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
      const result = fixEntityFile(filePath);
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