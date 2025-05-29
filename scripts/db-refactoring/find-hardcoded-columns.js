#!/usr/bin/env node

/**
 * Hardcoded Column Reference Finder
 * This script scans the codebase for hardcoded references to database column names
 * that might break after the column standardization.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Define the base path to the backend directory
const baseDir = path.join(__dirname, '..', 'backend', 'src');

// Define problematic patterns to search for - these are camelCase column names that were changed
const problematicPatterns = [
  // Query builder references - high risk
  '.where\\(["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  '.andWhere\\(["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  '.orWhere\\(["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  '.orderBy\\(["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  '.groupBy\\(["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  '.select\\(\\[[^\\]]*["\']\\w+\\.["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  
  // Raw SQL - highest risk
  'SELECT[^;]+(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)',
  'UPDATE[^;]+(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)',
  'INSERT INTO[^;]+(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)',

  // Repository method parameters - medium risk
  'findBy\\w+\\([^)]*["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?',
  'findOneBy\\w+\\([^)]*["\']?(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId)["\']?'
];

// Column mappings from camelCase to snake_case
const columnMappings = {
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'isActive': 'is_active',
  'isAdmin': 'is_admin',
  'isVerified': 'is_verified',
  'walletAddress': 'wallet_address',
  'deviceId': 'device_id',
  'userId': 'user_id',
  'expiresAt': 'expires_at',
  'ipAddress': 'ip_address',
  'userAgent': 'user_agent',
  'walletId': 'wallet_id',
  'deviceType': 'device_type',
  'osVersion': 'os_version',
  'browserVersion': 'browser_version',
  'lastIpAddress': 'last_ip_address',
  'visitCount': 'visit_count',
  'lastSeenAt': 'last_seen_at'
};

// Search files for problematic patterns
async function findProblematicReferences() {
  const results = [];
  
  // Define paths to search
  const searchPaths = [
    path.join(baseDir, 'users'),
    path.join(baseDir, 'auth'),
    path.join(baseDir, 'wallets'),
  ];
  
  console.log('Searching for hardcoded column references...\n');
  
  // Search each directory
  for (const searchPath of searchPaths) {
    try {
      // Find all TS files except entity files (we already processed those)
      const { stdout: filesStdout } = await exec(`find ${searchPath} -name "*.ts" -not -path "*/entities/*.entity.ts" -not -path "*/node_modules/*" -not -path "*/dist/*"`);
      const files = filesStdout.trim().split('\n').filter(Boolean);
      
      // Process each file
      for (const file of files) {
        // Skip if the file doesn't exist anymore
        if (!fs.existsSync(file)) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        const fileResults = [];
        
        // Search for each problematic pattern
        for (const pattern of problematicPatterns) {
          try {
            const regex = new RegExp(pattern, 'g');
            const matches = content.match(regex);
            
            if (matches && matches.length > 0) {
              // Find the line numbers where these patterns appear
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineMatches = line.match(regex);
                
                if (lineMatches && lineMatches.length > 0) {
                  // Extract the specific column names from the match
                  for (const match of lineMatches) {
                    // Try to extract the camelCase column name
                    const columnMatches = match.match(/(createdAt|updatedAt|isActive|isAdmin|isVerified|walletAddress|deviceId|userId|expiresAt|ipAddress|userAgent|walletId|deviceType|osVersion|browserVersion|lastIpAddress|visitCount|lastSeenAt)/g);
                    
                    if (columnMatches) {
                      for (const columnMatch of columnMatches) {
                        if (columnMappings[columnMatch]) {
                          fileResults.push({
                            lineNumber: i + 1,
                            line: line.trim(),
                            pattern: columnMatch,
                            replacement: columnMappings[columnMatch],
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error(`Error with pattern ${pattern}:`, e);
          }
        }
        
        // If we found any problematic references, add them to the results
        if (fileResults.length > 0) {
          results.push({
            file: path.relative(baseDir, file),
            references: fileResults
          });
        }
      }
    } catch (err) {
      console.error(`Error searching ${searchPath}:`, err);
    }
  }
  
  return results;
}

// Generate a report for the problematic references
function generateReport(results) {
  console.log('===== Hardcoded Column Reference Report =====\n');
  console.log(`Found ${results.length} files with potentially problematic column references.\n`);
  
  // Group by file with counts
  console.log('Files with hardcoded column references:');
  results.forEach(result => {
    console.log(`- ${result.file} (${result.references.length} references)`);
  });
  
  console.log('\nDetailed findings:');
  console.log('-----------------\n');
  
  results.forEach(result => {
    console.log(`\nFile: ${result.file}`);
    console.log(`${'='.repeat(result.file.length + 6)}\n`);
    
    // Group references by line number
    const byLine = {};
    result.references.forEach(ref => {
      if (!byLine[ref.lineNumber]) {
        byLine[ref.lineNumber] = [];
      }
      byLine[ref.lineNumber].push(ref);
    });
    
    // Print each problematic line with its references
    Object.keys(byLine)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(lineNum => {
        console.log(`Line ${lineNum}:`);
        console.log(`   ${byLine[lineNum][0].line}`);
        
        // Print column replacements
        const uniqueReplacements = [];
        byLine[lineNum].forEach(ref => {
          const replacement = `${ref.pattern} → ${ref.replacement}`;
          if (!uniqueReplacements.includes(replacement)) {
            uniqueReplacements.push(replacement);
          }
        });
        
        uniqueReplacements.forEach(rep => {
          console.log(`   ↳ Replace: ${rep}`);
        });
        console.log('');
      });
  });
  
  // Generate a summary table of all unique column replacements
  console.log('\nSummary of column replacements:');
  console.log('-----------------------------\n');
  console.log('| CamelCase Column | Snake_case Column |');
  console.log('|-----------------|------------------|');
  
  Object.entries(columnMappings)
    .filter(([camel]) => results.some(r => r.references.some(ref => ref.pattern === camel)))
    .forEach(([camel, snake]) => {
      console.log(`| ${camel.padEnd(15)} | ${snake.padEnd(16)} |`);
    });
  
  console.log('\nNext Steps:');
  console.log('-----------');
  console.log('1. Review each problematic reference to determine if it needs updating');
  console.log('2. For TypeORM QueryBuilder usage, change any direct column references to use entity property names');
  console.log('3. For raw SQL, update all column names to use snake_case format');
  console.log('4. Review find* repository methods to ensure they use entity property names, not direct column names');
  console.log('5. Run the tests after each batch of changes to catch any issues early');
  
  // Save report to file
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const reportFile = path.join(__dirname, '..', `hardcoded-column-report-${timestamp}.md`);
  
  let reportContent = `# Hardcoded Column Reference Report\n\n`;
  reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  reportContent += `Found ${results.length} files with potentially problematic column references.\n\n`;
  
  reportContent += `## Files with hardcoded column references\n\n`;
  results.forEach(result => {
    reportContent += `- ${result.file} (${result.references.length} references)\n`;
  });
  
  reportContent += `\n## Detailed findings\n\n`;
  
  results.forEach(result => {
    reportContent += `### File: ${result.file}\n\n`;
    
    // Group references by line number
    const byLine = {};
    result.references.forEach(ref => {
      if (!byLine[ref.lineNumber]) {
        byLine[ref.lineNumber] = [];
      }
      byLine[ref.lineNumber].push(ref);
    });
    
    // Print each problematic line with its references
    Object.keys(byLine)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach(lineNum => {
        reportContent += `**Line ${lineNum}:**\n\n\`\`\`typescript\n${byLine[lineNum][0].line}\n\`\`\`\n\n`;
        
        // Print column replacements
        const uniqueReplacements = [];
        byLine[lineNum].forEach(ref => {
          const replacement = `${ref.pattern} → ${ref.replacement}`;
          if (!uniqueReplacements.includes(replacement)) {
            uniqueReplacements.push(replacement);
          }
        });
        
        reportContent += `Replace:\n`;
        uniqueReplacements.forEach(rep => {
          reportContent += `- ${rep}\n`;
        });
        reportContent += '\n';
      });
  });
  
  // Generate a summary table of all unique column replacements
  reportContent += `## Summary of column replacements\n\n`;
  reportContent += `| CamelCase Column | Snake_case Column |\n`;
  reportContent += `|-----------------|------------------|\n`;
  
  Object.entries(columnMappings)
    .filter(([camel]) => results.some(r => r.references.some(ref => ref.pattern === camel)))
    .forEach(([camel, snake]) => {
      reportContent += `| ${camel} | ${snake} |\n`;
    });
  
  reportContent += `\n## Next Steps\n\n`;
  reportContent += `1. Review each problematic reference to determine if it needs updating\n`;
  reportContent += `2. For TypeORM QueryBuilder usage, change any direct column references to use entity property names\n`;
  reportContent += `3. For raw SQL, update all column names to use snake_case format\n`;
  reportContent += `4. Review find* repository methods to ensure they use entity property names, not direct column names\n`;
  reportContent += `5. Run the tests after each batch of changes to catch any issues early\n`;
  
  fs.writeFileSync(reportFile, reportContent);
  console.log(`\nReport saved to: ${reportFile}`);
}

// Main function
async function main() {
  try {
    const results = await findProblematicReferences();
    generateReport(results);
  } catch (error) {
    console.error('Error running the script:', error);
  }
}

main();