const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Updating dependencies...');

// Function to safely execute commands
function safeExec(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${errorMessage}:`, error.message);
    return false;
  }
}

// Install required dependencies specifically with proper typings
safeExec('npm install cookie-parser @types/cookie-parser --save', 
  'Failed to install cookie-parser');

safeExec('npm install express-session @types/express-session --save',
  'Failed to install express-session');

// Update tsconfig to ensure proper imports
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Ensure esModuleInterop is true for proper imports
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }
    
    tsconfig.compilerOptions.esModuleInterop = true;
    
    // Write updated tsconfig back
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('Updated tsconfig.json for proper imports');
  } catch (error) {
    console.error('Failed to update tsconfig.json:', error.message);
  }
}

// Create a patch for main.ts to ensure cookie-parser is imported correctly
const maintsContent = `
// This is a patch for main.ts to fix cookie-parser import
// To apply this patch, run: node apply-main-patch.js
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// Fix: Import cookie-parser properly
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Rest of main.ts...
`;

fs.writeFileSync(path.join(__dirname, 'main.ts.patch'), maintsContent);
console.log('Created main.ts patch file. To apply, modify your main.ts file.');

console.log('Dependencies update complete.');
console.log('Next steps:');
console.log('1. Run: node clean.js');
console.log('2. Run: npm run build');
console.log('3. Run: npm run start:local');
