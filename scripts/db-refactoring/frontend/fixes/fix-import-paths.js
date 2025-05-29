#!/usr/bin/env node

/**
 * Import Path Fixer Script
 * 
 * This script fixes import paths after renaming files with the naming convention standardization.
 * It looks for common patterns in the TypeScript errors and fixes them.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend');
const SRC_DIR = path.join(FRONTEND_ROOT, 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/frontend', `import-fixes-${new Date().toISOString().replace(/[:.]/g, '-')}`);

// Common patterns that need to be fixed
const importFixes = [
  // Changed cases
  { from: /from\s+['"](.+?)\/ColorSystem['"]/g, to: match => match.replace('ColorSystem', 'colorSystem') },
  { from: /from\s+['"](.+?)\/GalaxyColorSystem['"]/g, to: match => match.replace('GalaxyColorSystem', 'galaxyColorSystem') },
  { from: /from\s+['"](.+?)\/GalaxyAnimation['"]/g, to: match => match.replace('GalaxyAnimation', 'galaxyAnimation') },
  { from: /from\s+['"](.+?)\/GalaxyTransitionManager['"]/g, to: match => match.replace('GalaxyTransitionManager', 'galaxyTransitionManager') },
  { from: /from\s+['"](.+?)\/WebSocketContext['"]/g, to: match => match.replace('WebSocketContext', 'WebSocketProvider') },
  { from: /from\s+['"](.+?)\/auth['"]/g, to: match => match.replace('/auth', '/AuthProvider') },
  { from: /from\s+['"](.+?)\/wallet['"]/g, to: match => match.replace('/wallet', '/WalletProvider') },
  { from: /from\s+['"](.+?)\/websocket['"]/g, to: match => match.replace('/websocket', '/WebSocketProvider') },
  { from: /from\s+['"](.+?)\/WebSocketDemo['"]/g, to: match => match.replace('/WebSocketDemo', '/web-socket-demo') },
  
  // Service files
  { from: /from\s+['"](.+?)\/api-client['"]/g, to: match => match.replace('api-client', 'apiClient') },
  { from: /from\s+['"](.+?)\/batch-request['"]/g, to: match => match.replace('batch-request', 'batchRequest') },
  { from: /from\s+['"](.+?)\/cached-api['"]/g, to: match => match.replace('cached-api', 'cachedApi') },
  { from: /from\s+['"](.+?)\/compressed-api['"]/g, to: match => match.replace('compressed-api', 'compressedApi') },
  { from: /from\s+['"](.+?)\/encrypted-api-client['"]/g, to: match => match.replace('encrypted-api-client', 'encryptedApiClient') },
  { from: /from\s+['"](.+?)\/monitoring-api['"]/g, to: match => match.replace('monitoring-api', 'monitoringApi') },
  { from: /from\s+['"](.+?)\/offline-api['"]/g, to: match => match.replace('offline-api', 'offlineApi') },
  { from: /from\s+['"](.+?)\/secure-api-client['"]/g, to: match => match.replace('secure-api-client', 'secureApiClient') },
  { from: /from\s+['"](.+?)\/selective-api['"]/g, to: match => match.replace('selective-api', 'selectiveApi') },
  { from: /from\s+['"](.+?)\/event-bus['"]/g, to: match => match.replace('event-bus', 'eventBus') },
  { from: /from\s+['"](.+?)\/diary-service['"]/g, to: match => match.replace('diary-service', 'diaryService') },
  { from: /from\s+['"](.+?)\/legacy-diary-service['"]/g, to: match => match.replace('legacy-diary-service', 'legacyDiaryService') },
  { from: /from\s+['"](.+?)\/nft-service['"]/g, to: match => match.replace('nft-service', 'nftService') },
  { from: /from\s+['"](.+?)\/token-service['"]/g, to: match => match.replace('token-service', 'tokenService') },
  { from: /from\s+['"](.+?)\/referral-service['"]/g, to: match => match.replace('referral-service', 'referralService') },
  { from: /from\s+['"](.+?)\/user-service['"]/g, to: match => match.replace('user-service', 'userService') },
  { from: /from\s+['"](.+?)\/wallet-auth\.service['"]/g, to: match => match.replace('wallet-auth.service', 'walletAuth.service') },
  { from: /from\s+['"](.+?)\/game-notification\.service['"]/g, to: match => match.replace('game-notification.service', 'gameNotification.service') },
  { from: /from\s+['"](.+?)\/notification-service['"]/g, to: match => match.replace('notification-service', 'notificationService') },
  { from: /from\s+['"](.+?)\/realtime-service-interface['"]/g, to: match => match.replace('realtime-service-interface', 'realtimeServiceInterface') },
  { from: /from\s+['"](.+?)\/realtime-service['"]/g, to: match => match.replace('realtime-service', 'realtimeService') },
  { from: /from\s+['"](.+?)\/websocket-manager['"]/g, to: match => match.replace('websocket-manager', 'websocketManager') },
  { from: /from\s+['"](.+?)\/encryption-service['"]/g, to: match => match.replace('encryption-service', 'encryptionService') },
  { from: /from\s+['"](.+?)\/captcha-service['"]/g, to: match => match.replace('captcha-service', 'captchaService') },
  { from: /from\s+['"](.+?)\/device-fingerprint['"]/g, to: match => match.replace('device-fingerprint', 'deviceFingerprint') },
  { from: /from\s+['"](.+?)\/security-service['"]/g, to: match => match.replace('security-service', 'securityService') },
  { from: /from\s+['"](.+?)\/cache-utils['"]/g, to: match => match.replace('cache-utils', 'cacheUtils') },
  { from: /from\s+['"](.+?)\/memory-manager['"]/g, to: match => match.replace('memory-manager', 'memoryManager') },
  { from: /from\s+['"](.+?)\/wallet-auth['"]/g, to: match => match.replace('wallet-auth', 'walletAuth') },
  { from: /from\s+['"](.+?)\/wallet-base['"]/g, to: match => match.replace('wallet-base', 'walletBase') },
  { from: /from\s+['"](.+?)\/wallet-initialization['"]/g, to: match => match.replace('wallet-initialization', 'walletInitialization') },
  { from: /from\s+['"](.+?)\/wallet-selector['"]/g, to: match => match.replace('wallet-selector', 'walletSelector') },
  { from: /from\s+['"](.+?)\/wallet-service['"]/g, to: match => match.replace('wallet-service', 'walletService') },
  
  // Type files
  { from: /from\s+['"](.+?)\/api-types['"]/g, to: match => match.replace('api-types', 'apiTypes') },
  { from: /from\s+['"](.+?)\/diary-extended['"]/g, to: match => match.replace('diary-extended', 'diaryExtended') },
  { from: /from\s+['"](.+?)\/realtime-types['"]/g, to: match => match.replace('realtime-types', 'realtimeTypes') },
  
  // Utils
  { from: /from\s+['"](.+?)\/auth-debugger['"]/g, to: match => match.replace('auth-debugger', 'authDebugger') },
  { from: /from\s+['"](.+?)\/initialize-debug['"]/g, to: match => match.replace('initialize-debug', 'initializeDebug') },
  { from: /from\s+['"](.+?)\/secure-storage['"]/g, to: match => match.replace('secure-storage', 'secureStorage') },
  { from: /from\s+['"](.+?)\/wallet-connection-debugger['"]/g, to: match => match.replace('wallet-connection-debugger', 'walletConnectionDebugger') },

  // Path corrections - many errors include extra slashes
  { from: /from\s+['"](\.+)\/+(.+?)['"]/g, to: (match, p1, p2) => `from "${p1}/${p2.replace(/\/+/g, '/')}"` },
  { from: /from\s+['"]@\/+(.+?)['"]/g, to: (match, p1) => `from "@/${p1.replace(/\/+/g, '/')}"` },
  { from: /from\s+['"]@m\/+(.+?)['"]/g, to: (match, p1) => `from "@m/${p1.replace(/\/+/g, '/')}"` },
];

// Stats tracking
const stats = {
  filesChecked: 0,
  filesModified: 0,
  fixesApplied: 0,
  errors: []
};

/**
 * Create backup of a file
 */
