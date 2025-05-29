# Configuration Files Conflict Resolution Plan

## Overview

After analyzing the project structure, we've identified several configuration files with potential conflicts or duplications. This document outlines these conflicts and provides a plan to consolidate them to maintain a cleaner and more maintainable codebase.

## Identified Conflicts

### Database Configuration Files

1. **TypeORM Configuration Files:**
   - `/backend/typeorm.config.ts`
   - `/backend/src/typeorm.config.ts`
   - `/backend/src/config/typeorm.config.ts`
   - Multiple other database configurations

2. **Migration Configuration Files:**
   - `/backend/migration.config.ts`
   - `/backend/migration.config.js` (TypeScript and JavaScript versions)
   - `/backend/src/config/migration.config.ts`

3. **Development/Test Database Configuration:**
   - `/backend/src/config/development.config.ts`
   - `/backend/src/config/test-database.config.ts`
   - `/backend/src/config/database.config.ts`

### Other Configuration Conflicts

1. **Swagger Configuration:**
   - Referenced in structure files as `src/swagger.config.ts`
   - Found as `/backend/src/swagger-config.ts` (with a hyphen instead of a dot)

2. **CORS Configuration:**
   - `/backend/src/config/cors.config.ts`
   - `/backend/src/shared/config/cors.config.ts`

## Resolution Plan

### 1. Database Configuration Consolidation

#### TypeORM Configuration

**Keep:** `/backend/src/config/typeorm.config.ts`

**Action Items:**
- Review all TypeORM config files and merge any unique settings into the main file
- Update all imports and references to use the main file
- Create symlinks if necessary for backward compatibility
- Remove duplicate files after ensuring all references are updated

#### Migration Configuration

**Keep:** `/backend/src/config/migration.config.ts`

**Action Items:**
- Consolidate JavaScript and TypeScript versions
- Update npm scripts in package.json to reference the correct file
- Remove duplicate files

### 2. Other Configuration Consolidation

#### Swagger Configuration

**Keep:** `/backend/src/swagger-config.ts` (or rename to follow convention)

**Action Items:**
- Decide on the naming convention (hyphen vs dot)
- Rename to follow project standards
- Update all references

#### CORS Configuration

**Keep:** `/backend/src/shared/config/cors.config.ts`

**Action Items:**
- Ensure all unique settings are merged
- Update imports and references
- Remove duplicate file

### 3. General Configuration Guidelines

1. **Establish a consistent naming convention:**
   - Example: `feature.config.ts` vs `feature-config.ts`
   - Apply consistently across the project

2. **Centralize configuration files:**
   - Consider moving all configuration files to a single directory like `/backend/src/config/`
   - For frontend, use `/frontend/src/config/`

3. **Document configuration structure:**
   - Create a README in each config folder explaining the purpose of each file
   - Add comments in config files explaining critical settings

4. **Version control strategy:**
   - For sensitive configs, use `.env` files with `.env.example` templates
   - Ensure proper gitignore patterns for sensitive configuration

## Implementation Priorities

1. First, create backups of all configuration files
2. Consolidate database configurations (highest priority)
3. Update all references to use the consolidated files
4. Implement automated tests to verify functionality after changes
5. Remove duplicate files only after confirming everything works

## Tracking

| Configuration Type | Original Files | Consolidated File | Status | Owner |
|-------------------|----------------|------------------|--------|-------|
| TypeORM Config | 3+ files | `/backend/src/config/typeorm.config.ts` | ✅ Completed | Script |
| Migration Config | 3 files | `/backend/src/config/migration.config.ts` | ✅ Completed | Script |
| Swagger Config | 1 file (naming issue) | `/backend/src/swagger.config.ts` | ✅ Completed | Script |
| CORS Config | 2 files | `/backend/src/shared/config/cors.config.ts` | ✅ Completed | Script |

## Next Steps

1. ✅ ~~Assign owners for each consolidation task~~ - Completed via automation script
2. ✅ ~~Create detailed implementation plans for each configuration type~~ - Implemented with script
3. Schedule code review sessions to verify consolidation
4. ✅ ~~Update documentation to reflect the new configuration structure~~ - Created README.md in config directory

## Completion Report

The configuration consolidation has been successfully completed:

1. **TypeORM Configuration**
   - Consolidated into `/backend/src/config/typeorm.config.ts`
   - Enhanced with better error handling and environment variable support
   - Added backward compatibility symlinks

2. **Migration Configuration** 
   - Consolidated into `/backend/src/config/migration.config.ts`
   - Created CommonJS version for scripts that use require()
   - Updated package.json references

3. **Swagger Configuration**
   - Standardized naming convention to `swagger.config.ts`

4. **CORS Configuration**
   - Using the more comprehensive version in `src/shared/config/cors.config.ts`

5. **Documentation**
   - Added README in config directory
   - Updated this tracking document

**Date Completed:** May 25, 2025
