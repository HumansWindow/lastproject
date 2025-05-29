
# Backend Duplicate Files Fix Plan

This document outlines the duplicate files identified in the backend codebase and provides instructions for addressing these issues.

## 1. Clean Up Backup (.bak) Files

Many service files have corresponding .bak versions that should be removed to avoid confusion.

```bash
# Find and list all .bak files (review before deleting)
find /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend -name "*.bak" -type f

# Remove all .bak files
find /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend -name "*.bak" -type f -delete

# Confirm all .bak files are removed
find /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend -name "*.bak" -type f
```

## 2. Fix Base Controller Duplicates

There are duplicate base controller files:

```bash
# Review both files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app/base.controller.ts \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app/controllers/base.controller.ts

# Keep the one in controllers/ directory as it follows the project structure pattern
# Update any imports of base.controller.ts to point to the controllers/ version
# Then remove the duplicate
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app/base.controller.ts
```

## 3. Fix App Module Duplicates

```bash
# Review both files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app/app.module.ts \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app.module.ts

# Keep the root app.module.ts as this is the standard NestJS location
# Update any imports as needed and remove the duplicate
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/app/app.module.ts
```

## 4. Fix TypeORM Config Duplicates

```bash
# Review both files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/typeorm.config.ts \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/typeorm.config.ts

# Keep the one in src/ directory as it follows standard project structure
# Update any imports and remove the duplicate
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/typeorm.config.ts
```

## 5. Fix Request-with-user Interface Duplicates

```bash
# Review both files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/auth/interfaces/request-with-user.interface.ts \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/shared/interfaces/request-with-user.interface.ts

# Keep the one in shared/ directory as interfaces should be in shared for reuse
# Update any imports and remove the duplicate
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/auth/interfaces/request-with-user.interface.ts
```

## 6. Fix ShahiToken ABI Duplicates

```bash
# Review the files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/abis/shahi-token.abi.json \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/abis/shahiToken.json

diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/abis/shahi-token.abi.json \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/contracts/shahi-token.abi.json

# Standardize the naming and keep only one version in the abis/ directory
# Update any imports and remove the duplicates
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/contracts/shahi-token.abi.json
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/abis/shahiToken.json
```

## 7. Fix Database Initialization Scripts

```bash
# Review the scripts to determine functionality and which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/database-init.js \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/init-db.js

diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/database-init.js \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/initialize-database.js

# Keep the most complete and well-named version (database-init.js)
# Update any references and remove the duplicates
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/init-db.js
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/scripts/initialize-database.js
```

## 8. Fix Main.ts Files

```bash
# Review the main files to determine which is current
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/main.ts \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/main.ts.new

# Keep the current main.ts and remove the .new version after confirming it's not needed
# The .patch file may be needed for patching, so confirm before removing
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/main.ts.new
```

## 9. Fix Blockchain Provider Mock Duplicates

```bash
# Review the mock provider files to determine which to keep
diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.js \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.legacy.js

diff /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.js \
     /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.ts

# Keep the TypeScript version (.ts) as it aligns with the project's TypeScript usage
# Remove the duplicate JS versions after updating any imports
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.js
rm /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/__tests__/blockchain/mock-providers.legacy.js
```

## Implementation Strategy

1. Create backups before making any changes
2. Address one category of duplicates at a time
3. Test the application after each set of changes
4. Update imports and references as needed
5. Document any issues encountered during the cleanup process

## Automated Script

A shell script to automate most of these tasks will be created in the future. For now, manual inspection and cleanup is recommended to ensure nothing important is lost.
