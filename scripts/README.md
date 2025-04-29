# Scripts Directory

This directory contains various utility scripts organized by category for better maintainability and discoverability. Each subdirectory contains scripts related to a specific aspect of the project.

## Directory Structure

### `/database`
Database-related scripts for initialization, migration, and maintenance.
- SQL scripts for schema changes
- Database fix scripts
- Database validation scripts
- Database permissions and authentication
- Timestamp fixes and schema updates

### `/database/schema`
SQL schema definitions and database structure files.

### `/auth`
Authentication-related scripts.
- Wallet authentication fixes and debugging
- Token management scripts
- Authentication validation tools
- User session management

### `/backup`
Backup scripts for the database and other critical components.
- Database backup utilities
- Scheduled backup scripts

### `/id-standardization`
Scripts related to ID standardization across the system.
- ID field standardization scripts
- ID consistency checkers
- Field analysis tools

### `/git`
Git repository maintenance scripts.
- Cleaning repositories
- Managing large files
- Git workflow utilities

### `/development`
Development environment scripts.
- Port management (kill-port)
- Backend start/restart scripts
- Development dependency management
- TypeScript error fixes
- VS Code configuration updates
- Swagger installation and configuration
- Memory and performance optimization

### `/maintenance`
System maintenance scripts.
- Permission fixes
- Symlink management
- Module resolution fixes
- API URL configuration
- Documentation organization
- Service file cleanup

### `/deployment`
Deployment-related scripts.
- Build and deployment automation
- Environment setup scripts
- Release management

### `/frontend`
Frontend-specific scripts.
- Service migration and restructuring
- Component updates
- Import fixes
- TypeScript error resolution

### `/blockchain-tools`
Blockchain-related utilities.
- Minting fixes
- Wallet integration tools
- Blockchain operations

### `/setup`
Setup and initialization scripts.
- Admin wallet setup
- Initial configuration
- First-time setup procedures

### `/testing`
Testing-related scripts.
- Test runners
- Test data setup
- Test environment configuration

### `/logging`
Logging and monitoring scripts.
- Backend logging
- Error tracking
- Performance monitoring

### `/tooling`
General utility scripts that don't fit into other categories.
- General purpose utilities
- Miscellaneous helper scripts

## Usage Guidelines

1. **Keep scripts organized**: When adding new scripts, place them in the appropriate category folder.
2. **Naming convention**: Use descriptive names with hyphens (e.g., `fix-database-permissions.sh`).
3. **Documentation**: Add comments at the beginning of each script explaining its purpose and usage.
4. **Execution permissions**: Make sure scripts are executable with `chmod +x script-name.sh`.

## Special Notes

The blockchain scripts located at `/backend/src/blockchain` are kept in their original location and should not be moved. These scripts are specifically for blockchain contract deployment, compilation and hot wallet management.