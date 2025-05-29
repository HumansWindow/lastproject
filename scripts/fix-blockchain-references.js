#!/usr/bin/env node

/**
 * Script to fix hardcoded blockchain references and standardize wallet authentication
 * 
 * Run this script to:
 * 1. Find hardcoded blockchain strings and replace them with constant references
 * 2. Standardize wallet authentication functions to use blockchain constants
 * 3. Generate a report of files that need manual review
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const FRONTEND_DIR = path.join(process.cwd(), 'frontend');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');
const OUTPUT_FILE = path.join(process.cwd(), 'wallet-auth-code-fixes.md');

// Files that should always import the blockchain constants
const FILES_TO_FIX = [
  'components/WalletConnectButton.tsx',
  'contexts/AuthProvider.tsx',
  'services/wallet/providers/ethereum/trustwallet.ts',
  'services/api/modules/auth/wallet-auth-service.ts',
  'utils/authDebugger.ts'
];

// Import statement to add to files
const IMPORT_STATEMENT = "import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '../config/blockchain/constants';";
const RELATIVE_IMPORT = (filePath) => {
  // Calculate relative path
  const fileDir = path.dirname(filePath);
  const configDir = path.join(SRC_DIR, 'config/blockchain');
  const relativePath = path.relative(fileDir, configDir).replace(/\\/g, '/');
  return `import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '${relativePath}/constants';`;
};

// Replacements to make in files
const REPLACEMENTS = [
  {
    pattern: /'polygon'/g,
    replacement: 'DEFAULT_BLOCKCHAIN_NETWORK'
  },
  {
    pattern: /"polygon"/g,
    replacement: 'DEFAULT_BLOCKCHAIN_NETWORK'
  },
  {
    pattern: /const effectiveBlockchain = ['"]polygon['"];/g,
    replacement: 'const effectiveBlockchain = DEFAULT_BLOCKCHAIN_NETWORK;'
  },
  {
    pattern: /const effectiveBlockchainType = ['"]polygon['"];/g,
    replacement: 'const effectiveBlockchainType = DEFAULT_BLOCKCHAIN_NETWORK;'
  },
  {
    pattern: /(authenticateWithWallet\()(blockchainName)/g,
    replacement: '$1normalizeBlockchainType($2)'
  }
];

// Helper function to check if a file already imports blockchain constants
function hasBlockchainImport(content) {
  return content.includes('import') && 
         content.includes('blockchain/constants') &&
         (content.includes('DEFAULT_BLOCKCHAIN_NETWORK') || content.includes('normalizeBlockchainType'));
}

// Helper function to add import statement if needed
function addImportIfNeeded(content, filePath) {
  if (!hasBlockchainImport(content)) {
    const importStatement = RELATIVE_IMPORT(filePath);
    // Find a good place to insert the import
    const lines = content.split('\n');
    let importInsertIndex = 0;
    
    // Look for the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        importInsertIndex = i + 1;
      }
    }
    
    // Insert the import statement
    lines.splice(importInsertIndex, 0, importStatement);
    return lines.join('\n');
  }
  return content;
}

// Helper function to apply replacements to a file
function applyReplacements(content) {
  let modified = content;
  REPLACEMENTS.forEach(({pattern, replacement}) => {
    modified = modified.replace(pattern, replacement);
  });
  return modified;
}

// Main function
async function main() {
  console.log('Standardizing blockchain references...');
  const report = ['# Wallet Authentication Code Fixes\n'];
  report.push('## Files Modified\n');
  
  // Process each file
  for (const relativePath of FILES_TO_FIX) {
    const filePath = path.join(SRC_DIR, relativePath);
    try {
      console.log(`Processing ${relativePath}...`);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        // Add import if needed
        content = addImportIfNeeded(content, filePath);
        
        // Apply replacements
        content = applyReplacements(content);
        
        // If file was modified, write changes back
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          report.push(`- ✅ ${relativePath} - Updated blockchain references`);
        } else {
          report.push(`- ⏩ ${relativePath} - No changes needed`);
        }
      } else {
        console.log(`File not found: ${filePath}`);
        report.push(`- ❌ ${relativePath} - File not found`);
      }
    } catch (error) {
      console.error(`Error processing ${relativePath}:`, error);
      report.push(`- ❌ ${relativePath} - Error: ${error.message}`);
    }
  }
  
  // Find other files that might need review
  report.push('\n## Files That May Need Manual Review\n');
  
  exec(`grep -r --include="*.ts*" --exclude-dir="node_modules" --exclude-dir=".next" "blockchain.*type" ${SRC_DIR}`, 
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      
      const filesToReview = new Set();
      stdout.split('\n').forEach(line => {
        const match = line.match(/^([^:]+):/);
        if (match) {
          const file = match[1];
          const relativePath = path.relative(SRC_DIR, file);
          if (relativePath && !FILES_TO_FIX.includes(relativePath)) {
            filesToReview.add(relativePath);
          }
        }
      });
      
      filesToReview.forEach(file => {
        report.push(`- 🔍 ${file} - May use blockchain types, should be reviewed`);
      });
      
      // Add recommendations
      report.push('\n## Next Steps\n');
      report.push('1. Review the modified files to ensure changes are correct');
      report.push('2. Check the files flagged for manual review');
      report.push('3. Test wallet authentication with different wallet providers');
      report.push('4. Standardize any remaining blockchain type usage');
      report.push('\n## Testing Instructions\n');
      report.push('1. Test connecting with Trust Wallet');
      report.push('2. Test connecting with MetaMask');
      report.push('3. Verify authentication works with the standardized blockchain types');
      
      // Write the report
      fs.writeFileSync(OUTPUT_FILE, report.join('\n'), 'utf8');
      console.log(`\nReport saved to ${OUTPUT_FILE}`);
    });
}

main().catch(console.error);