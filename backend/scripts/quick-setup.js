/**
 * This script sets up the dist directory without TypeScript compilation
 * Useful when you want to test with existing compiled files
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up dist directory without TypeScript compilation...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
} else {
  console.log('Dist directory already exists');
}

// Create run.js with proper error handling
const runJsPath = path.join(distDir, 'run.js');
const runJsContent = `
try {
  require('dotenv').config();
} catch (error) {
  console.warn('Failed to load dotenv:', error.message);
  console.warn('Environment variables may not be properly loaded.');
}

try {
  require('reflect-metadata');
} catch (error) {
  console.warn('Failed to load reflect-metadata:', error.message);
  console.warn('Installing missing dependency...');
  try {
    require('child_process').execSync('npm install reflect-metadata --no-save', { stdio: 'inherit' });
    require('reflect-metadata');
    console.log('Successfully installed and loaded reflect-metadata.');
  } catch (installError) {
    console.error('Failed to install reflect-metadata:', installError.message);
    console.error('Application may not function correctly.');
  }
}

try {
  require('source-map-support').install();
} catch (error) {
  console.warn('Failed to load source-map-support:', error.message);
  console.warn('Installing missing dependency...');
  try {
    require('child_process').execSync('npm install source-map-support --no-save', { stdio: 'inherit' });
    require('source-map-support').install();
    console.log('Successfully installed and loaded source-map-support.');
  } catch (installError) {
    console.error('Failed to install source-map-support:', installError.message);
    console.error('Source maps will not be available for error reporting.');
  }
}

try {
  require('./main.js');
} catch (error) {
  console.error('Failed to load main.js:');
  console.error(error);
}
`.trim();

fs.writeFileSync(runJsPath, runJsContent);
console.log('Created run.js');

// Copy .env file if exists
try {
  const envPath = path.join(__dirname, '..', '.env');
  const distEnvPath = path.join(distDir, '.env');
  
  if (fs.existsSync(envPath) && !fs.existsSync(distEnvPath)) {
    fs.copyFileSync(envPath, distEnvPath);
    console.log('Copied .env file to dist');
  }
} catch (err) {
  console.warn('Warning: Could not copy .env file:', err.message);
}

// Create package.json for dist
const packageJsonPath = path.join(distDir, 'package.json');
const packageJsonContent = {
  "name": "alivehuman-backend-dist",
  "version": "0.1.0",
  "description": "Compiled version of AliveHuman Backend Application",
  "private": true,
  "license": "UNLICENSED",
  "dependencies": {
    "@nestjs/common": "^9.4.3",
    "@nestjs/config": "^2.3.1",
    "@nestjs/core": "^9.4.3",
    "@nestjs/event-emitter": "^2.0.0",
    "@nestjs/jwt": "^10.0.3",
    "@nestjs/passport": "^9.0.3",
    "@nestjs/platform-express": "^9.4.3",
    "@nestjs/platform-socket.io": "^9.4.3",
    "@nestjs/schedule": "^3.0.1",
    "@nestjs/swagger": "^6.3.0",
    "@nestjs/typeorm": "^9.0.1",
    "@nestjs/websockets": "^9.4.3",
    "dotenv": "^16.0.3",
    "reflect-metadata": "^0.1.13",
    "source-map-support": "^0.5.21"
  },
  "scripts": {
    "start": "node run.js"
  }
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
console.log('Created package.json in dist');

// Install core dependencies
console.log('Installing core dependencies...');
try {
  execSync('cd dist && npm install dotenv reflect-metadata source-map-support', { 
    stdio: 'inherit',
    env: { ...process.env, SKIP_POSTINSTALL: "true" }
  });
  console.log('Core dependencies installed');
} catch (error) {
  console.error('Failed to install core dependencies:', error.message);
}

console.log('\nSetup complete. You can now run:');
console.log('node start-app.js');
