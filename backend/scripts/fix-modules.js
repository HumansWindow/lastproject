/**
 * This script creates a proper symlink from dist/node_modules to the parent node_modules directory
 * This is the simplest way to resolve module not found errors in the dist directory
 */
const fs = require('fs');
const path = require('path');

console.log('Creating symlink for node_modules in dist directory...');

const distDir = path.join(__dirname, '..', 'dist');
const distNodeModules = path.join(distDir, 'node_modules');
const parentNodeModules = path.join(__dirname, '..', 'node_modules');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Remove existing node_modules directory/symlink if it exists
if (fs.existsSync(distNodeModules)) {
  if (fs.lstatSync(distNodeModules).isSymbolicLink()) {
    fs.unlinkSync(distNodeModules);
    console.log('Removed existing symlink');
  } else {
    console.log(`${distNodeModules} exists but is not a symlink. Please remove it manually.`);
    process.exit(1);
  }
}

// Create the symlink
try {
  fs.symlinkSync(parentNodeModules, distNodeModules, 'junction');
  console.log(`Created symlink: ${distNodeModules} → ${parentNodeModules}`);
  console.log('Module resolution should now work correctly');
} catch (error) {
  console.error('Failed to create symlink:', error.message);
  
  if (error.code === 'EPERM') {
    console.log('\nYou might need administrative privileges to create the symlink.');
    console.log('Try running this script with administrator/root privileges.');
  }
  
  process.exit(1);
}
