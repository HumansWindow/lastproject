#!/usr/bin/env node

/**
 * API Endpoint Checker
 * 
 * This script verifies the accessibility of API endpoints in the application
 * and checks for mismatches between frontend and backend configurations.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { promisify } = require('util');
const { execSync } = require('child_process');

// Constants
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const API_ENDPOINTS = [
  // Health check endpoints
  'http://localhost:3001/health',
  'http://localhost:3001/api/health', 
  'http://localhost:3001/auth/wallet/health',
  'http://localhost:3000/auth/wallet/health',
  'http://localhost:3000/api/auth/wallet/health',
  'http://127.0.0.1:3001/auth/wallet/health',
  'http://127.0.0.1:3000/auth/wallet/health',
  
  // Auth endpoints
  'http://localhost:3001/auth/wallet/connect',
  'http://localhost:3000/auth/wallet/connect',
  'http://localhost:3000/api/auth/wallet/connect',
  'http://127.0.0.1:3001/auth/wallet/connect',
  'http://127.0.0.1:3000/auth/wallet/connect',
];

// Config file patterns to check
const CONFIG_FILES = [
  {
    pattern: path.join(FRONTEND_DIR, 'src', 'config', 'api.config.ts'),
    type: 'frontend'
  },
  {
    pattern: path.join(FRONTEND_DIR, '.env'),
    type: 'frontend-env'
  },
  {
    pattern: path.join(FRONTEND_DIR, '.env.local'),
    type: 'frontend-env'
  },
  {
    pattern: path.join(FRONTEND_DIR, '.env.development'),
    type: 'frontend-env'
  },
  {
    pattern: path.join(BACKEND_DIR, 'src', 'config', 'app.config.ts'),
    type: 'backend'
  },
  {
    pattern: path.join(BACKEND_DIR, '.env'),
    type: 'backend-env'
  },
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

/**
 * Print a formatted header
 */
function printHeader(text) {
  console.log(`\n${colors.bold}${colors.blue}=== ${text} ===${colors.reset}\n`);
}

/**
 * Make an HTTP request to the specified URL
 */
async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data: data.slice(0, 200) // Truncate long responses
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: null,
        success: false,
        error: error.message
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        url,
        status: null,
        success: false,
        error: 'Timeout'
      });
    });
  });
}

/**
 * Parse frontend environment files to extract API URL
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const config = {};
  
  for (const line of lines) {
    if (line.trim().startsWith('#') || !line.includes('=')) continue;
    
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    config[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes if present
  }
  
  return config;
}

/**
 * Check for API URL configuration in frontend files
 */
async function checkFrontendConfig() {
  printHeader('Checking Frontend API Configuration');
  
  const results = [];
  
  for (const configFile of CONFIG_FILES) {
    if (!fs.existsSync(configFile.pattern)) continue;
    
    console.log(`Found config file: ${configFile.pattern}`);
    
    if (configFile.type === 'frontend-env') {
      const envConfig = parseEnvFile(configFile.pattern);
      if (envConfig && envConfig.NEXT_PUBLIC_API_URL) {
        results.push({
          file: configFile.pattern,
          apiUrl: envConfig.NEXT_PUBLIC_API_URL,
          type: 'env'
        });
        console.log(`${colors.green}✓ API URL found:${colors.reset} ${envConfig.NEXT_PUBLIC_API_URL}`);
      }
    } else if (configFile.type === 'frontend') {
      const content = fs.readFileSync(configFile.pattern, 'utf-8');
      
      // Look for base API URL definitions
      const baseUrlMatches = content.match(/baseURL.*['"]([^'"]+)['"]/);
      if (baseUrlMatches) {
        results.push({
          file: configFile.pattern,
          apiUrl: baseUrlMatches[1],
          type: 'api-config'
        });
        console.log(`${colors.green}✓ Base URL found:${colors.reset} ${baseUrlMatches[1]}`);
      }
      
      // Look for wallet auth specific endpoints
      const walletAuthMatches = content.match(/walletAuth.*{([^}]+)}/s);
      if (walletAuthMatches) {
        const walletAuthConfig = walletAuthMatches[1];
        const connectMatch = walletAuthConfig.match(/connect.*['"]([^'"]+)['"]/);
        const authenticateMatch = walletAuthConfig.match(/authenticate.*['"]([^'"]+)['"]/);
        
        if (connectMatch) {
          console.log(`${colors.green}✓ Wallet connect endpoint:${colors.reset} ${connectMatch[1]}`);
        }
        
        if (authenticateMatch) {
          console.log(`${colors.green}✓ Wallet authenticate endpoint:${colors.reset} ${authenticateMatch[1]}`);
        }
      }
    }
  }
  
  return results;
}

