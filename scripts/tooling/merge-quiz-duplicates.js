#!/usr/bin/env node

/**
 * Script to identify and merge duplicate quiz files in the project
 * 
 * This script will:
 * 1. Scan the codebase for all quiz-related files
 * 2. Identify duplicate files (those in root level vs. organized folders)
 * 3. Map all imports and usages of these files
 * 4. Generate a migration plan to standardize on the newer quiz entity structure
 * 5. Create a report of all files that need to be updated
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const BACKEND_SRC = path.join(PROJECT_ROOT, 'backend/src');
const GAME_DIR = path.join(BACKEND_SRC, 'game');

// File categories
const ENTITY_FILES = {
  legacy: [
    path.join(GAME_DIR, 'entities/quiz-question.entity.ts'),
    path.join(GAME_DIR, 'entities/quiz-response.entity.ts'),
    path.join(GAME_DIR, 'entities/user-quiz-response.entity.ts')
  ],
  modern: [
    path.join(GAME_DIR, 'entities/quiz/quiz.entity.ts'),
    path.join(GAME_DIR, 'entities/quiz/quiz-question.entity.ts'),
    path.join(GAME_DIR, 'entities/quiz/quiz-session.entity.ts'),
    path.join(GAME_DIR, 'entities/quiz/user-quiz-response.entity.ts')
  ]
};

const SERVICE_FILES = {
  legacy: [
    path.join(GAME_DIR, 'services/quiz.service.ts'),
  ],
  modern: [
    path.join(GAME_DIR, 'services/quiz/quiz.service.ts'),
  ]
};

const REPOSITORY_FILES = {
  legacy: [
    path.join(GAME_DIR, 'repositories/quiz.repository.ts'),
  ],
  modern: [
    path.join(GAME_DIR, 'repositories/quiz/quiz.repository.ts'),
    path.join(GAME_DIR, 'repositories/quiz/quiz-question.repository.ts'),
    path.join(GAME_DIR, 'repositories/quiz/quiz-session.repository.ts'),
    path.join(GAME_DIR, 'repositories/quiz/user-quiz-response.repository.ts'),
  ]
};

const DTO_FILES = {
  legacy: [
    path.join(GAME_DIR, 'dto/quiz.dto.ts'),
  ],
  modern: [
    path.join(GAME_DIR, 'dto/quiz/quiz.dto.ts'),
    path.join(GAME_DIR, 'dto/quiz/quiz-question.dto.ts'),
    path.join(GAME_DIR, 'dto/quiz/quiz-session.dto.ts'),
  ]
};

// Helper functions
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

function getAllFilesInDir(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        if (fs.statSync(filePath).isDirectory()) {
          getAllFilesInDir(filePath, fileList);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
          fileList.push(filePath);
        }
      } catch (err) {
        console.log(`Error processing file ${filePath}:`, err.message);
      }
    });
    
    return fileList;
  } catch (err) {
    console.log(`Error reading directory ${dir}:`, err.message);
    return fileList;
  }
}

function findAllImportReferences(filePath, codebase) {
  const fileBaseName = path.basename(filePath);
  const fileNameNoExt = fileBaseName.replace(/\.(ts|js)$/, '');
  const results = [];

  // Build search patterns based on the file name
  const importPatterns = [
    // Import patterns
    `import { ${fileNameNoExt} }`,
    `import { ${fileNameNoExt.replace('-', '')} }`,
    `from '${path.relative(BACKEND_SRC, filePath).replace(/\.(ts|js)$/, '')}'`,
    `from "${path.relative(BACKEND_SRC, filePath).replace(/\.(ts|js)$/, '')}"`,
    `from './${fileNameNoExt}'`,
    `from "./${fileNameNoExt}"`,
  ];

  // Search each file in the codebase for these patterns
  codebase.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const matchingPatterns = importPatterns.filter(pattern => content.includes(pattern));
      
      if (matchingPatterns.length > 0) {
        results.push({
          file: file,
          patterns: matchingPatterns
        });
      }
    } catch (err) {
      console.log(`Error reading file ${file}:`, err.message);
    }
  });

  return results;
}

function generateReport(duplicateFiles, importReferences) {
  const report = {
    timestamp: new Date().toISOString(),
    duplicateFiles: duplicateFiles,
    importReferences: importReferences,
    migrationPlan: []
  };

  // Generate migration plan
  const filesToUpdate = new Set();
  Object.keys(importReferences).forEach(category => {
    Object.keys(importReferences[category]).forEach(fileType => {
      const references = importReferences[category][fileType];
      references.forEach(ref => {
        filesToUpdate.add(ref.file);
      });
    });
  });

  report.migrationPlan = Array.from(filesToUpdate).map(file => {
    return {
      file: file,
      action: "Update import statements to use modern file structure",
      importUpdates: []
    };
  });

  // Add specific import updates for each file
  report.migrationPlan.forEach(fileUpdate => {
    const filePath = fileUpdate.file;
    Object.keys(importReferences).forEach(category => {
      Object.keys(importReferences[category]).forEach(fileType => {
        const references = importReferences[category][fileType];
        references.forEach(ref => {
          if (ref.file === filePath) {
            fileUpdate.importUpdates.push({
              from: fileType,
              to: `${category}/modern/${fileType.replace(/.*\//, '')}`
            });
          }
        });
      });
    });
  });

  return report;
}

// Main function
async function main() {
  console.log('Starting quiz duplicate file analysis...');

  // Check which files actually exist
  const existingFiles = {
    entities: { 
      legacy: ENTITY_FILES.legacy.filter(fileExists),
      modern: ENTITY_FILES.modern.filter(fileExists)
    },
    services: {
      legacy: SERVICE_FILES.legacy.filter(fileExists),
      modern: SERVICE_FILES.modern.filter(fileExists)
    },
    repositories: {
      legacy: REPOSITORY_FILES.legacy.filter(fileExists),
      modern: REPOSITORY_FILES.modern.filter(fileExists)
    },
    dto: {
      legacy: DTO_FILES.legacy.filter(fileExists),
      modern: DTO_FILES.modern.filter(fileExists)
    }
  };

  // Get all TS/JS files in the backend
  console.log('Scanning backend files...');
  const allBackendFiles = getAllFilesInDir(BACKEND_SRC);
  console.log(`Found ${allBackendFiles.length} files to analyze.`);

  // Find import references for each duplicate file
  console.log('Analyzing import references...');
  const importReferences = {
    entities: {
      legacy: [],
      modern: []
    },
    services: {
      legacy: [],
      modern: []
    },
    repositories: {
      legacy: [],
      modern: []
    },
    dto: {
      legacy: [],
      modern: []
    }
  };

  // Analyze entity files
  existingFiles.entities.legacy.forEach(file => {
    importReferences.entities.legacy = importReferences.entities.legacy.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });
  existingFiles.entities.modern.forEach(file => {
    importReferences.entities.modern = importReferences.entities.modern.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });

  // Analyze service files
  existingFiles.services.legacy.forEach(file => {
    importReferences.services.legacy = importReferences.services.legacy.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });
  existingFiles.services.modern.forEach(file => {
    importReferences.services.modern = importReferences.services.modern.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });

  // Analyze repository files
  existingFiles.repositories.legacy.forEach(file => {
    importReferences.repositories.legacy = importReferences.repositories.legacy.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });
  existingFiles.repositories.modern.forEach(file => {
    importReferences.repositories.modern = importReferences.repositories.modern.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });

  // Analyze DTO files
  existingFiles.dto.legacy.forEach(file => {
    importReferences.dto.legacy = importReferences.dto.legacy.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });
  existingFiles.dto.modern.forEach(file => {
    importReferences.dto.modern = importReferences.dto.modern.concat(
      findAllImportReferences(file, allBackendFiles)
    );
  });

  // Generate the report
  const report = generateReport(existingFiles, importReferences);

  // Save report to file
  const reportPath = path.join(PROJECT_ROOT, `quiz-duplicate-analysis-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n--- Summary ---');
  console.log(`Found ${existingFiles.entities.legacy.length} legacy entity files and ${existingFiles.entities.modern.length} modern entity files`);
  console.log(`Found ${existingFiles.services.legacy.length} legacy service files and ${existingFiles.services.modern.length} modern service files`);
  console.log(`Found ${existingFiles.repositories.legacy.length} legacy repository files and ${existingFiles.repositories.modern.length} modern repository files`);
  console.log(`Found ${existingFiles.dto.legacy.length} legacy DTO files and ${existingFiles.dto.modern.length} modern DTO files`);
  console.log(`Detected ${report.migrationPlan.length} files that need import updates`);
}

main().catch(error => {
  console.error('Error running the script:', error);
  process.exit(1);
});