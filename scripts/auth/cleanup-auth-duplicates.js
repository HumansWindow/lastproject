#!/usr/bin/env node
/**
 * Authentication System Cleanup Script
 * 
 * This script identifies and removes duplicate files in the authentication system
 * while ensuring backward compatibility through the existing compatibility layers.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backup', 'auth-files-backup');

/**
 * Log with formatting and colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'success':
      console.log(`${COLORS.green}[${timestamp}] ✅ ${message}${COLORS.reset}`);
      break;
    case 'error':
      console.log(`${COLORS.red}[${timestamp}] ❌ ${message}${COLORS.reset}`);
      break;
    case 'warn':
      console.log(`${COLORS.yellow}[${timestamp}] ⚠️ ${message}${COLORS.reset}`);
      break;
    case 'step':
      console.log(`${COLORS.cyan}[${timestamp}] 🔄 ${message}${COLORS.reset}`);
      break;
    case 'info':
    default:
      console.log(`${COLORS.blue}[${timestamp}] ℹ️ ${message}${COLORS.reset}`);
  }
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'info');
  }
}

/**
 * Backup a file before removing it
 */
function backupFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'warn');
    return false;
  }
  
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  
  ensureDir(path.dirname(backupPath));
  fs.copyFileSync(filePath, backupPath);
  log(`Backed up: ${relativePath} → ${backupPath}`, 'info');
  return true;
}

/**
 * Remove a file with backup
 */
function removeFile(filePath, withBackup = true) {
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'warn');
    return false;
  }
  
  if (withBackup) {
    backupFile(filePath);
  }
  
  fs.unlinkSync(filePath);
  log(`Removed: ${filePath}`, 'success');
  return true;
}

/**
 * Find files matching a pattern
 */
function findFiles(dir, pattern) {
  const result = [];
  
  try {
    const files = execSync(`find "${dir}" -name "${pattern}" -type f`, { encoding: 'utf8' });
    return files.trim().split('\n').filter(Boolean);
  } catch (err) {
    log(`Error finding files: ${err.message}`, 'error');
    return [];
  }
}

/**
 * Check if file contents indicate it's a compatibility layer
 */
function isCompatibilityLayer(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('@deprecated') && 
           (content.includes('Re-export') || content.includes('compatibility'));
  } catch (err) {
    log(`Error reading file: ${err.message}`, 'error');
    return false;
  }
}

/**
 * Find duplicate authentication files
 */
function findDuplicateAuthFiles() {
  log('Step 1: Identifying duplicate authentication files', 'step');
  
  const duplicates = [];
  
  // Check for old files that now have a compatibility layer
  const authServicePatterns = [
    'services/api/auth-service.ts',
    'services/api/modules/auth/auth-service.ts',
    'services/api/modules/auth/legacy-auth-service.ts',
    'services/api/auth.ts',
  ];
  
  const walletAuthPatterns = [
    'services/api/walletAuth.service.ts',
    'services/wallet/auth/walletAuth.ts',
    'services/api/modules/auth/wallet-auth-service.ts',
  ];
  
  const deviceFingerprintPatterns = [
    'services/security/device-fingerprint.ts',
    'services/security/protection/deviceFingerprint.ts',
    'services/security/modules/device-fingerprint.ts',
  ];
  
  // Check each pattern
  for (const pattern of [...authServicePatterns, ...walletAuthPatterns, ...deviceFingerprintPatterns]) {
    const files = findFiles(FRONTEND_DIR, path.basename(pattern));
    
    for (const file of files) {
      // Skip the file if it doesn't match our specific paths
      if (!file.includes(pattern.replace('.ts', ''))) continue;
      
      // Check if it's already a compatibility layer
      if (isCompatibilityLayer(file)) {
        log(`Found compatibility layer: ${file}`, 'info');
      } else {
        log(`Found potential duplicate: ${file}`, 'warn');
        duplicates.push(file);
      }
    }
  }
  
  log(`Found ${duplicates.length} potential duplicate files`, 
    duplicates.length > 0 ? 'warn' : 'success');
  
  return duplicates;
}

/**
 * Update import in AuthProvider.tsx
 */