/**
 * Check for API URL configuration in backend files
 */
async function checkBackendConfig() {
  printHeader('Checking Backend API Configuration');
  
  const results = [];
  
  for (const configFile of CONFIG_FILES) {
    if (!fs.existsSync(configFile.pattern)) continue;
    
    console.log(`Found config file: ${configFile.pattern}`);
    
    if (configFile.type === 'backend-env') {
      const envConfig = parseEnvFile(configFile.pattern);
      if (envConfig && envConfig.PORT) {
        results.push({
          file: configFile.pattern,
          port: envConfig.PORT,
          type: 'env'
        });
        console.log(`${colors.green}✓ Backend port:${colors.reset} ${envConfig.PORT}`);
      }
    }
  }
  
  return results;
}

/**
 * Check API endpoints for accessibility
 */
async function checkApiEndpoints() {
  printHeader('Checking API Endpoints');
  
  const results = [];
  
  for (const endpoint of API_ENDPOINTS) {
    console.log(`Testing endpoint: ${endpoint}`);
    const result = await checkEndpoint(endpoint);
    
    if (result.success) {
      console.log(`${colors.green}✓ SUCCESS${colors.reset} (${result.status}) - ${endpoint}`);
    } else {
      console.log(`${colors.red}✗ FAILED${colors.reset} - ${endpoint} - ${result.error || result.status}`);
    }
    
    results.push(result);
  }
  
  return results;
}

/**
 * Test a specific API endpoint with the right port
 */
async function testSpecificEndpoint(host, port, path) {
  const url = `http://${host}:${port}${path}`;
  console.log(`Testing specific endpoint: ${url}`);
  
  const result = await checkEndpoint(url);
  if (result.success) {
    console.log(`${colors.green}✓ SUCCESS${colors.reset} (${result.status}) - ${url}`);
  } else {
    console.log(`${colors.red}✗ FAILED${colors.reset} - ${url} - ${result.error || result.status}`);
  }
  
  return result;
}

/**
 * Check if services are running
 */
async function checkServices() {
  printHeader('Checking Services');
  
  try {
    console.log('Checking for running backend service...');
    const backendProcess = execSync('ps aux | grep "nest start" | grep -v grep', { encoding: 'utf-8' });
    console.log(`${colors.green}✓ Backend service is running${colors.reset}`);
    console.log(backendProcess.trim());
  } catch (error) {
    console.log(`${colors.red}✗ Backend service might not be running${colors.reset}`);
  }
  
  try {
    console.log('\nChecking for running frontend service...');
    const frontendProcess = execSync('ps aux | grep "next" | grep -v grep', { encoding: 'utf-8' });
    console.log(`${colors.green}✓ Frontend service is running${colors.reset}`);
    console.log(frontendProcess.trim());
  } catch (error) {
    console.log(`${colors.red}✗ Frontend service might not be running${colors.reset}`);
  }
}

/**
 * Generate a summary of tests and recommendations
 */
