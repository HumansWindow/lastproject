#!/usr/bin/env node

/**
 * Script to execute the migration plan for merging duplicate quiz files
 * 
 * This script will:
 * 1. Read the analysis report created by merge-quiz-duplicates.js
 * 2. Update import statements in files to use the modern quiz file structure
 * 3. Create a backup of each file before modifying it
 * 4. Optionally remove the legacy files after confirmation
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/quiz-migration');

// Helper functions
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createBackup(filePath) {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  
  ensureDirectoryExists(path.dirname(backupPath));
  fs.copyFileSync(filePath, backupPath);
  
  return backupPath;
}

function updateImportsInFile(filePath, importUpdates) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let updated = false;
  
  // For each specified import update
  importUpdates.forEach(update => {
    const fromPattern = update.from;
    const toPattern = update.to;
    
    // Define common import patterns to search for
    const patterns = [
      // Direct imports from the file
      new RegExp(`from\\s+['"](\\./|../)*${fromPattern.replace(/\//g, '\\/').replace(/\./g, '\\.')}['"]`, 'g'),
      
      // Full path imports (relative to src)
      new RegExp(`from\\s+['"]([^'"]*/)${path.basename(fromPattern).replace(/\./g, '\\.')}['"]`, 'g'),
      
      // For renamed imports like "QuizQuestion as QuizQuestionLegacy"
      new RegExp(`import\\s+{\\s*([\\w\\s,]+)\\s+as\\s+([\\w]+)\\s*}\\s+from\\s+['"](\\./|../)*${fromPattern.replace(/\//g, '\\/').replace(/\./g, '\\.')}['"]`, 'g'),
      
      // For direct symbol imports
      new RegExp(`import\\s+{\\s*([\\w\\s,]+)\\s*}\\s+from\\s+['"](\\./|../)*${fromPattern.replace(/\//g, '\\/').replace(/\./g, '\\.')}['"]`, 'g')
    ];
    
    // Check if any of the patterns match
    let matched = false;
    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        matched = true;
      }
    });
    
    if (matched) {
      // For direct imports
      content = content.replace(
        new RegExp(`from\\s+['"](\\./|../)*${fromPattern.replace(/\//g, '\\/').replace(/\./g, '\\.')}['"]`, 'g'),
        `from '$1${toPattern}'`
      );
      
      // For full path imports
      content = content.replace(
        new RegExp(`from\\s+['"]([^'"]*/)${path.basename(fromPattern).replace(/\./g, '\\.')}['"]`, 'g'),
        (match, prefix) => `from '${prefix}${path.basename(toPattern)}'`
      );
      
      // For renamed imports
      content = content.replace(
        new RegExp(`import\\s+{\\s*([\\w\\s,]+)\\s+as\\s+([\\w]+)\\s*}\\s+from\\s+['"](\\./|../)*${fromPattern.replace(/\//g, '\\/').replace(/\./g, '\\.')}['"]`, 'g'),
        (match, importName, aliasName) => `import { ${importName} } from '$3${toPattern}'`
      );
      
      updated = true;
    }
  });
  
  if (updated) {
    return content;
  }
  
  return null;
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Main function
async function main() {
  // Check if report file is provided
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Please provide the path to the analysis report file');
    console.error('Usage: node merge-quiz-files.js <report-file-path>');
    process.exit(1);
  }
  
  const reportPath = args[0];
  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found: ${reportPath}`);
    process.exit(1);
  }

  // Read the report
  console.log(`Reading report from: ${reportPath}`);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  
  // Create backup directory
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${BACKUP_DIR}-${timestamp}`;
  ensureDirectoryExists(backupDir);
  
  // Process each file in the migration plan
  console.log(`\nFound ${report.migrationPlan.length} files to update.`);
  
  let processed = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const fileUpdate of report.migrationPlan) {
    try {
      console.log(`\nProcessing: ${fileUpdate.file}`);
      
      if (!fs.existsSync(fileUpdate.file)) {
        console.log(`  - File does not exist, skipping`);
        skipped++;
        continue;
      }
      
      // Create backup
      const backupPath = path.join(backupDir, path.relative(PROJECT_ROOT, fileUpdate.file));
      ensureDirectoryExists(path.dirname(backupPath));
      fs.copyFileSync(fileUpdate.file, backupPath);
      console.log(`  - Created backup at: ${path.relative(PROJECT_ROOT, backupPath)}`);
      
      // Update imports
      const updatedContent = updateImportsInFile(fileUpdate.file, fileUpdate.importUpdates);
      
      if (updatedContent) {
        fs.writeFileSync(fileUpdate.file, updatedContent);
        console.log(`  - Updated import statements`);
        processed++;
      } else {
        console.log(`  - No changes needed`);
        skipped++;
      }
    } catch (error) {
      console.error(`  - Error processing file: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n--- Migration Summary ---`);
  console.log(`Files updated: ${processed}`);
  console.log(`Files skipped: ${skipped}`);
  console.log(`Errors encountered: ${errors}`);
  console.log(`Backups created in: ${backupDir}`);
  
  // Ask about removing legacy files
  if (report.duplicateFiles) {
    console.log(`\nThe following legacy files were identified:`);
    
    // List all legacy files
    let legacyFiles = [];
    Object.keys(report.duplicateFiles).forEach(category => {
      if (report.duplicateFiles[category].legacy) {
        legacyFiles = legacyFiles.concat(report.duplicateFiles[category].legacy);
      }
    });
    
    legacyFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    const answer = await promptUser('\nDo you want to remove these legacy files? (yes/no): ');
    
    if (answer === 'yes' || answer === 'y') {
      console.log('\nRemoving legacy files...');
      
      let removed = 0;
      for (const file of legacyFiles) {
        try {
          if (fs.existsSync(file)) {
            // Backup before removing
            const backupPath = path.join(backupDir, 'removed', path.relative(PROJECT_ROOT, file));
            ensureDirectoryExists(path.dirname(backupPath));
            fs.copyFileSync(file, backupPath);
            
            // Remove the file
            fs.unlinkSync(file);
            console.log(`  - Removed: ${file}`);
            removed++;
          }
        } catch (error) {
          console.error(`  - Error removing file ${file}: ${error.message}`);
          errors++;
        }
      }
      
      console.log(`\nRemoved ${removed} legacy files`);
    } else {
      console.log('\nLegacy files were not removed');
    }
  }
  
  // Ask to run the special module fix script
  console.log('\nDo you want to also fix imports in game.module.ts and remove quiz-compat.ts? (yes/no): ');
  const fixModuleAnswer = await promptUser('This will ensure game.module.ts uses the modern quiz structure: ');
  
  if (fixModuleAnswer === 'yes' || fixModuleAnswer === 'y') {
    console.log('\nRunning the fix-quiz-module-imports.js script...');
    
    try {
      // Use Node.js child_process to execute the script
      const { execSync } = require('child_process');
      execSync('node ./scripts/tooling/fix-quiz-module-imports.js', { 
        cwd: PROJECT_ROOT,
        stdio: 'inherit' 
      });
    } catch (error) {
      console.error(`  - Error running fix-quiz-module-imports.js: ${error.message}`);
      errors++;
    }
  }
  
  console.log('\nMigration complete!');
}

main().catch(error => {
  console.error('\nError running the script:', error);
  process.exit(1);
});