#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if main.ts exists and show the file structure
function checkSourceFiles() {
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('ERROR: src directory does not exist!');
    return;
  }
  
  console.log('Source directory structure:');
  listFiles(srcDir);
  
  const mainPath = path.join(srcDir, 'main.ts');
  
  if (fs.existsSync(mainPath)) {
    console.log('\n✅ Found main.ts at correct location');
    
    // Print the content of main.ts
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    console.log('\nContent of main.ts:');
    console.log('------------------');
    console.log(mainContent);
    console.log('------------------');
    
    // Check the import path for AppModule
    const appModuleMatch = mainContent.match(/import\s+{\s*AppModule\s*}\s+from\s+['"](.+)['"]/);
    if (appModuleMatch) {
      const importPath = appModuleMatch[1];
      console.log(`\nAppModule is imported from: ${importPath}`);
      
      // Check if the referenced file exists
      const appModuleRelativePath = importPath + '.ts';
      const appModuleFullPath = path.join(srcDir, appModuleRelativePath);
      
      if (fs.existsSync(appModuleFullPath)) {
        console.log(`✅ AppModule file exists at: ${appModuleFullPath}`);
      } else {
        console.error(`❌ ERROR: AppModule file does not exist at: ${appModuleFullPath}`);
        console.log('Looking for app.module.ts files:');
        findFile(srcDir, 'app.module.ts');
      }
    } else {
      console.error('❌ Could not identify AppModule import path in main.ts');
    }
  } else {
    console.error('❌ ERROR: main.ts not found at expected location!');
    console.log('Looking for main.ts files:');
    findFile(srcDir, 'main.ts');
  }
}

// List files in directory recursively
function listFiles(dir, indent = '') {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listFiles(fullPath, indent + '  ');
    } else {
      console.log(`${indent}📄 ${item}`);
    }
  }
}

// Find a file by name recursively
function findFile(dir, filename) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findFile(fullPath, filename);
      } else if (item === filename) {
        console.log(`Found at: ${fullPath}`);
      }
    }
  } catch (error) {
    console.error(`Error searching in ${dir}: ${error.message}`);
  }
}

checkSourceFiles();
