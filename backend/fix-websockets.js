const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing module compatibility issues...');

// Fix Socket.io version conflicts
try {
  console.log('Installing compatible versions of socket.io packages...');
  
  // Use npm to install compatible versions
  execSync('npm uninstall socket.io socket.io-client @nestjs/platform-socket.io && ' +
           'npm install socket.io@4.5.4 socket.io-client@4.5.4 @nestjs/platform-socket.io@9.4.0 --save', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error resolving Socket.io dependencies:', error);
}

// Fix MetadataScanner bug in NestJS 9.x
function patchMetadataScanner() {
  try {
    console.log('Patching metadata scanner...');
    const scannerPath = path.join(__dirname, 'node_modules/@nestjs/core/metadata-scanner/metadata-scanner.js');
    
    if (!fs.existsSync(scannerPath)) {
      console.error('MetadataScanner file not found');
      return;
    }
    
    let content = fs.readFileSync(scannerPath, 'utf8');
    
    // Add proper prototype checks to prevent crashes with Symbol.iterator
    const patched = content.replace(
      'getAllMethodNames(prototype) {',
      'getAllMethodNames(prototype) {\n' +
      '    if (!prototype) return [];\n' +
      '    if (typeof prototype !== "object") return [];'
    );
    
    fs.writeFileSync(scannerPath, patched);
    console.log('MetadataScanner patched successfully.');
  } catch (error) {
    console.error('Error patching MetadataScanner:', error);
  }
}

// Fix GatewayMetadataExplorer
function patchGatewayMetadataExplorer() {
  try {
    console.log('Patching GatewayMetadataExplorer...');
    const explorerPath = path.join(__dirname, 'node_modules/@nestjs/websockets/explorer/gateway-metadata-explorer.js');
    
    if (!fs.existsSync(explorerPath)) {
      console.log('GatewayMetadataExplorer file not found.');
      return;
    }
    
    let content = fs.readFileSync(explorerPath, 'utf8');
    
    // Fix property accesses on potentially undefined objects
    const patched = content.replace(
      'obj && obj.constructor && obj.constructor.name',
      '(obj && typeof obj === "object" && obj.constructor && obj.constructor.name)'
    );
    
    fs.writeFileSync(explorerPath, patched);
    console.log('GatewayMetadataExplorer patched successfully.');
  } catch (error) {
    console.error('Error patching GatewayMetadataExplorer:', error);
  }
}

// Fix issues with InstanceLinksHost
function patchInstanceLinksHost() {
  try {
    console.log('Fixing InstanceLinksHost...');
    const filePath = path.join(__dirname, 'node_modules/@nestjs/core/injector/instance-links-host.js');
    
    if (!fs.existsSync(filePath)) {
      console.error('InstanceLinksHost file not found');
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix undefined access issues
    const patched = content.replace(
      'if (!wrapper.id) {',
      'if (!wrapper || !wrapper.id) {'
    );
    
    fs.writeFileSync(filePath, patched);
    console.log('InstanceLinksHost patched successfully.');
  } catch (error) {
    console.error('Error patching InstanceLinksHost:', error);
  }
}

// Fix ScheduleExplorer issues
function patchScheduleExplorer() {
  try {
    console.log('Patching ScheduleExplorer...');
    const filePath = path.join(__dirname, 'node_modules/@nestjs/schedule/dist/schedule.explorer.js');
    
    if (!fs.existsSync(filePath)) {
      console.error('ScheduleExplorer file not found');
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix variable declaration error by changing const to var
    content = content.replace(
      'const instanceWrappers = [',
      'var instanceWrappers = ['
    );
    
    fs.writeFileSync(filePath, content);
    console.log('ScheduleExplorer patched successfully.');
  } catch (error) {
    console.error('Error patching ScheduleExplorer:', error);
  }
}

// Run patches
patchMetadataScanner();
patchGatewayMetadataExplorer();
patchInstanceLinksHost();
patchScheduleExplorer();

console.log('Module compatibility fixes applied.');
