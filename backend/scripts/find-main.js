#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively search for main.js in the dist directory
function findMainJs(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const result = findMainJs(fullPath);
      if (result) return result;
    } else if (file === 'main.js') {
      console.log(`Found main.js at: ${fullPath}`);
      return fullPath;
    }
  }
  
  return null;
}

const distDir = path.join(__dirname, 'dist');
const mainJsPath = findMainJs(distDir);

if (!mainJsPath) {
  console.error('Could not find main.js in the dist directory');
  process.exit(1);
}
