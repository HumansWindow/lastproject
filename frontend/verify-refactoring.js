#!/usr/bin/env node

/**
 * Verification script for Next.js refactoring
 * This script checks that all required files are in place and there are no remnants of React Router
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Running verification for Next.js refactoring');
console.log('═════════════════════════════════════════════\n');

// Directories to check
const directories = [
  'src/pages',
  'src/pages/error',
  'src/components',
  'src/hooks',
  'src/utils',
  'src/services',
  'src/contexts'
];

// Files that should exist
const requiredFiles = [
  'src/pages/_app.tsx',
  'src/pages/error/not-found.tsx',
  'src/pages/error/rate-limit.tsx',
  'src/pages/error/server.tsx',
  'src/hooks/useWebSocket.ts',
  'src/utils/errorNavigation.ts'
];

// Files that should NOT exist (removed during refactoring)
const removedFiles = [
  'src/App.tsx',
  'src/routes/ErrorRouter.tsx'
];

// Package.json should not contain react-router
const packageJsonPath = 'package.json';

// Check directories
console.log('📂 Checking directories...');
let allDirectoriesExist = true;
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${dir}`);
  if (!exists) allDirectoriesExist = false;
});
console.log(allDirectoriesExist ? '✅ All directories exist!' : '❌ Some directories are missing!');
console.log('');

// Check required files
console.log('📄 Checking required files...');
let allRequiredFilesExist = true;
requiredFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allRequiredFilesExist = false;
});
console.log(allRequiredFilesExist ? '✅ All required files exist!' : '❌ Some required files are missing!');
console.log('');

// Check removed files
console.log('🗑️ Checking removed files...');
let allFilesRemoved = true;
removedFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${!exists ? '✅' : '❌'} ${file} ${!exists ? 'removed' : 'still exists!'}`);
  if (exists) allFilesRemoved = false;
});
console.log(allFilesRemoved ? '✅ All unnecessary files removed!' : '❌ Some files should be removed!');
console.log('');

// Check package.json for react-router
let packageJsonClean = false;
try {
  console.log('📦 Checking package.json...');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasReactRouterDep = packageJson.dependencies && 
    (packageJson.dependencies['react-router'] || packageJson.dependencies['react-router-dom']);
  const hasReactRouterDevDep = packageJson.devDependencies && 
    (packageJson.devDependencies['react-router'] || packageJson.devDependencies['react-router-dom']);
    
  packageJsonClean = !hasReactRouterDep && !hasReactRouterDevDep;
  console.log(`   ${packageJsonClean ? '✅' : '❌'} React Router ${packageJsonClean ? 'not found in' : 'still exists in'} package.json`);
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}
console.log('');

// Run grep to find any mention of react-router in code files
console.log('🔍 Checking for React Router references in code...');
try {
  const grepResult = execSync(
    "grep -r \"react-router\\|BrowserRouter\\|Routes\\|Route,\" --include=\"*.ts*\" --include=\"*.js*\" src/ | grep -v \"refactorFrontend.md\"",
    { stdio: 'pipe', encoding: 'utf8' }
  );
  
  if (grepResult.trim()) {
    console.log('   ❌ Found React Router references:');
    console.log(grepResult);
  } else {
    console.log('   ✅ No React Router references found in code!');
  }
} catch (error) {
  // grep returns exit code 1 when nothing is found, which is actually good in our case
  if (error.status === 1 && !error.stdout.trim()) {
    console.log('   ✅ No React Router references found in code!');
  } else {
    console.log(`   ❌ Error running grep: ${error.message}`);
  }
}
console.log('');

// Overall status
const allChecksPass = allDirectoriesExist && allRequiredFilesExist && allFilesRemoved && packageJsonClean;
console.log('🏁 Refactoring verification complete!');
console.log(`   ${allChecksPass ? '✅ All checks passed!' : '❌ Some checks failed!'}`);

if (!allChecksPass) {
  console.log('\n⚠️  Please fix the issues above to complete the refactoring.');
} else {
  console.log('\n🎉 Congratulations! Your project has been successfully refactored to use Next.js exclusively.');
  console.log('   The following improvements have been made:');
  console.log('   • Removed duplicate framework code (App.tsx)');
  console.log('   • Migrated from React Router to Next.js routing');
  console.log('   • Created proper error handling pages in Next.js structure');
  console.log('   • Implemented a custom WebSocket hook for real-time functionality');
  console.log('   • Removed unnecessary dependencies');
}

console.log('\nFor the next steps after refactoring:');
console.log('1. Run your application with "npm run dev" to test all functionality');
console.log('2. Check that your WebSocket demo page works correctly');
console.log('3. Verify that error pages redirect properly');
console.log('4. Update any documentation to reflect the new Next.js-only structure');