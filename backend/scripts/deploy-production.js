#!/usr/bin/env node

/**
 * A script to deploy the application to production environment
 * This ensures proper environment variables are used
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production deployment...');

// Ensure we're in the project root directory
process.chdir(path.join(__dirname, '..'));

// Check if .env.production exists
const envProductionPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envProductionPath)) {
  console.error('❌ Production environment file (.env.production) not found!');
  console.error('Please create this file with your production settings.');
  process.exit(1);
}

// Build the application using production settings
console.log('📦 Building application with production settings...');
try {
  // Copy production env to .env for the build process
  fs.copyFileSync(envProductionPath, path.join(__dirname, '..', '.env'));
  console.log('✅ Copied production environment variables');

  // Set NODE_ENV for the build
  process.env.NODE_ENV = 'production';
  
  // Build the application
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
  
  // Copy the production .env to dist
  fs.copyFileSync(envProductionPath, path.join(__dirname, '..', 'dist', '.env'));
  console.log('✅ Copied production environment to dist');

  // Install production dependencies
  console.log('📦 Installing production dependencies...');
  execSync('cd dist && npm install --omit=dev', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
  
  console.log('🎉 Deployment prepared successfully!');
  console.log('\nTo start the application in production mode:');
  console.log('cd dist && node run.js');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
