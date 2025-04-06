/**
 * Script to install Jest type definitions
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing Jest type definitions...');

try {
  // Run the npm install command
  execSync('npm install --save-dev @types/jest', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('Successfully installed @types/jest');

  // Check if .gitignore exists and update it if needed
  const gitignorePath = path.resolve(__dirname, '..', '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('node_modules/@types/jest')) {
      gitignoreContent += '\n# Jest types\n!node_modules/@types/jest\n';
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('Updated .gitignore to preserve Jest types');
    }
  }
  
  console.log('Jest type definitions setup complete!');
} catch (error) {
  console.error('Failed to install Jest type definitions:', error);
  process.exit(1);
}