function updateAuthProvider() {
  log('Step 2: Updating AuthProvider.tsx to use new import path', 'step');
  
  const authProviderPath = path.join(FRONTEND_DIR, 'src', 'contexts', 'AuthProvider.tsx');
  
  if (!fs.existsSync(authProviderPath)) {
    log(`AuthProvider.tsx not found at ${authProviderPath}`, 'error');
    return false;
  }
  
  let content = fs.readFileSync(authProviderPath, 'utf8');
  
  // Check if import is already correct
  if (content.includes("import { authService, AuthResponse } from '../services/api/auth';")) {
    log('AuthProvider.tsx is already using the correct import path', 'success');
    return true;
  }
  
  // Create backup
  backupFile(authProviderPath);
  
  // Replace old import with new import
  content = content.replace(
    /import\s*{\s*authService\s*,\s*AuthResponse\s*}\s*from\s*['"]\.\.\/services\/api\/auth-service['"];/,
    "import { authService, AuthResponse } from '../services/api/auth';"
  );
  
  fs.writeFileSync(authProviderPath, content, 'utf8');
  log('Updated import path in AuthProvider.tsx', 'success');
  
  return true;
}

/**
 * Remove duplicate files
 */
function removeDuplicates(duplicates) {
  if (duplicates.length === 0) {
    log('No duplicates to remove', 'success');
    return;
  }
  
  log('Step 3: Removing duplicate files (with backup)', 'step');
  
  // Ensure backup directory exists
  ensureDir(BACKUP_DIR);
  
  for (const file of duplicates) {
    removeFile(file);
  }
  
  log(`Removed ${duplicates.length} duplicate files`, 'success');
}

/**
 * Check TypeScript compilation to ensure everything still works
 */
function checkTsCompilation() {
  log('Step 4: Checking TypeScript compilation to ensure everything works', 'step');
  
  try {
    log('Running TypeScript compiler check in frontend...', 'info');
    execSync('cd "' + FRONTEND_DIR + '" && npx tsc --noEmit', { stdio: 'pipe' });
    log('Frontend TypeScript compilation check passed!', 'success');
    return true;
  } catch (err) {
    log('Frontend TypeScript compilation check failed!', 'error');
    log(err.stdout?.toString() || err.message, 'error');
    return false;
  }
}

/**
 * Create summary information about the backend dependency issue
 */
function diagnoseBackendIssues() {
  log('Step 5: Diagnosing backend issues', 'step');
  
  const authModulePath = path.join(BACKEND_DIR, 'src', 'auth', 'auth.module.ts');
  let authModuleContent = '';
  
  try {
    authModuleContent = fs.readFileSync(authModulePath, 'utf8');
  } catch (err) {
    log(`Error reading auth.module.ts: ${err.message}`, 'error');
    return;
  }
  
  const hasTokenModule = authModuleContent.includes('TokenModule');
  const hasTokenService = authModuleContent.includes('TokenService');
  const hasForwardRef = authModuleContent.includes('forwardRef(() => TokenModule)');
  
  log('Auth module analysis:', 'info');
  log(`- TokenModule imported: ${hasTokenModule ? 'Yes' : 'No'}`, hasTokenModule ? 'success' : 'warn');
  log(`- TokenService included: ${hasTokenService ? 'Yes' : 'No'}`, hasTokenService ? 'success' : 'warn');
  log(`- Using forwardRef for circular dependency: ${hasForwardRef ? 'Yes' : 'No'}`, 
    hasForwardRef ? 'success' : 'warn');
  
  if (hasTokenModule && hasTokenService && !hasForwardRef) {
    log('Recommendation: Update TokenModule import to use forwardRef() to prevent circular dependencies', 'warn');
  } else if (hasTokenModule && hasTokenService && hasForwardRef) {
    log('The auth.module.ts file appears to be correctly configured', 'success');
  }
}

/**
 * Run the cleanup process
 */
async function runCleanup() {
  log('Starting authentication system cleanup', 'step');
  
  // Step 1: Find duplicate files
  const duplicates = findDuplicateAuthFiles();
  
  // Step 2: Update AuthProvider import
  updateAuthProvider();
  
  // Step 3: Remove duplicate files
  removeDuplicates(duplicates);
  
  // Step 4: Check TypeScript compilation
  const compilationOk = checkTsCompilation();
  
  // Step 5: Diagnose backend issues
  diagnoseBackendIssues();
  
  // Final summary
  log('Authentication system cleanup completed!', 'step');
  log(`- Updated AuthProvider.tsx to use correct imports`, 'success');
  log(`- Removed ${duplicates.length} duplicate files (with backup in ${BACKUP_DIR})`, 'success');
  log(`- TypeScript compilation check: ${compilationOk ? 'Passed' : 'Failed'}`, 
    compilationOk ? 'success' : 'warn');
  
  log(`\nNext steps:`, 'info');
  log(`1. Run the auth test script to verify authentication flow:`, 'info');
  log(`   node ${path.relative(process.cwd(), path.join(__dirname, 'test-complete-auth-flow.js'))}`, 'info');
  log(`2. Update the documentation in ${path.join(PROJECT_ROOT, 'docs', 'refactoring', 'refactorAuth.md')}`, 'info');
}

// Run the cleanup process
runCleanup().catch(err => {
  log(`Fatal error: ${err.message}`, 'error');
  process.exit(1);
});
