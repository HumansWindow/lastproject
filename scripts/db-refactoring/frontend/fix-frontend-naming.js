#!/usr/bin/env node

/**
 * Frontend Naming Convention Fixer
 * 
 * This script standardizes naming conventions across the frontend codebase:
 * 
 * 1. File Naming:
 *    - React components: PascalCase.tsx
 *    - Next.js pages: kebab-case.tsx (except _app.tsx, _document.tsx)
 *    - Utility files: camelCase.ts
 *    - Service files: camelCase.service.ts
 *    - Type definitions: camelCase.types.ts
 *    - CSS modules: ComponentName.module.css
 * 
 * 2. Directory Naming:
 *    - Component directories: kebab-case
 *    - Service module directories: kebab-case
 *    - Page directories: kebab-case
 * 
 * 3. React Component Naming:
 *    - Components: PascalCase
 *    - Component filenames match export name
 * 
 * 4. Service Module Structure:
 *    - Standardize service module organization
 *    - Fix inconsistencies in service module paths
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');
const readline = require('readline');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const rename = util.promisify(fs.rename);
const mkdir = util.promisify(fs.mkdir);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const FRONTEND_ROOT = path.join(PROJECT_ROOT, 'frontend');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/frontend', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);

// File patterns that should be standardized
const patterns = {
  components: /\.tsx$/,
  pages: /\.tsx$/,
  services: /\.(service|manager)\.ts$/,
  utils: /\.ts$/,
  styles: /\.css$/
};

// Naming convention regexes
const conventions = {
  pascalCase: /^[A-Z][A-Za-z0-9]*$/,
  camelCase: /^[a-z][A-Za-z0-9]*$/,
  kebabCase: /^[a-z]+(-[a-z0-9]+)*$/
};

// Tracking statistics
const stats = {
  componentsRenamed: 0,
  pagesRenamed: 0,
  servicesRenamed: 0,
  utilsRenamed: 0,
  directoriesRenamed: 0,
  fileContentsUpdated: 0,
  errors: []
};

// Maps for tracking renames to update imports later
const fileRenameMap = new Map();
const dirRenameMap = new Map();

// Directories to ignore
const ignoreDirectories = [
  'node_modules',
  '.next',
  'public',
  '.git',
  'dist'
];

/**
 * Create backup of a file or directory
 */
async function backupFile(filePath) {
  const relativePath = path.relative(FRONTEND_ROOT, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  
  try {
    const stats = await stat(filePath);
    
    // Create directory structure
    await mkdir(path.dirname(backupPath), { recursive: true });
    
    if (stats.isDirectory()) {
      // For directories, just create the directory structure
      await mkdir(backupPath, { recursive: true });
      if (VERBOSE) {
        console.log(`Created directory for backup: ${backupPath}`);
      }
    } else {
      // For files, copy the content
      await fs.promises.copyFile(filePath, backupPath);
      if (VERBOSE) {
        console.log(`Backed up file: ${filePath} -> ${backupPath}`);
      }
    }
  } catch (err) {
    console.error(`Failed to backup ${filePath}:`, err);
  }
}

/**
 * Convert a string from one case to another
 */
function convertCase(str, from, to) {
  let words = [];
  
  // Parse the string into words based on the source case
  if (from === 'kebab') {
    words = str.split('-');
  } else if (from === 'camel' || from === 'pascal') {
    words = str.replace(/([A-Z])/g, ' $1').trim().split(' ');
    if (from === 'camel') {
      words[0] = words[0].toLowerCase();
    }
  } else {
    return str; // Unknown format, return as is
  }
  
  // Convert to target case
  if (to === 'pascal') {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  } else if (to === 'camel') {
    return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  } else if (to === 'kebab') {
    return words.map(w => w.toLowerCase()).join('-');
  }
  
  return str; // Default fallback
}

/**
 * Detect the case of a string
 */
function detectCase(str) {
  if (conventions.pascalCase.test(str)) return 'pascal';
  if (conventions.camelCase.test(str)) return 'camel';
  if (conventions.kebabCase.test(str)) return 'kebab';
  return 'unknown';
}

/**
 * Standardize component file name
 */
function standardizeComponentName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // Extract component name from file contents to ensure it matches
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const componentNameMatch = content.match(/export\s+(?:default\s+)?(?:const|function|class)\s+([A-Z][A-Za-z0-9]*)/);
    
    if (componentNameMatch && componentNameMatch[1]) {
      const componentName = componentNameMatch[1];
      const correctFileName = `${componentName}${ext}`;
      
      if (basename !== componentName) {
        const newPath = path.join(dir, correctFileName);
        return { 
          oldPath: filePath, 
          newPath, 
          type: 'component', 
          oldName: basename, 
          newName: componentName 
        };
      }
    }
  } catch (err) {
    stats.errors.push(`Error reading component file ${filePath}: ${err.message}`);
  }
  
  return null;
}

