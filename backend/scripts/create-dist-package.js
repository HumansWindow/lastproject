#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read original package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const distPackagePath = path.join(__dirname, '..', 'dist', 'package.json');

console.log(`Reading package.json from ${packagePath}`);
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Create a simplified version for the dist folder
const distPackage = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  private: true,
  engines: packageJson.engines,
  dependencies: packageJson.dependencies,
  scripts: {
    start: "node run.js",
  }
};

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Write the simplified package.json to dist folder
console.log(`Writing simplified package.json to ${distPackagePath}`);
fs.writeFileSync(distPackagePath, JSON.stringify(distPackage, null, 2));

console.log('Done creating dist package.json');
