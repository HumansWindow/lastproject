#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function listDirectoryContents(directory, indent = '') {
  try {
    if (!fs.existsSync(directory)) {
      console.log(`Directory ${directory} does not exist`);
      return;
    }
    
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        console.log(`${indent}📁 ${file}/`);
        listDirectoryContents(fullPath, indent + '  ');
      } else {
        console.log(`${indent}📄 ${file} (${stat.size} bytes)`);
        
        // For main.js files, print some content to verify
        if (file === 'main.js') {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            console.log(`${indent}   First 100 chars: ${content.substring(0, 100).replace(/\n/g, ' ')}...`);
          } catch (err) {
            console.log(`${indent}   Could not read file: ${err.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
  }
}

console.log('Contents of the dist directory:');
listDirectoryContents(path.join(__dirname, 'dist'));

// Additional check to see if app.module.js is in dist/src/app/
const appModulePath = path.join(__dirname, 'dist', 'src', 'app', 'app.module.js');
console.log(`\nChecking for app.module.js at: ${appModulePath}`);
console.log(`Exists: ${fs.existsSync(appModulePath)}`);

// Check if src folder exists in dist
const srcPath = path.join(__dirname, 'dist', 'src');
console.log(`\nChecking for src folder at: ${srcPath}`);
console.log(`Exists: ${fs.existsSync(srcPath)}`);
