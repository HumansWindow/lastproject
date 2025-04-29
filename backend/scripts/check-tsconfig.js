#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const stripJsonComments = require('strip-json-comments');

try {
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    // Read the raw content
    const rawContent = fs.readFileSync(tsconfigPath, 'utf8');
    console.log('Raw tsconfig.json:');
    console.log('------------------');
    console.log(rawContent);
    console.log('------------------\n');
    
    try {
      // Try to parse using strip-json-comments (we'll need to install this)
      console.log('Installing strip-json-comments...');
      require('child_process').execSync('npm install --no-save strip-json-comments');
      
      const strippedContent = stripJsonComments(rawContent);
      const tsconfig = JSON.parse(strippedContent);
      
      console.log('Parsed tsconfig.json:');
      console.log(JSON.stringify(tsconfig, null, 2));
    } catch (parseError) {
      console.error(`Error parsing tsconfig.json: ${parseError.message}`);
      
      // Let's try to manually strip comments and parse
      console.log('\nAttempting manual comment removal...');
      const noComments = rawContent
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '');
      
      try {
        const manualParsed = JSON.parse(noComments);
        console.log('Successfully parsed after manual comment removal:');
        console.log(JSON.stringify(manualParsed, null, 2));
      } catch (manualError) {
        console.error(`Manual parsing also failed: ${manualError.message}`);
      }
    }
  } else {
    console.log('tsconfig.json does not exist');
  }
} catch (error) {
  console.error(`Error reading tsconfig.json: ${error.message}`);
}
