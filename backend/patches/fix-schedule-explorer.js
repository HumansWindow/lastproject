const fs = require('fs');
const path = require('path');

/**
 * This script fixes the syntax error in @nestjs/schedule/dist/schedule.explorer.js
 */
function fixScheduleExplorer() {
  try {
    console.log('Fixing schedule.explorer.js...');
    const filePath = path.resolve(__dirname, '../node_modules/@nestjs/schedule/dist/schedule.explorer.js');
    
    if (!fs.existsSync(filePath)) {
      console.log('schedule.explorer.js not found, skipping fix');
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if the file has the problematic code
    if (content.includes('const instanceWrappers = [')) {
      // Fix the syntax error by ensuring proper variable declaration
      content = content.replace(
        'const instanceWrappers = [',
        'var instanceWrappers = ['
      );
      
      // Write the fixed content back
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Successfully fixed schedule.explorer.js');
      return true;
    } else {
      console.log('No issues found in schedule.explorer.js');
      return false;
    }
  } catch (error) {
    console.error('Error fixing schedule.explorer.js:', error);
    return false;
  }
}

// Run the fix
fixScheduleExplorer();
