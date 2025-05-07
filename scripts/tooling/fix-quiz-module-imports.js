#!/usr/bin/env node

/**
 * Script to specifically fix the imports in game.module.ts and remove quiz-compat.ts
 * 
 * This script will:
 * 1. Update the imports in game.module.ts to directly use the modern quiz files
 * 2. Ensure all quiz entities are properly registered in the TypeORM entities array
 * 3. Back up the original file before modifying
 * 4. Remove the quiz-compat.ts file if present (after backing it up)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'backups/quiz-migration');
const GAME_MODULE_PATH = path.join(PROJECT_ROOT, 'backend/src/game/game.module.ts');
const QUIZ_COMPAT_PATH = path.join(PROJECT_ROOT, 'backend/src/game/entities/quiz-compat.ts');

// Helper functions
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createBackup(filePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `${BACKUP_DIR}-${timestamp}`;
  
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const backupPath = path.join(backupDir, relativePath);
  
  ensureDirectoryExists(path.dirname(backupPath));
  fs.copyFileSync(filePath, backupPath);
  
  return backupPath;
}

function updateGameModule() {
  if (!fs.existsSync(GAME_MODULE_PATH)) {
    console.error(`Game module file not found: ${GAME_MODULE_PATH}`);
    return false;
  }

  // Create backup
  const backupPath = createBackup(GAME_MODULE_PATH);
  console.log(`Created backup of game.module.ts at: ${path.relative(PROJECT_ROOT, backupPath)}`);
  
  // Read the file content
  let content = fs.readFileSync(GAME_MODULE_PATH, 'utf-8');
  
  // Regular expressions for matching import patterns
  const legacyQuizImportsRegex = /\/\/ Legacy quiz entities.*?\n(import.*?quiz.*?\n)+/s;
  const newQuizImportsRegex = /\/\/ New quiz entities.*?\n(import.*?quiz.*?\n)+/s;
  
  // Check if we have both legacy and new imports
  const hasLegacyImports = legacyQuizImportsRegex.test(content);
  const hasNewImports = newQuizImportsRegex.test(content);
  
  if (!hasLegacyImports && !hasNewImports) {
    console.log('No quiz imports found in game.module.ts');
    return false;
  }
  
  // Generate new import statements
  const newImports = `// Quiz entities
import { Quiz } from './entities/quiz/quiz.entity';
import { QuizQuestion } from './entities/quiz/quiz-question.entity';
import { QuizSession } from './entities/quiz/quiz-session.entity';
import { UserQuizResponse } from './entities/quiz/user-quiz-response.entity';`;

  // Replace both legacy and new imports with our standardized imports
  if (hasLegacyImports) {
    content = content.replace(legacyQuizImportsRegex, newImports + '\n');
  }

  if (hasNewImports && hasLegacyImports) {
    // If we already replaced the legacy section with our new imports,
    // we should now remove the redundant "New quiz entities" section
    content = content.replace(newQuizImportsRegex, '');
  } else if (hasNewImports) {
    // If only the new imports section exists, replace it with our standardized imports
    content = content.replace(newQuizImportsRegex, newImports + '\n');
  }
  
  // Update TypeORM entity registration
  const typeOrmEntitiesRegex = /(TypeOrmModule\.forFeature\(\[[\s\S]*?)\]/s;
  if (typeOrmEntitiesRegex.test(content)) {
    let entitiesSection = content.match(typeOrmEntitiesRegex)[1];
    
    // Check if Quiz entities are already included
    const quizEntityNames = ['Quiz', 'QuizQuestion', 'QuizSession', 'UserQuizResponse'];
    const missingEntities = quizEntityNames.filter(entity => !entitiesSection.includes(entity));
    
    if (missingEntities.length > 0) {
      // Add missing entities to the TypeORM registration
      const newEntitiesSection = entitiesSection + missingEntities.join(', ') + ']';
      content = content.replace(typeOrmEntitiesRegex, newEntitiesSection);
      console.log(`Added missing entities to TypeORM registration: ${missingEntities.join(', ')}`);
    }
  }
  
  // Write the updated content to the file
  fs.writeFileSync(GAME_MODULE_PATH, content);
  console.log('Updated game.module.ts imports to use modern quiz entity files');
  
  return true;
}

function removeQuizCompat() {
  if (!fs.existsSync(QUIZ_COMPAT_PATH)) {
    console.log('No quiz-compat.ts file found, nothing to remove');
    return false;
  }
  
  // Create backup
  const backupPath = createBackup(QUIZ_COMPAT_PATH);
  console.log(`Created backup of quiz-compat.ts at: ${path.relative(PROJECT_ROOT, backupPath)}`);
  
  // Remove the file
  fs.unlinkSync(QUIZ_COMPAT_PATH);
  console.log('Removed quiz-compat.ts file');
  
  return true;
}

// Main function
async function main() {
  console.log('Starting quiz module import fixes...');
  
  // Ensure backup directory exists
  ensureDirectoryExists(BACKUP_DIR);
  
  // Update the game.module.ts file
  const updatedModule = updateGameModule();
  
  // Remove quiz-compat.ts file
  const removedCompat = removeQuizCompat();
  
  if (updatedModule || removedCompat) {
    console.log('\nSuccessfully updated quiz module imports!');
  } else {
    console.log('\nNo changes were needed for quiz module imports.');
  }
}

main().catch(error => {
  console.error('\nError running the script:', error);
  process.exit(1);
});