# Database Problems and Solutions

## Problem Summary
We faced several issues with the database configuration that prevented wallet authentication from working correctly:

1. Database tables were missing or had incorrect column names
2. Naming convention mismatch between TypeORM entities (camelCase) and PostgreSQL tables (snake_case)
3. Missing essential tables for wallet authentication
4. Missing admin user with a valid wallet address for testing

## Solution Steps

### 1. Proper Database Initialization

We created a complete SQL initialization script (`initialize-db.sql`) that:
- Created all necessary tables with proper schemas:
  - users
  - wallets
  - profiles
  - user_devices
  - user_sessions
  - refresh_tokens
- Added appropriate constraints and foreign keys
- Created indexes for efficient queries

### 2. Column Naming Conventions Fix

We created multiple scripts to address column naming issues:

1. `fix-column-names.sql` - Initial script to:
   - Rename all snake_case columns to camelCase
   - Ensure compatibility with TypeORM entity definitions
   - Fix the issue with `walletAddress` not being found

2. `complete-db-fix.sql` - Comprehensive script that:
   - Fixed columns across all tables
   - Added any missing columns
   - Ensured proper data types and constraints
   - Added test admin user if missing

3. `improved-db-fix.sql` - Robust idempotent script that:
   - Safely handles column renames with checks
   - Can be run multiple times without errors
   - Provides detailed logging of actions taken
   - Handles special cases like duplicate columns

Example changes:
```sql
ALTER TABLE users RENAME COLUMN wallet_address TO "walletAddress";
ALTER TABLE users RENAME COLUMN is_verified TO "isVerified";
```

### 3. User Sessions and Devices Fix

We created specialized scripts to fix issues with user sessions and devices:

1. `fix-user-sessions.sql` - Ensured user_sessions table has the correct schema:
   - Added missing columns
   - Created indexes for better performance
   - Added foreign key constraints

2. `fix-user-sessions.sh` - Shell script that:
   - Safely applies SQL fixes
   - Uses proper PostgreSQL authentication
   - Falls back to sudo if needed

We also updated related TypeORM entities to ensure consistency:
- Fixed `UserSession` entity (user-session.entity.ts)
- Updated `UserSessionsService` to use correct column names in SQL queries

### 4. Initial Admin User Setup

We added an initial admin user for testing:
- User with role `admin`
- Wallet address: `0x0749c7b218948524cab3e892eba5e60b0b95caee`
- Associated wallet record in the `wallets` table
- Associated profile record in the `profiles` table

### 5. MerkleTree Integration

We ensured the MerkleTree service was properly initialized:
- Fixed the database queries to work with the new schema
- Properly loaded the admin wallet address into the MerkleTree
- Ensured the service could generate and verify proofs for wallet authentication

## Verification Steps

1. Created and ran the SQL initialization script
2. Created and ran multiple column naming fix scripts:
   - `fix-column-names.sql` for basic fixes
   - `complete-db-fix.sql` for comprehensive fixes
   - `improved-db-fix.sql` for safe, idempotent fixes
3. Fixed user sessions and devices with `fix-user-sessions.sql`
4. Updated TypeORM entities to align with database schema
5. Restarted the backend server and verified no database errors
6. Confirmed the MerkleTree service loaded the wallet address properly
7. Server is now running at: http://localhost:3001
8. API Documentation available at: http://localhost:3001/api/docs

## Configuration Updates

We ensured the following environment variables in `.env` were properly set:
```
DB_USERNAME=Aliveadmin
DB_PASSWORD=alivehumans@2024
DB_DATABASE=Alive-Db
```

## Future Improvements

1. Create a migration script for new database changes
2. Add error handling for wallet address not found in MerkleTree
3. Implement user onboarding flow for new wallet connections
4. Add device verification for enhanced security
5. Improve error messages for wallet authentication failures
6. Create a database verification tool to detect schema drift
7. Implement consistent naming conventions for all new database tables and columns