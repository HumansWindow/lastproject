const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

console.log('🔧 Starting TypeScript fixes for most problematic files');
console.log('=====================================================');

const SCRIPT_DIR = __dirname;
const SCRIPTS = [
  path.join(SCRIPT_DIR, 'focused', 'fix-user-progress-service.js'),
  path.join(SCRIPT_DIR, 'focused', 'fix-game-notification-service.js'),
  path.join(SCRIPT_DIR, 'focused', 'fix-game-achievements-service.js')
];

const LOG_FILE = path.join(SCRIPT_DIR, '..', 'typescript-focused-fixes.log');
let logContent = `TypeScript Focused Fixes Log - ${new Date().toISOString()}\n\n`;

async function runJsScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`📄 Running fix script: ${path.basename(scriptPath)}`);
    
    const process = childProcess.exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error executing script ${scriptPath}: ${error.message}`);
        logContent += `\n❌ Error in ${scriptPath}:\n${error.message}\n${stderr}\n`;
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️ Script ${scriptPath} had warnings:\n${stderr}`);
        logContent += `\n⚠️ Warnings in ${scriptPath}:\n${stderr}\n`;
      }
      
      console.log(`✅ Successfully executed script: ${path.basename(scriptPath)}`);
      logContent += `\n✅ ${path.basename(scriptPath)} executed successfully:\n${stdout}\n`;
      
      resolve();
    });
    
    // Forward output to console
    process.stdout.on('data', (data) => {
      console.log(data);
    });
    
    process.stderr.on('data', (data) => {
      console.error(data);
    });
  });
}

async function runAllScripts() {
  let success = true;

  for (const script of SCRIPTS) {
    try {
      await runJsScript(script);
    } catch (error) {
      success = false;
      console.error(`Failed to run script ${script}: ${error.message}`);
    }
  }

  // Write log file
  fs.writeFileSync(LOG_FILE, logContent);
  console.log(`\n📝 Log file written to: ${LOG_FILE}`);

  if (success) {
    console.log('\n✅ All fixes completed successfully!');
    console.log('Please run the TypeScript compiler to check remaining errors.');
  } else {
    console.log('\n⚠️ Some fixes encountered errors. Check the log file for details.');
  }
}

runAllScripts().catch(error => {
  console.error('Error running scripts:', error);
  process.exit(1);
});