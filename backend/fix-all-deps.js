const fs = require('fs');
const path = require('path');

console.log('Starting application setup...');

// Fix dependencies directly
console.log('Fixing dependency issues directly...');

// Fix schedule explorer for the syntax error only
try {
  const scheduleExplorerPath = path.join(__dirname, 'node_modules/@nestjs/schedule/dist/schedule.explorer.js');
  
  if (fs.existsSync(scheduleExplorerPath)) {
    console.log('Checking schedule.explorer.js...');
    const content = fs.readFileSync(scheduleExplorerPath, 'utf-8');
    
    if (content.includes('const instanceWrappers = [')) {
      const modifiedContent = content.replace('const instanceWrappers = [', 'var instanceWrappers = [');
      fs.writeFileSync(scheduleExplorerPath, modifiedContent, 'utf-8');
      console.log('Fixed variable declaration in schedule.explorer.js');
    } else {
      console.log('No issues found in schedule.explorer.js');
    }
  } else {
    console.log('schedule.explorer.js not found');
  }
} catch (error) {
  console.error('Error modifying schedule explorer:', error.message);
}

// Create temporary fixes for module issues
console.log('Creating temporary fixes for module issues...');

// Fix InstanceLinksHost
try {
  const instanceLinksHostPath = path.join(__dirname, 'node_modules/@nestjs/core/injector/instance-links-host.js');
  
  if (fs.existsSync(instanceLinksHostPath)) {
    console.log('Checking instance-links-host.js...');
    const content = fs.readFileSync(instanceLinksHostPath, 'utf-8');
    
    // Fix potential undefined property access
    if (content.includes('if (!wrapper.id) {')) {
      const modifiedContent = content.replace('if (!wrapper.id) {', 'if (!wrapper || !wrapper.id) {');
      fs.writeFileSync(instanceLinksHostPath, modifiedContent, 'utf-8');
      console.log('Fixed wrapper check in instance-links-host.js');
    } else {
      console.log('No issues found in instance-links-host.js');
    }
  } else {
    console.log('instance-links-host.js not found');
  }
} catch (error) {
  console.error('Error fixing InstanceLinksHost:', error.message);
}

// Create CORS config file if it doesn't exist
try {
  const corsConfigDir = path.join(__dirname, 'src/shared/config');
  const corsConfigPath = path.join(corsConfigDir, 'cors.config.ts');
  
  if (!fs.existsSync(corsConfigDir)) {
    fs.mkdirSync(corsConfigDir, { recursive: true });
  }
  
  if (!fs.existsSync(corsConfigPath)) {
    console.log('Creating CORS config file...');
    const corsConfigContent = `import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * CORS configuration for the application
 * Adjusts allowed origins based on environment
 */
export const getCorsConfig = (): CorsOptions => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://alivehuman.com',
        'https://app.alivehuman.com',
        // Add other production domains as needed
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Add other development domains as needed
      ];

  return {
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};`;
    fs.writeFileSync(corsConfigPath, corsConfigContent, 'utf-8');
    console.log('CORS config file created');
  }
} catch (error) {
  console.error('Error creating CORS config file:', error.message);
}

console.log('NestJS compatibility fixes applied.');
