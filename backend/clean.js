const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Cleaning project...');

// Delete dist folder
try {
  console.log('Removing dist folder...');
  
  // Check if dist folder exists
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    if (process.platform === 'win32') {
      // Windows needs different command
      execSync('rmdir /s /q dist', { stdio: 'inherit' });
    } else {
      // Unix-like systems
      execSync('rm -rf dist', { stdio: 'inherit' });
    }
    console.log('Dist folder removed successfully.');
  } else {
    console.log('Dist folder does not exist. Skipping removal.');
  }
} catch (error) {
  console.error('Failed to remove dist folder:', error.message);
}

// Clean node_modules/.cache
try {
  console.log('Cleaning node_modules/.cache...');
  
  const cachePath = path.join(__dirname, 'node_modules', '.cache');
  
  if (fs.existsSync(cachePath)) {
    if (process.platform === 'win32') {
      execSync('rmdir /s /q node_modules\\.cache', { stdio: 'inherit' });
    } else {
      execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
    }
    console.log('Cache cleaned successfully.');
  } else {
    console.log('Cache directory does not exist. Skipping cleanup.');
  }
} catch (error) {
  console.error('Failed to clean cache:', error.message);
}

// Install or reinstall cookie-parser
try {
  console.log('Reinstalling cookie-parser...');
  execSync('npm uninstall cookie-parser', { stdio: 'inherit' });
  execSync('npm install cookie-parser', { stdio: 'inherit' });
  console.log('cookie-parser reinstalled successfully.');
} catch (error) {
  console.error('Failed to reinstall cookie-parser:', error.message);
}

console.log('Cleaning complete.');