function generateSummary(frontendConfig, backendConfig, endpointResults) {
  printHeader('Summary and Recommendations');
  
  // Check if we found the API URL configuration
  if (frontendConfig.length > 0) {
    const apiUrl = frontendConfig[0].apiUrl;
    console.log(`${colors.green}✓ Frontend API URL:${colors.reset} ${apiUrl}`);
    
    // Check if the frontend API URL matches a working backend
    const apiUrlParts = new URL(apiUrl);
    const apiHost = apiUrlParts.hostname;
    const apiPort = apiUrlParts.port;
    
    // Check if the API endpoint with this configuration is accessible
    const matchingResults = endpointResults.filter(r => 
      r.url.includes(apiHost) && r.url.includes(`:${apiPort}`)
    );
    
    if (matchingResults.some(r => r.success)) {
      console.log(`${colors.green}✓ API server is accessible at configured URL${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ API server is NOT accessible at configured URL${colors.reset}`);
      console.log(`  Recommendation: Check if the backend is running on ${apiHost}:${apiPort}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ No frontend API URL configuration found${colors.reset}`);
  }
  
  // Check if wallet auth endpoints are accessible
  const walletAuthResults = endpointResults.filter(r => r.url.includes('/auth/wallet/'));
  const successfulWalletAuth = walletAuthResults.filter(r => r.success);
  
  if (successfulWalletAuth.length > 0) {
    console.log(`${colors.green}✓ Wallet auth endpoints are accessible:${colors.reset}`);
    successfulWalletAuth.forEach(r => {
      console.log(`  - ${r.url} (${r.status})`);
    });
  } else {
    console.log(`${colors.red}✗ No wallet auth endpoints are accessible${colors.reset}`);
    console.log(`  Recommendation: Check the wallet auth controller and routes`);
  }
  
  // Check if there's a mismatch between frontend API URL and working endpoints
  const workingEndpoints = endpointResults.filter(r => r.success);
  if (workingEndpoints.length > 0 && frontendConfig.length > 0) {
    const apiUrl = frontendConfig[0].apiUrl;
    const apiPort = new URL(apiUrl).port;
    
    const workingPorts = new Set(workingEndpoints.map(r => {
      const url = new URL(r.url);
      return url.port;
    }));
    
    if (!workingPorts.has(apiPort)) {
      console.log(`${colors.yellow}⚠ Possible API port mismatch!${colors.reset}`);
      console.log(`  Frontend is configured to use port ${apiPort}, but working endpoints were found on ports:`);
      workingPorts.forEach(port => {
        console.log(`  - ${port}`);
      });
      console.log(`\n  Recommendation: Update frontend configuration to match working backend port`);
    }
  }
  
  // Final recommendations
  printHeader('Next Steps');
  
  // Check if we found successful health endpoints but auth/wallet endpoints failed
  const healthEndpoints = endpointResults.filter(r => r.url.includes('/health'));
  const successfulHealth = healthEndpoints.filter(r => r.success);
  
  if (successfulHealth.length > 0 && successfulWalletAuth.length === 0) {
    console.log(`${colors.yellow}1. Add a health endpoint to the WalletAuthController:${colors.reset}`);
    console.log(`   We've already added this for you by adding the 'health' endpoint in wallet-auth.controller.ts`);
    console.log(`   Make sure to restart the backend service for changes to take effect.`);
  }
  
  console.log(`${colors.yellow}2. Check API URL configuration:${colors.reset}`);
  console.log(`   Frontend should be configured to connect to the correct backend port.`);
  
  if (frontendConfig.length > 0) {
    const apiUrl = frontendConfig[0].apiUrl;
    console.log(`   Current setting: ${apiUrl}`);
  }
  
  console.log(`\n${colors.yellow}3. Ensure controllers have proper routing paths:${colors.reset}`);
  console.log(`   The WalletAuthController should be accessible at /auth/wallet prefix`);
  
  console.log(`\n${colors.yellow}4. Restart services:${colors.reset}`);
  console.log(`   After making changes, restart both frontend and backend services:`);
  console.log(`   - Backend: cd backend && npm run start:dev`);
  console.log(`   - Frontend: cd frontend && npm run dev`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(`${colors.bold}${colors.magenta}API Endpoint Checker${colors.reset}`);
    console.log(`This utility checks the accessibility of API endpoints and validates configuration.`);
    
    // Check service status
    await checkServices();
    
    // Check frontend configuration
    const frontendConfig = await checkFrontendConfig();
    
    // Check backend configuration
    const backendConfig = await checkBackendConfig();
    
    // Check API endpoints
    const endpointResults = await checkApiEndpoints();
    
    // If frontend config is available, test with the configured URL
    if (frontendConfig.length > 0) {
      const apiUrl = frontendConfig[0].apiUrl;
      const apiUrlParts = new URL(apiUrl);
      const apiHost = apiUrlParts.hostname;
      const apiPort = apiUrlParts.port;
      
      printHeader(`Testing with Frontend Config: ${apiHost}:${apiPort}`);
      
      await testSpecificEndpoint(apiHost, apiPort, '/health');
      await testSpecificEndpoint(apiHost, apiPort, '/auth/wallet/health');
      await testSpecificEndpoint(apiHost, apiPort, '/auth/wallet/connect');
    }
    
    // Generate summary and recommendations
    generateSummary(frontendConfig, backendConfig, endpointResults);
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main();