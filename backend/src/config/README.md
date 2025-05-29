# Configuration Files

This directory contains the centralized configuration files for the backend application. All configuration files have been consolidated here to maintain a cleaner and more maintainable codebase.

## Configuration Files Overview

| File | Purpose |
|------|---------|
| `typeorm.config.ts` | Main database connection configuration for TypeORM |
| `migration.config.ts` | Configuration for database migrations |
| `development.config.ts` | Development environment specific configuration |
| `test-database.config.ts` | Test database configuration for automated tests |

## Backward Compatibility

For backward compatibility, symlinks have been created in the original locations:
- `/backend/typeorm.config.ts` → `src/config/typeorm.config.ts`
- `/backend/src/typeorm.config.ts` → `config/typeorm.config.ts`
- `/backend/migration.config.ts` → `src/config/migration.config.ts`

A JavaScript version of the migration config (`migration.config.js`) is also maintained in the project root for scripts that use CommonJS imports.

## Configuration Guidelines

1. **All configuration changes should be made to the files in this directory**
   - Do not modify the symlinked files directly

2. **Environment Variables**
   - All sensitive settings should be controlled via environment variables
   - Default values should be development-friendly but secure

3. **Documentation**
   - Any significant changes to configuration should be documented with comments
   - Keep the README updated with new configuration options

## Adding New Configuration Files

When adding new configuration files, please:

1. Follow the naming convention: `feature.config.ts`
2. Place the file in this directory
3. Add documentation in this README
4. Use environment variables for sensitive or environment-specific values
