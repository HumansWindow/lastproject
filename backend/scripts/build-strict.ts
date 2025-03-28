import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Determine if we're running in production mode
const isProd = process.env.NODE_ENV === 'production';

// File patterns to exclude from strict type checking
const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/__tests__/**', // Exclude all test files
  '**/*.spec.ts',    // Exclude spec files
  '**/*.test.ts'     // Exclude test files
];

// Create a temporary tsconfig that extends the base but excludes tests
const tempTsConfigPath = path.join(__dirname, '..', 'tsconfig.build.json');
const baseTsConfigPath = path.join(__dirname, '..', 'tsconfig.json');

// Read the base tsconfig
const baseConfig = JSON.parse(fs.readFileSync(baseTsConfigPath, 'utf8'));

// Create a new config for building
const buildConfig = {
  ...baseConfig,
  compilerOptions: {
    ...baseConfig.compilerOptions,
    skipLibCheck: true,
  },
  exclude: [...(baseConfig.exclude || []), ...excludePatterns],
  include: ['src/**/*.ts'],
};

// Write the temporary config
fs.writeFileSync(tempTsConfigPath, JSON.stringify(buildConfig, null, 2));

console.log('Created temporary build config:', tempTsConfigPath);

// Execute TypeScript compiler with the temporary config
const tscCommand = `npx tsc -p ${tempTsConfigPath} --skipLibCheck --pretty --listEmittedFiles`;

console.log(`Executing: ${tscCommand}`);
exec(tscCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`TypeScript compilation error: ${error.message}`);
    process.exit(1);
  }
  
  console.log(stdout);
  if (stderr) {
    console.error(stderr);
  }
  
  // Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Copy package.json and install dependencies in dist folder
  console.log('Copying package.json to dist...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  // Remove dev dependencies for production build
  if (isProd) {
    delete packageJson.devDependencies;
  }
  
  // Remove problematic scripts like postinstall that reference build.sh
  if (packageJson.scripts && packageJson.scripts.postinstall) {
    delete packageJson.scripts.postinstall;
  }
  
  // Add simple start script that uses run.js
  packageJson.scripts = {
    ...packageJson.scripts,
    start: "node run.js"
  };
  
  // Write the package.json to dist
  fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  
  // Copy .env file if exists
  try {
    if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
      fs.copyFileSync(path.join(__dirname, '..', '.env'), path.join(distDir, '.env'));
      console.log('Copied .env file to dist');
    }
  } catch (err) {
    console.warn('Warning: Could not copy .env file:', err.message);
  }
  
  // Create the run.js entry point with the CORRECT path to main.js
  const runJsPath = path.join(distDir, 'run.js');
  fs.writeFileSync(runJsPath, `
require('dotenv').config();
require('reflect-metadata');
require('source-map-support').install();
try {
  require('./main.js');  // Changed from './src/main.js' to './main.js'
} catch (error) {
  console.error('Failed to load main.js:');
  console.error(error);
}
  `.trim());
  
  console.log('Created run.js entry point');
  
  // Create a script to install dependencies in dist
  const installScript = path.join(distDir, 'install-deps.js');
  fs.writeFileSync(installScript, `
const { execSync } = require('child_process');
console.log('Installing dependencies...');
try {
  // First install critical dependencies needed for startup
  execSync('npm install dotenv reflect-metadata source-map-support', { stdio: 'inherit' });
  // Then install the rest
  execSync('npm install --omit=dev', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');
} catch (error) {
  console.error('Failed to install dependencies:', error.message);
  process.exit(1);
}
  `.trim());
  
  // Clean up the temporary file after successful build
  fs.unlinkSync(tempTsConfigPath);
  console.log('Build completed successfully!');
  
  // Optional: Automatically install dependencies in dist directory
  if (process.argv.includes('--install-deps')) {
    console.log('Installing dependencies in dist directory...');
    try {
      process.chdir(distDir);
      execSync('node install-deps.js', { stdio: 'inherit' });
      console.log('Dependencies installed successfully!');
    } catch (error) {
      console.error('Failed to install dependencies:', error.message);
    }
    process.chdir(path.join(__dirname, '..'));
  } else {
    console.log('\n=== IMPORTANT ===');
    console.log('To complete setup, run:');
    console.log('cd dist && node install-deps.js');
    console.log('Then start the app with:');
    console.log('node run.js');
    console.log('===============\n');
  }
});