/**
 * Standardize page file name
 */
function standardizePageName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // Special cases for Next.js specific files
  if (basename.startsWith('_') || basename === '404' || basename === '500') {
    return null; // Leave as is
  }
  
  // Dynamic route files should remain as [param].tsx
  if (basename.startsWith('[') && basename.endsWith(']')) {
    return null;
  }
  
  const currentCase = detectCase(basename);
  
  // If it's already in kebab-case, no need to change
  if (currentCase === 'kebab') {
    return null;
  }
  
  // Convert to kebab-case for pages
  const kebabName = convertCase(basename, currentCase, 'kebab');
  const newPath = path.join(dir, `${kebabName}${ext}`);
  
  return { 
    oldPath: filePath, 
    newPath, 
    type: 'page', 
    oldName: basename, 
    newName: kebabName 
  };
}

/**
 * Standardize service file name
 */
function standardizeServiceName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // If already ends with .service.ts format, check if camelCase
  if (basename.endsWith('.service') || basename.endsWith('.manager')) {
    const serviceName = basename.split('.')[0];
    const currentCase = detectCase(serviceName);
    
    if (currentCase !== 'camel') {
      const camelName = convertCase(serviceName, currentCase, 'camel');
      const suffix = basename.includes('.service') ? '.service' : '.manager';
      const newPath = path.join(dir, `${camelName}${suffix}${ext}`);
      
      return { 
        oldPath: filePath, 
        newPath, 
        type: 'service', 
        oldName: basename, 
        newName: `${camelName}${suffix}` 
      };
    }
    return null;
  }
  
  // Service files without the .service suffix
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const serviceMatch = content.match(/class\s+([A-Za-z0-9]+)Service/);
    
    if (serviceMatch && serviceMatch[1]) {
      const serviceName = convertCase(serviceMatch[1], 'pascal', 'camel');
      const newPath = path.join(dir, `${serviceName}.service${ext}`);
      
      return { 
        oldPath: filePath, 
        newPath, 
        type: 'service', 
        oldName: basename, 
        newName: `${serviceName}.service` 
      };
    }
  } catch (err) {
    stats.errors.push(`Error reading service file ${filePath}: ${err.message}`);
  }
  
  return null;
}

/**
 * Standardize utility file name
 */
function standardizeUtilName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // Skip already processed types
  if (basename.endsWith('.service') || basename.endsWith('.manager') || basename.endsWith('.types')) {
    return null;
  }
  
  const currentCase = detectCase(basename);
  
  if (currentCase !== 'camel') {
    const camelName = convertCase(basename, currentCase, 'camel');
    const newPath = path.join(dir, `${camelName}${ext}`);
    
    return { 
      oldPath: filePath, 
      newPath, 
      type: 'util', 
      oldName: basename, 
      newName: camelName 
    };
  }
  
  return null;
}

/**
 * Standardize CSS module file name
 */
function standardizeStyleName(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  
  // If it's a CSS module, make sure it matches component name
  if (basename.endsWith('.module')) {
    const componentName = basename.replace('.module', '');
    const currentCase = detectCase(componentName);
    
    // Try to find matching component file
    const potentialComponentPath = path.join(dir, `${componentName}.tsx`);
    
    if (fs.existsSync(potentialComponentPath) && currentCase !== 'pascal') {
      const pascalName = convertCase(componentName, currentCase, 'pascal');
      const newPath = path.join(dir, `${pascalName}.module${ext}`);
      
      return { 
        oldPath: filePath, 
        newPath, 
        type: 'style', 
        oldName: basename, 
        newName: `${pascalName}.module` 
      };
    }
  }
  
  return null;
}

/**
 * Standardize directory name
 */
