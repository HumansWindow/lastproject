/**
 * This script helps fix nested node_modules issues by removing duplicate
 * NestJS dependencies that could cause module resolution problems
 */
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

console.log('Checking for nested @nestjs dependencies in node_modules...');

// Get the root node_modules directory
const rootNodeModules = path.resolve(__dirname, '..', 'node_modules');
const nestModules = path.join(rootNodeModules, '@nestjs');

// Check if root @nestjs modules exist and remove them
if (fs.existsSync(nestModules)) {
  console.log('Found @nestjs modules in root node_modules. Removing...');
  rimraf.sync(nestModules);
  console.log('@nestjs modules in root node_modules removed.');
}

// Check for nested node_modules inside the backend node_modules
const backendNodeModules = path.resolve(__dirname, 'node_modules');
const nestedModules = [];

function findNestedNodeModules(dir, depth = 0) {
  if (depth > 3) return; // Limit search depth
  
  try {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      
      if (fs.statSync(fullPath).isDirectory()) {
        if (entry === 'node_modules') {
          nestedModules.push(fullPath);
        } else if (entry !== '.bin' && entry !== '.cache') {
          findNestedNodeModules(fullPath, depth + 1);
        }
      }
    }
  } catch (err) {
    // Skip permission errors or other issues
  }
}

findNestedNodeModules(backendNodeModules);

console.log(`Found ${nestedModules.length} nested node_modules directories.`);

// Check nested node_modules for @nestjs modules and remove them
nestedModules.forEach(nestedModuleDir => {
  const nestedNestModules = path.join(nestedModuleDir, '@nestjs');
  
  if (fs.existsSync(nestedNestModules)) {
    console.log(`Removing nested @nestjs modules in: ${nestedModuleDir}`);
    rimraf.sync(nestedNestModules);
  }
});

console.log('Nested module cleanup complete!');
