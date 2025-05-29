# Frontend Naming Convention Fixer

This script standardizes naming conventions across the frontend codebase to ensure consistency and improve maintainability.

## Features

The script automatically fixes the following naming convention issues:

1. **File Naming**:
   - React components: `PascalCase.tsx`
   - Next.js pages: `kebab-case.tsx` (except special files like `_app.tsx`, `_document.tsx`)
   - Utility files: `camelCase.ts`
   - Service files: `camelCase.service.ts`
   - Type definitions: `camelCase.types.ts`
   - CSS modules: `ComponentName.module.css`

2. **Directory Naming**:
   - Component directories: `kebab-case`
   - Service module directories: `kebab-case`
   - Page directories: `kebab-case`

3. **React Component Naming**:
   - Ensures component filenames match their exported component names
   - Components are named using PascalCase
   - Updates imports across the codebase to reflect naming changes

4. **Service Module Structure**:
   - Standardizes service module organization
   - Fixes inconsistencies in service module paths

## Usage

Run the script from the project root:

```bash
# First do a dry run to see what would change without actually changing anything
cd /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject
node scripts/db-refactoring/fronend/fix-frontend-naming.js --dry-run

# Once you're satisfied with the proposed changes, run it for real
node scripts/db-refactoring/fronend/fix-frontend-naming.js
```

## Options

- `--dry-run`: Show what changes would be made without actually making them
- `--verbose`: Show detailed information about file operations

## Backup

Before making any changes, the script creates a backup of your frontend code in:

```
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backups/frontend/backup-[TIMESTAMP]
```

## Report

After execution, the script generates a comprehensive report detailing:
- Summary of changes made (number of files and directories renamed)
- Any errors encountered during the process
- List of specific files and directories that were renamed
- Recommended next steps

The report is saved to:

```
/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/scripts/db-refactoring/fronend/frontend-naming-report-[TIMESTAMP].md
```

## Caution

- Always run the script with `--dry-run` first to review changes
- Make sure you commit your code before running the script
- After running, verify that all imports are correctly updated
- Check that Next.js routing still works as expected
- Run the TypeScript compiler to catch any missed imports

## Common Issues

1. **Missing imports**: If some imports are not automatically updated, they may use dynamic imports with string literals. Look for patterns like `import(`.../path/${dynamicPath})`

2. **Next.js routing**: Special attention is required for pages that rely on exact filenames for routing

3. **Dynamic component references**: Components referenced via string names in code might need manual updating

## Example Fixes

1. Component file named `websocket-status.tsx` with a component named `WebSocketStatus` will be renamed to `WebSocketStatus.tsx`

2. Page file named `WebSocketDemo.tsx` in the pages directory will be renamed to `web-socket-demo.tsx`

3. Service file named `WalletService.ts` that exports a class named `WalletService` will be renamed to `wallet.service.ts`

4. Directory named `WebSocketServices` will be renamed to `web-socket-services`

5. CSS module named `wallet-connect.module.css` with a corresponding component `WalletConnect.tsx` will be renamed to `WalletConnect.module.css`