function standardizeDirName(dirPath) {
  const parent = path.dirname(dirPath);
  const basename = path.basename(dirPath);
  
  // Skip root directories and special directories
  if (parent === FRONTEND_ROOT || basename === 'src') {
    return null;
  }
  
  // Special directories to leave as is
  if (['pages', 'components', 'utils', 'hooks', 'contexts', 'config', 'types'].includes(basename)) {
    return null;
  }
  
  const currentCase = detectCase(basename);
  
  // If it's not kebab-case, convert
  if (currentCase !== 'kebab') {
    const kebabName = convertCase(basename, currentCase, 'kebab');
    const newPath = path.join(parent, kebabName);
    
    return { 
      oldPath: dirPath, 
      newPath, 
      type: 'directory', 
      oldName: basename, 
      newName: kebabName 
    };
  }
  
  return null;
}

/**
 * Update import paths in a file
 */
async function updateImports(filePath) {
  if (!fs.existsSync(filePath)) return false;
  
  try {
    const content = await readFile(filePath, 'utf8');
    const updateResult = getUpdatedImports(content);
    
    if (updateResult.updated) {
      await backupFile(filePath);
      
      if (!DRY_RUN) {
        await writeFile(filePath, updateResult.content, 'utf8');
      }
      
      stats.fileContentsUpdated++;
      return true;
    }
  } catch (err) {
    stats.errors.push(`Error updating imports in ${filePath}: ${err.message}`);
  }
  
  return false;
}

/**
 * Get updated import statements for a file content
 */
function getUpdatedImports(content) {
  let updatedContent = content;
  let updated = false;
  
  // Update directory imports
  const dirUpdates = updateDirectoryImports(updatedContent);
  updatedContent = dirUpdates.content;
  updated = updated || dirUpdates.updated;
  
  // Update file imports
  const fileUpdates = updateFileImports(updatedContent);
  updatedContent = fileUpdates.content;
  updated = updated || fileUpdates.updated;
  
  return { content: updatedContent, updated };
}

/**
 * Update directory imports in content
 */
function updateDirectoryImports(content) {
  let updatedContent = content;
  let updated = false;
  
  for (const [oldDir, newDir] of dirRenameMap.entries()) {
    // Update absolute imports
    const { content: contentAfterAbsoluteImports, updated: absoluteImportsUpdated } = 
      updateAbsoluteDirectoryImports(updatedContent, oldDir, newDir);
    updatedContent = contentAfterAbsoluteImports;
    updated = updated || absoluteImportsUpdated;
    
    // Update relative imports
    const { content: contentAfterRelativeImports, updated: relativeImportsUpdated } = 
      updateRelativeDirectoryImports(updatedContent, oldDir, newDir);
    updatedContent = contentAfterRelativeImports;
    updated = updated || relativeImportsUpdated;
  }
  
  return { content: updatedContent, updated };
}

/**
 * Update absolute directory imports
 */
function updateAbsoluteDirectoryImports(content, oldDir, newDir) {
  let updated = false;
  const oldDirRegex = new RegExp(`import\\s+(.+?)\\s+from\\s+['"](.+?)${oldDir}(\\/[\\w\\.-]+)['"]`, 'g');
  
  const updatedContent = content.replace(oldDirRegex, (match, imports, path, rest) => {
    updated = true;
    const newPath = path.endsWith('/') ? path : `${path}/`;
    return `import ${imports} from "${newPath}${newDir}${rest}"`;
  });
  
  return { content: updatedContent, updated };
}

/**
 * Update relative directory imports
 */
function updateRelativeDirectoryImports(content, oldDir, newDir) {
  let updated = false;
  const oldDirRelRegex = new RegExp(`import\\s+(.+?)\\s+from\\s+['"]\\.\\.?\\/(.+?)?${oldDir}(\\/[\\w\\.-]+)?['"]`, 'g');
  
  const updatedContent = content.replace(oldDirRelRegex, (match, imports, path, rest) => {
    updated = true;
    const prefix = path ? `${path}/` : '';
    const suffix = rest || '';
    return `import ${imports} from "../${prefix}${newDir}${suffix}"`;
  });
  
  return { content: updatedContent, updated };
}

/**
 * Update file imports in content
 */
function updateFileImports(content) {
  let updatedContent = content;
  let updated = false;
  
  for (const [oldFile, { dir, newName }] of fileRenameMap.entries()) {
    const oldFileName = path.basename(oldFile, path.extname(oldFile));
    const importRegex = new RegExp(`import\\s+(.+?)\\s+from\\s+['"](.+?)${oldFileName}['"]`, 'g');
    
    updatedContent = updatedContent.replace(importRegex, (match, imports, prePath) => {
      updated = true;
      return `import ${imports} from "${prePath}${newName}"`;
    });
  }
  
  return { content: updatedContent, updated };
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    // Delegate to the appropriate standardization function
    const renameInfo = getFileRenameInfo(filePath);
    
    if (renameInfo) {
      // Update statistics
      updateStatsForRename(renameInfo);
      
      // Backup and rename the file
      await backupAndRenameFile(renameInfo);
      
      // Track the rename for import updates
      trackFileRename(renameInfo);
      
      return true;
    }
  } catch (err) {
    stats.errors.push(`Error processing file ${filePath}: ${err.message}`);
  }
  
  return false;
}

