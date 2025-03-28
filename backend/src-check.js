#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkAppStructure() {
  const srcDir = path.join(__dirname, 'src');
  
  console.log('Checking Nest.js application structure...');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ ERROR: src directory does not exist!');
    return;
  }
  
  const mainFile = path.join(srcDir, 'main.ts');
  if (!fs.existsSync(mainFile)) {
    console.error('❌ ERROR: main.ts does not exist at root of src directory!');
  } else {
    console.log('✅ Found main.ts at correct location');
    
    // Read main.ts content
    const mainContent = fs.readFileSync(mainFile, 'utf8');
    console.log('\nContent of main.ts:');
    console.log('------------------');
    console.log(mainContent);
    console.log('------------------');
    
    // Check if AppModule is being imported
    const appModuleMatch = mainContent.match(/import\s+{\s*AppModule\s*}\s+from\s+['"](.+)['"]/);
    if (appModuleMatch) {
      const importPath = appModuleMatch[1];
      console.log(`AppModule imported from: ${importPath}`);
      
      // Check if AppModule file exists
      let appModulePath;
      if (importPath.startsWith('./')) {
        appModulePath = path.join(srcDir, importPath.substring(2) + '.ts');
      } else if (importPath.startsWith('/')) {
        appModulePath = path.join(srcDir, importPath.substring(1) + '.ts');
      } else {
        appModulePath = path.join(srcDir, importPath + '.ts');
      }
      
      if (fs.existsSync(appModulePath)) {
        console.log(`✅ AppModule file exists at: ${appModulePath}`);
      } else {
        console.error(`❌ ERROR: AppModule file does not exist at: ${appModulePath}`);
        console.log('Looking for app.module.ts files:');
        findFile(srcDir, 'app.module.ts');
      }
    } else {
      console.error('❌ ERROR: Could not find AppModule import in main.ts');
    }
  }
  
  console.log('\nChecking NestJS module structure:');
  // Check for standard NestJS modules
  checkModule(srcDir, 'app');
  checkModule(srcDir, 'auth');
  checkModule(srcDir, 'users');
  
  console.log('\nMaking sure tsconfig paths align with directory structure:');
  // Check the paths in the tsconfig match actual directory structure
  try {
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8').replace(/\/\/.*$/gm, ''));
    
    if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
      const paths = tsconfig.compilerOptions.paths;
      
      for (const alias in paths) {
        const targetPath = paths[alias][0].replace('/*', '');
        const fullPath = path.join(__dirname, targetPath);
        
        console.log(`Checking path alias ${alias} -> ${targetPath}`);
        if (fs.existsSync(fullPath)) {
          console.log(`✅ Path exists: ${fullPath}`);
        } else {
          console.error(`❌ Path does not exist: ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error checking tsconfig paths: ${error.message}`);
  }
}

// Check if a NestJS module exists
function checkModule(srcDir, moduleName) {
  const moduleDir = path.join(srcDir, moduleName);
  if (fs.existsSync(moduleDir)) {
    console.log(`✅ Found ${moduleName} module directory`);
    
    // Check for key module files
    checkFile(moduleDir, `${moduleName}.module.ts`);
    checkFile(moduleDir, `${moduleName}.controller.ts`);
    checkFile(moduleDir, `${moduleName}.service.ts`);
  } else {
    console.log(`❓ ${moduleName} module directory not found (might be intentional)`);
  }
}

// Check if a file exists in a directory
function checkFile(directory, filename) {
  const filePath = path.join(directory, filename);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ Found ${filename}`);
  } else {
    console.log(`  ❓ ${filename} not found (might be intentional)`);
  }
}

// Find a file recursively
function findFile(dir, filename) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findFile(fullPath, filename);
      } else if (file === filename) {
        console.log(`Found at: ${fullPath}`);
      }
    }
  } catch (error) {
    console.error(`Error searching in ${dir}: ${error.message}`);
  }
}

checkAppStructure();
