const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to your node_modules folder with issues
const problematicPath = path.join(__dirname, 'backend/src/blockchain/hotwallet/node_modules');

function fixSymlinks(directoryPath) {
  try {
    console.log(`Checking directory: ${directoryPath}`);
    
    // Check if directory exists
    if (!fs.existsSync(directoryPath)) {
      console.log(`Directory does not exist: ${directoryPath}`);
      return;
    }

    // Find potential circular symlinks
    const command = `find "${directoryPath}" -type l -exec test -e {} \\; -print | wc -l`;
    const symlinkCount = parseInt(execSync(command).toString().trim());
    
    console.log(`Found ${symlinkCount} symbolic links in ${directoryPath}`);
    
    if (symlinkCount > 1000) {
      console.log(`Too many symlinks detected (${symlinkCount}). This indicates circular references.`);
      console.log(`Removing directory: ${directoryPath}`);
      
      // Remove the problematic node_modules folder
      execSync(`rm -rf "${directoryPath}"`);
      console.log(`Successfully removed ${directoryPath}`);
      
      // Recreate the directory
      fs.mkdirSync(directoryPath, { recursive: true });
      console.log(`Created new empty directory: ${directoryPath}`);
      
      return;
    }
    
    // Get all files and directories
    const items = fs.readdirSync(directoryPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directoryPath, item.name);
      
      // Handle symlinks
      if (item.isSymbolicLink()) {
        try {
          const linkTarget = fs.readlinkSync(fullPath);
          console.log(`Found symlink: ${fullPath} -> ${linkTarget}`);
          
          // Check if symlink points to itself or a parent directory (circular)
          if (linkTarget.includes(fullPath) || fullPath.includes(linkTarget)) {
            console.log(`Circular symlink detected: ${fullPath}. Removing it.`);
            fs.unlinkSync(fullPath);
          }
        } catch (error) {
          console.log(`Error processing symlink ${fullPath}:`, error.message);
          // Remove problematic symlink
          try {
            fs.unlinkSync(fullPath);
            console.log(`Removed problematic symlink: ${fullPath}`);
          } catch (unlinkError) {
            console.log(`Error removing symlink ${fullPath}:`, unlinkError.message);
          }
        }
      } else if (item.isDirectory() && !item.name.startsWith('.')) {
        // Recursively process subdirectories
        fixSymlinks(fullPath);
      }
    }
  } catch (error) {
    if (error.code === 'ELOOP') {
      console.log(`ELOOP detected in ${directoryPath}. Removing directory.`);
      try {
        execSync(`rm -rf "${directoryPath}"`);
        console.log(`Successfully removed ${directoryPath}`);
      } catch (rmError) {
        console.log(`Error removing directory ${directoryPath}:`, rmError.message);
      }
    } else {
      console.error(`Error processing ${directoryPath}:`, error.message);
    }
  }
}

console.log('Starting to fix symlink issues...');
fixSymlinks(problematicPath);
console.log('Finished fixing symlink issues');
