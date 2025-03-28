/**
 * This script ensures config is properly loaded before accessing values
 */
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Load configuration from environment files and validate
 * key configuration parameters are present
 */
function loadConfig() {
  console.log('Loading environment configuration...');
  
  // Find and load .env file
  const envPath = path.resolve(process.cwd(), '.env');
  let loaded = false;
  
  if (fs.existsSync(envPath)) {
    console.log(`Found .env at ${envPath}`);
    dotenv.config({ path: envPath });
    loaded = true;
  } else {
    // Try parent directory if we're in dist
    const parentEnvPath = path.resolve(process.cwd(), '..', '.env');
    if (fs.existsSync(parentEnvPath)) {
      console.log(`Found .env at ${parentEnvPath}`);
      dotenv.config({ path: parentEnvPath });
      loaded = true;
    }
  }
  
  if (!loaded) {
    console.warn('No .env file found. Using environment variables only.');
  }
  
  // Check required environment variables
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'PORT'
  ];
  
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing required environment variables: ${missingVars.join(', ')}`);
    
    // Set defaults for missing variables
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = 'development-jwt-secret-key-do-not-use-in-production';
      console.warn('Using default JWT_SECRET (NOT SECURE FOR PRODUCTION)');
    }
    
    if (!process.env.PORT) {
      process.env.PORT = '3000';
      console.warn('Using default PORT: 3000');
    }
    
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = 'postgres://Aliveadmin:password@localhost:5432/Alive-Db';
      console.warn('Using default DATABASE_URL (modify as needed)');
    }
  }
  
  console.log('Configuration loaded successfully');
  
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    // Add other config values as needed
  };
}

module.exports = { loadConfig };
