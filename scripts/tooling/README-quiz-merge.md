# Quiz Files Merge Tool

This directory contains scripts to help identify and merge duplicate quiz-related files in the project.

## Background

In the backend code, there are two sets of quiz-related files:

1. **Legacy Files** - Located at the root level of their respective folders:
   - `/backend/src/game/entities/quiz-question.entity.ts`
   - `/backend/src/game/services/quiz.service.ts`
   - `/backend/src/game/repositories/quiz.repository.ts`

2. **Modern Files** - Located in organized subfolders:
   - `/backend/src/game/entities/quiz/quiz.entity.ts`
   - `/backend/src/game/entities/quiz/quiz-question.entity.ts`
   - `/backend/src/game/services/quiz/quiz.service.ts`
   - `/backend/src/game/repositories/quiz/quiz.repository.ts`

The modern files are more complete and aligned with the database schema defined in the migration files. The goal is to standardize on the modern file structure and remove the legacy duplicates.

## Scripts

### 1. `merge-quiz-duplicates.js`

This script analyzes the codebase to identify:
- All quiz-related files (both legacy and modern)
- Files that import these quiz files
- A migration plan for updating imports to use the modern file structure

#### Usage

```bash
# Make the scripts executable
chmod +x ./scripts/tooling/merge-quiz-duplicates.js
chmod +x ./scripts/tooling/merge-quiz-files.js

# Run the analysis script
node ./scripts/tooling/merge-quiz-duplicates.js
```

The script will:
- Generate a detailed analysis of quiz-related files in the codebase
- Save the analysis to a report file named `quiz-duplicate-analysis-{timestamp}.json` in the project root
- Display a summary of findings in the console

### 2. `merge-quiz-files.js`

This script executes the migration plan created by the first script:
- Updates import statements in files to use the modern quiz file structure
- Creates backups of all files before modifying them
- Optionally removes the legacy files after confirmation

#### Usage

```bash
# Run the migration script, providing the path to the analysis report
node ./scripts/tooling/merge-quiz-files.js ./quiz-duplicate-analysis-{timestamp}.json
```

## Recommended Process

1. Run `merge-quiz-duplicates.js` to analyze the codebase
2. Review the generated analysis report
3. Run `merge-quiz-files.js` to execute the migration
4. Verify that the application still works correctly after the migration
5. Remove any remaining references to legacy quiz files in the codebase

## Backups

Before any changes are made:
- The migration script creates backups of all files in a timestamped directory
- Legacy files are backed up before removal
- All backups are stored in the `/backups/quiz-migration-{timestamp}/` directory

## Troubleshooting

If you encounter issues:
1. Check the backups to restore any files if needed
2. Review the error messages printed by the scripts
3. Manually inspect files that had errors during processing