/**
 * Get file rename information based on file type
 */
function getFileRenameInfo(filePath) {
  if (patterns.components.test(filePath) && !filePath.includes('/pages/')) {
    return standardizeComponentName(filePath);
  } else if (patterns.pages.test(filePath) && filePath.includes('/pages/')) {
    return standardizePageName(filePath);
  } else if (patterns.services.test(filePath)) {
    return standardizeServiceName(filePath);
  } else if (patterns.utils.test(filePath)) {
    return standardizeUtilName(filePath);
  } else if (patterns.styles.test(filePath)) {
    return standardizeStyleName(filePath);
  }
  
  return null;
}

/**
 * Update statistics based on rename type
 */
function updateStatsForRename(renameInfo) {
  switch (renameInfo.type) {
    case 'component':
      stats.componentsRenamed++;
      break;
    case 'page':
      stats.pagesRenamed++;
      break;
    case 'service':
      stats.servicesRenamed++;
      break;
    case 'util':
      stats.utilsRenamed++;
      break;
    // Styles are counted with their respective types
  }
}

/**
 * Backup and rename file
 */
async function backupAndRenameFile(renameInfo) {
  await backupFile(renameInfo.oldPath);
  
  console.log(`${DRY_RUN ? '[DRY RUN] Would rename' : 'Renaming'}: ${renameInfo.oldPath} -> ${renameInfo.newPath}`);
  
  if (!DRY_RUN) {
    await rename(renameInfo.oldPath, renameInfo.newPath);
  }
}

/**
 * Track file rename for import updates
 */
function trackFileRename(renameInfo) {
  // Check if the new path already exists in the rename map
  const existingEntry = Array.from(fileRenameMap.entries()).find(([_, data]) => 
    data.newPath === renameInfo.newPath
  );
  
  if (existingEntry) {
    // Handle conflict - append a number to the filename
    const ext = path.extname(renameInfo.newPath);
    const basePath = renameInfo.newPath.slice(0, -ext.length);
    let counter = 1;
    let newPath = `${basePath}-${counter}${ext}`;
    
    while (Array.from(fileRenameMap.entries()).some(([_, data]) => data.newPath === newPath)) {
      counter++;
      newPath = `${basePath}-${counter}${ext}`;
    }
    
    // Update the rename info with the non-conflicting path
    renameInfo.newPath = newPath;
    renameInfo.newName = path.basename(newPath, ext);
    
    // Log the conflict resolution
    console.log(`Resolved naming conflict: ${renameInfo.oldPath} -> ${renameInfo.newPath}`);
  }
  
  fileRenameMap.set(renameInfo.oldPath, {
    newPath: renameInfo.newPath,
    dir: path.dirname(renameInfo.oldPath),
    oldName: renameInfo.oldName,
    newName: renameInfo.newName
  });
}

/**
 * Process a directory
 */
async function processDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  try {
    const files = await readdir(dirPath);
    
    // First rename the directory if needed
    const dirRenameInfo = standardizeDirName(dirPath);
    let actualDirPath = dirPath;
    
    if (dirRenameInfo) {
      await backupFile(dirRenameInfo.oldPath);
      
      console.log(`${DRY_RUN ? '[DRY RUN] Would rename directory' : 'Renaming directory'}: ${dirRenameInfo.oldPath} -> ${dirRenameInfo.newPath}`);
      
      if (!DRY_RUN) {
        await rename(dirRenameInfo.oldPath, dirRenameInfo.newPath);
      }
      
      dirRenameMap.set(dirRenameInfo.oldName, dirRenameInfo.newName);
      actualDirPath = dirRenameInfo.newPath;
      stats.directoriesRenamed++;
    }
    
    // Process all files in the directory
    for (const file of files) {
      const fullPath = path.join(actualDirPath, file);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          if (!ignoreDirectories.includes(file)) {
            await processDir(fullPath);
          }
        } else {
          await processFile(fullPath);
        }
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    }
  } catch (err) {
    stats.errors.push(`Error processing directory ${dirPath}: ${err.message}`);
  }
}