async function backupFile(filePath) {
  try {
    const relativePath = path.relative(FRONTEND_ROOT, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    
    // Create directory structure
    await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Copy file
    await fs.promises.copyFile(filePath, backupPath);
    
    if (VERBOSE) {
      console.log(`Backed up file: ${filePath} -> ${backupPath}`);
    }
  } catch (err) {
    console.error(`Failed to backup ${filePath}:`, err);
  }
}

/**
 * Fix imports in a single file
 */
async function fixImportsInFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    let fixesApplied = 0;
    
    for (const fix of importFixes) {
      const originalContent = updatedContent;
      updatedContent = updatedContent.replace(fix.from, fix.to);
      
      if (originalContent !== updatedContent) {
        fixesApplied++;
      }
    }
    
    if (fixesApplied > 0) {
      await backupFile(filePath);
      
      if (!DRY_RUN) {
        await writeFile(filePath, updatedContent, 'utf8');
      }
      
      console.log(`${DRY_RUN ? '[DRY RUN] Would fix' : 'Fixed'} ${fixesApplied} import(s) in: ${filePath}`);
      stats.fixesApplied += fixesApplied;
      stats.filesModified++;
      return true;
    }
    
    return false;
  } catch (err) {
    stats.errors.push(`Error fixing imports in ${filePath}: ${err.message}`);
    console.error(`Error fixing imports in ${filePath}:`, err);
    return false;
  }
}

/**
 * Process a directory recursively
 */
async function processDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const fileStat = await stat(fullPath);
      
      if (fileStat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          await processDirectory(fullPath);
        }
      } else if (fileStat.isFile() && /\.(ts|tsx)$/.test(entry)) {
        await fixImportsInFile(fullPath);
        stats.filesChecked++;
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}:`, err);
  }
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(PROJECT_ROOT, `frontend-import-fixes-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  
  let report = `# Frontend Import Path Fixes Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Files checked: ${stats.filesChecked}\n`;
  report += `- Files modified: ${stats.filesModified}\n`;
  report += `- Total fixes applied: ${stats.fixesApplied}\n\n`;
  
  if (stats.errors.length > 0) {
    report += `## Errors\n\n`;
    for (const error of stats.errors) {
      report += `- ${error}\n`;
    }
    report += '\n';
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Run TypeScript compiler to check if all errors are fixed\n`;
  report += `2. Test the application to ensure everything works correctly\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport written to: ${reportPath}`);
  } else {
    console.log('\n=== Report Preview ===\n');
    console.log(report);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Frontend Import Path Fixer ${DRY_RUN ? '(DRY RUN)' : ''}\n`);
  
  // Create backup directory
  await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
  
  try {
    await processDirectory(SRC_DIR);
    generateReport();
    
    console.log(`\nDone! Checked ${stats.filesChecked} files, fixed imports in ${stats.filesModified} files.`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});