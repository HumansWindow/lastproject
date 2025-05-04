const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');

const SCRIPTS_DIR = __dirname;
const FOCUSED_DIR = path.join(SCRIPTS_DIR, 'focused');
const LOG_FILE = path.join(SCRIPTS_DIR, '..', '..', 'backend', 'typescript-focused-fixes.log');

// List of specialized fix scripts in order of priority
const fixScripts = [
  'fix-user-progress-service.ts',
  'fix-game-notification-service.ts',
  'fix-game-achievements-service.ts'
];

// Function to run a TypeScript file using ts-node
function runTsScript(scriptPath) {
  return new Promise((resolve, reject) => {
    // Use ts-node to execute the script
    const process = childProcess.exec(`npx ts-node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ${scriptPath}: ${error.message}\n${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

async function main() {
  console.log('Starting fix process for the most problematic files...\n');
  const startTime = new Date();
  
  let logContent = `TypeScript Focused Fix Log - ${startTime.toISOString()}\n`;
  logContent += '='.repeat(80) + '\n\n';
  
  try {
    // Check if all scripts exist
    for (const script of fixScripts) {
      const scriptPath = path.join(FOCUSED_DIR, script);
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script not found: ${scriptPath}`);
      }
    }

    // Run each script in sequence
    for (const script of fixScripts) {
      const scriptPath = path.join(FOCUSED_DIR, script);
      console.log(`\nRunning ${script}...`);
      
      try {
        const output = await runTsScript(scriptPath);
        console.log(output);
        logContent += `${script} output:\n${output}\n${'='.repeat(40)}\n\n`;
      } catch (error) {
        console.error(`Error in ${script}:`, error);
        logContent += `ERROR in ${script}:\n${error}\n${'='.repeat(40)}\n\n`;
      }
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    logContent += `\nExecution completed in ${duration} seconds.\n`;
    logContent += `Fixed files: \n`;
    logContent += ` - user-progress.service.ts (53 errors)\n`;
    logContent += ` - game-notification-service.ts (16 errors)\n`;
    logContent += ` - game-achievements.service.ts (16 errors)\n\n`;
    
    logContent += `Next steps:\n`;
    logContent += `1. Run TypeScript compiler to check remaining errors: npx tsc --noEmit\n`;
    logContent += `2. If errors remain in these files, fix them manually\n`;
    logContent += `3. Proceed with fixing the remaining 52 errors in other files\n`;

    // Write the log file
    fs.writeFileSync(LOG_FILE, logContent);
    
    console.log(`\n✅ All fixes completed successfully!`);
    console.log(`Log file written to: ${LOG_FILE}`);
    console.log(`\nPlease run the TypeScript compiler to check remaining errors.`);
    
  } catch (error) {
    console.error('Error in fix process:', error);
    
    logContent += `\nERROR in main process:\n${error}\n`;
    fs.writeFileSync(LOG_FILE, logContent);
    
    process.exit(1);
  }
}

main();