/**
 * Update Next.js page imports for renamed files
 */
async function updateNextJsPageImports() {
  const pagesDir = path.join(FRONTEND_ROOT, 'src', 'pages');
  
  if (!fs.existsSync(pagesDir)) return;
  
  try {
    await processFilesRecursively(pagesDir, updateImports);
  } catch (err) {
    stats.errors.push(`Error updating Next.js page imports: ${err.message}`);
  }
}

/**
 * Process files recursively with a callback function
 */
async function processFilesRecursively(dirPath, callback) {
  if (!fs.existsSync(dirPath)) return;
  
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      
      try {
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          if (!ignoreDirectories.includes(file)) {
            await processFilesRecursively(fullPath, callback);
          }
        } else {
          await callback(fullPath);
        }
      } catch (err) {
        console.error(`Error processing ${fullPath}:`, err);
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}:`, err);
  }
}

/**
 * Create a backup of the frontend code
 */
async function createBackup() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    console.log(`Creating backup in: ${BACKUP_DIR}`);
    
    if (!DRY_RUN) {
      execSync(`cp -r ${FRONTEND_ROOT}/src ${BACKUP_DIR}/`);
      console.log('Backup completed successfully.');
    } else {
      console.log('[DRY RUN] Would create backup.');
    }
  } catch (err) {
    console.error('Failed to create backup:', err);
    process.exit(1);
  }
}

/**
 * Generate report
 */
function generateReport() {
  const reportPath = path.join(process.cwd(), `frontend-naming-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
  
  let report = `# Frontend Naming Convention Standardization Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Components renamed: ${stats.componentsRenamed}\n`;
  report += `- Pages renamed: ${stats.pagesRenamed}\n`;
  report += `- Service files renamed: ${stats.servicesRenamed}\n`;
  report += `- Utility files renamed: ${stats.utilsRenamed}\n`;
  report += `- Directories renamed: ${stats.directoriesRenamed}\n`;
  report += `- Files with updated imports: ${stats.fileContentsUpdated}\n\n`;
  
  if (stats.errors.length > 0) {
    report += `## Errors (${stats.errors.length})\n\n`;
    
    for (const error of stats.errors) {
      report += `- ${error}\n`;
    }
    
    report += '\n';
  }
  
  if (fileRenameMap.size > 0) {
    report += `## File Renames\n\n`;
    
    for (const [oldPath, { newPath }] of fileRenameMap.entries()) {
      report += `- ${path.relative(FRONTEND_ROOT, oldPath)} → ${path.relative(FRONTEND_ROOT, newPath)}\n`;
    }
    
    report += '\n';
  }
  
  if (dirRenameMap.size > 0) {
    report += `## Directory Renames\n\n`;
    
    for (const [oldName, newName] of dirRenameMap.entries()) {
      report += `- ${oldName} → ${newName}\n`;
    }
    
    report += '\n';
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Verify that all imports are correctly updated\n`;
  report += `2. Check that Next.js page routing still works correctly\n`;
  report += `3. Run the TypeScript compiler to catch any missed imports\n`;
  report += `4. Update any dynamic imports that might be using string literals\n`;
  
  if (!DRY_RUN) {
    fs.writeFileSync(reportPath, report);
    console.log(`Report written to: ${reportPath}`);
  } else {
    console.log('\n=== Report Preview ===\n');
    console.log(report);
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Frontend Naming Convention Fixer ${DRY_RUN ? '(DRY RUN)' : ''}\n`);
  
  if (!fs.existsSync(FRONTEND_ROOT)) {
    console.error(`Frontend directory not found: ${FRONTEND_ROOT}`);
    process.exit(1);
  }
  
  try {
    // Create backup first
    await createBackup();
    
    // Start with src directory
    const srcDir = path.join(FRONTEND_ROOT, 'src');
    await processDir(srcDir);
    
    // Update imports in all files
    console.log('\nUpdating imports...');
    await processFilesRecursively(srcDir, updateImports);
    
    // Special handling for Next.js pages
    await updateNextJsPageImports();
    
    // Generate report
    generateReport();
    
    console.log('\nDone!');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

module.exports = {
  standardizeComponentName,
  standardizePageName,
  standardizeServiceName,
  standardizeUtilName,
  standardizeStyleName,
  standardizeDirName,
  convertCase,
  detectCase
};