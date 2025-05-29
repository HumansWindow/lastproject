#!/usr/bin/env node

/**
 * Script to fix entities with primary column issues
 * This script reads the issues report and automatically fixes common problems with entity files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const issuesReportPath = path.join(__dirname, 'entity-issues-report.md');
const backupsDir = path.join(__dirname, '../../backups/entities', new Date().toISOString());

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
  console.log(`Backed up ${filePath} to ${backupPath}`);
}

// Fix an entity file with missing or duplicate primary column decorators
function fixEntityFile(filePath, issues) {
  console.log(`Fixing entity file: ${filePath}`);
  
  // Backup the file first
  backupFile(filePath);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix: Has both @PrimaryGeneratedColumn and @PrimaryColumn decorators
  if (issues.includes('Has both @PrimaryGeneratedColumn and @PrimaryColumn decorators')) {
    console.log('- Removing duplicate @PrimaryColumn decorator');
    // Keep @PrimaryGeneratedColumn and remove @PrimaryColumn
    content = content.replace(/@PrimaryColumn\([^)]*\)\s*\n/, '');
  }
  
  // Fix: Has @Column decorator on id field that should be primary
  if (issues.includes('Has @Column decorator on id field that should be primary')) {
    console.log('- Removing @Column decorator from id field');
    // Remove @Column decorator from id field
    content = content.replace(/@Column\([^)]*\)\s*\n\s*id:/, 'id:');
  }
  
  // Fix: Has duplicate decorators on timestamp fields
  if (issues.includes('Has duplicate decorators on timestamp fields')) {
    console.log('- Removing duplicate @Column decorators from timestamp fields');
    // Remove @Column decorator when @CreateDateColumn or @UpdateDateColumn is present
    content = content.replace(/@CreateDateColumn\([^)]*\)\s*\n\s*@Column\([^)]*\)\s*\n/, '@CreateDateColumn($1)\n');
    content = content.replace(/@UpdateDateColumn\([^)]*\)\s*\n\s*@Column\([^)]*\)\s*\n/, '@UpdateDateColumn($1)\n');
  }
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
  
  return true;
}

// Parse the issues report to get the list of entities with issues
function parseIssuesReport() {
  if (!fs.existsSync(issuesReportPath)) {
    console.error(`Issues report not found at ${issuesReportPath}`);
    return [];
  }
  
  const reportContent = fs.readFileSync(issuesReportPath, 'utf-8');
  const entitySections = reportContent.split('## ').slice(1); // Skip the header
  
  return entitySections.map(section => {
    const lines = section.split('\n').filter(Boolean);
    const entityName = lines[0];
    const filePath = lines[1].match(/`([^`]+)`/)[1];
    const issues = lines.slice(3).filter(line => line.startsWith('- ')).map(line => line.substring(2));
    
    return {
      entityName,
      filePath,
      issues
    };
  });
}

// Fix all entities with issues
function fixAllEntities() {
  const entities = parseIssuesReport();
  console.log(`Found ${entities.length} entities with issues to fix`);
  
  if (entities.length === 0) {
    console.log('No issues to fix');
    return;
  }
  
  const fixedEntities = [];
  const failedEntities = [];
  
  entities.forEach(entity => {
    try {
      const isFixed = fixEntityFile(entity.filePath, entity.issues);
      if (isFixed) {
        fixedEntities.push(entity.entityName);
      } else {
        failedEntities.push({
          entityName: entity.entityName,
          reason: 'Failed to fix automatically'
        });
      }
    } catch (error) {
      console.error(`Error fixing ${entity.entityName}:`, error.message);
      failedEntities.push({
        entityName: entity.entityName,
        reason: error.message
      });
    }
  });
  
  // Generate summary report
  console.log('\nSummary:');
  console.log(`- Fixed ${fixedEntities.length} entities`);
  console.log(`- Failed to fix ${failedEntities.length} entities`);
  
  if (failedEntities.length > 0) {
    console.log('\nFailed entities:');
    failedEntities.forEach(entity => {
      console.log(`- ${entity.entityName}: ${entity.reason}`);
    });
  }
}

// Main function
function main() {
  console.log('Starting entity fixes...');
  fixAllEntities();
}

// Run the script
main();