#!/usr/bin/env node

/**
 * Script to find entities with missing primary columns or duplicate decorators
 * This script scans all entity files in the backend directory and reports any issues
 * related to missing primary columns or entities with duplicate decorators
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const backendDir = path.join(__dirname, '../../backend/src');
const outputPath = path.join(__dirname, 'entity-issues-report.md');

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

// Check if an entity has properly defined primary columns
function checkEntityForPrimaryColumn(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const entityName = fileName.replace('.entity.ts', '');
    
    // Common issues to check
    const issues = [];
    
    // Check for missing primary column
    const hasPrimaryColumn = 
      content.includes('@PrimaryColumn') || 
      content.includes('@PrimaryGeneratedColumn');
    
    if (!hasPrimaryColumn) {
      issues.push('Missing primary column definition');
    }
    
    // Check for duplicate primary column decorators
    const hasDuplicatePrimaryDecorators = 
      content.includes('@PrimaryGeneratedColumn') && 
      content.includes('@PrimaryColumn') &&
      content.includes('id:');
    
    if (hasDuplicatePrimaryDecorators) {
      issues.push('Has both @PrimaryGeneratedColumn and @PrimaryColumn decorators');
    }
    
    // Check for id field with @Column decorator (common mistake)
    const hasIdWithColumnDecorator = 
      content.includes('@Column') && 
      content.includes('id:') &&
      (content.match(/@Column\([^)]*\)\s*id:/g) || []).length > 0;
    
    if (hasIdWithColumnDecorator) {
      issues.push('Has @Column decorator on id field that should be primary');
    }
    
    // Check for duplicate decorators on timestamp fields
    const hasTimestampDuplicates = 
      (content.includes('@CreateDateColumn') && content.includes('@Column') && content.includes('createdAt:')) ||
      (content.includes('@UpdateDateColumn') && content.includes('@Column') && content.includes('updatedAt:'));
    
    if (hasTimestampDuplicates) {
      issues.push('Has duplicate decorators on timestamp fields');
    }
    
    // Return issues if any found
    if (issues.length > 0) {
      return {
        entityName,
        filePath,
        issues
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error.message);
    return {
      entityName: path.basename(filePath),
      filePath,
      issues: ['Error reading or parsing file: ' + error.message]
    };
  }
}

// Generate a report of all entity issues
function generateReport() {
  const entityFiles = findEntityFiles();
  console.log(`Found ${entityFiles.length} entity files`);
  
  const issuesFound = [];
  
  entityFiles.forEach(filePath => {
    const issues = checkEntityForPrimaryColumn(filePath);
    if (issues) {
      issuesFound.push(issues);
    }
  });
  
  // Sort issues by entity name
  issuesFound.sort((a, b) => a.entityName.localeCompare(b.entityName));
  
  // Generate markdown report
  let report = `# Entity Issues Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  if (issuesFound.length === 0) {
    report += `No issues found across ${entityFiles.length} entity files!\n`;
  } else {
    report += `Found ${issuesFound.length} entities with issues\n\n`;
    
    issuesFound.forEach(({ entityName, filePath, issues }) => {
      report += `## ${entityName}\n\n`;
      report += `File: \`${filePath}\`\n\n`;
      report += `Issues:\n`;
      issues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    });
  }
  
  fs.writeFileSync(outputPath, report);
  console.log(`Report generated at ${outputPath}`);
  
  return issuesFound;
}

// Main function
function main() {
  console.log('Scanning entity files for issues...');
  const issues = generateReport();
  
  if (issues.length > 0) {
    console.log(`Found ${issues.length} entities with issues. See ${outputPath} for details.`);
    process.exit(1);
  } else {
    console.log('No entity issues found!');
    process.exit(0);
  }
}

// Run the script
main();