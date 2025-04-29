# Alive-Db Database Issues and Recommendations

## Overview

This document outlines several issues identified in the Alive-Db database structure and provides recommendations for resolving them. These issues primarily relate to data duplication, inconsistent naming conventions, and structural inefficiencies that could impact data integrity, application performance, and maintainability.

## Critical Issues

### 1. ID Field Duplication

**Problem**: Multiple ID fields in the same tables create confusion and potential data integrity issues.

**Examples**:
- `users` table has `id`, `userId`, and `user_id` columns
- `refresh_tokens` table has both `userId` and `user_id`
- `user_sessions` table has both `userId` and `user_id`
- `user_devices` table has both `userId` and `user_id`

**Impact**:
- Risk of inconsistent data if fields get out of sync
- Wasted storage space
- Confusion for developers
- Potential bugs in application code when referencing the wrong ID field

**Recommendation**:
- Choose a single ID field convention for each table
- Use database triggers to maintain legacy columns during a transition period
- Update application code to use only the standardized ID fields
- Eventually remove redundant ID columns

### 2. Inconsistent Column Naming Conventions

**Problem**: The database mixes camelCase, snake_case, and lowercase naming conventions for columns.

**Examples**:
- `users` table: `isActive` vs. `created_at`
- `user_sessions` table: `isActive`, `is_active`, and `isactive`
- Timestamp fields: `createdAt` vs. `created_at`

**Impact**:
- Reduced code readability
- Increased risk of errors in SQL queries
- Complicates ORM mapping

**Recommendation**:
- Adopt a single naming convention throughout the database (preferably snake_case for PostgreSQL)
- Use triggers to synchronize fields during a transition period
- Update application code to use the standardized naming convention
- Document any temporary mapping solutions

### 3. Duplicate Data Across Tables

**Problem**: Critical user data is duplicated across multiple tables.

**Examples**:
- User identity data (email, names) is duplicated in `users` and `profiles`
- Timestamp fields (created_at/createdAt) are duplicated with different formats

**Impact**:
- Data inconsistency risks
- Update anomalies
- Increased storage requirements
- Confusion around the authoritative data source

**Recommendation**:
- Clearly define which table is the authoritative source for each data point
- Remove duplicate fields or convert them to views/computed columns
- Ensure foreign key constraints enforce referential integrity
- Use triggers if temporary synchronization is needed

### 4. Inconsistent Foreign Key Actions

**Problem**: Foreign key constraints have inconsistent ON DELETE actions.

**Examples**:
- `wallets_user_id_fkey` uses ON DELETE CASCADE
- `fk_wallets_users` has no explicit deletion action
- Both constraints reference the same relationship

**Impact**:
- Unpredictable cascade behavior
- Potential data integrity issues
- Confusion about expected system behavior

**Recommendation**:
- Define a consistent policy for foreign key actions
- Remove duplicate foreign key constraints
- Document the cascading behavior for each relationship

## Moderate Issues

### 5. Inefficient Index Usage

**Problem**: Multiple redundant indexes on the same or similar columns.

**Examples**:
- `wallets` table has both `idx_wallet_address` and `idx_wallets_address`
- `user_sessions` has redundant indexes on user_id columns
- Multiple case-insensitive indexes for wallet addresses

**Impact**:
- Increased storage usage
- Slower write performance
- Unnecessary work during database maintenance

**Recommendation**:
- Audit and consolidate indexes
- Keep only indexes that serve specific query patterns
- Consider partial indexes where appropriate

### 6. Integer vs. UUID Primary Keys

**Problem**: Inconsistent primary key types across related tables.

**Examples**:
- `users` table uses UUID
- `nfts` and `nft_collections` use integers
- `referrals` and `referral_codes` use integers

**Impact**:
- Complicates joins between tables
- Makes referential integrity more complex
- Creates type conversion overhead

**Recommendation**:
- Standardize on a single ID type where possible (preferably UUID)
- For tables that must use different ID types, clearly document the reason

### 7. Missing Type Constraints

**Problem**: Several varchar fields lack length constraints.

**Examples**:
- Many fields like `username`, `email`, etc., are defined as `character varying` without length limits

**Impact**:
- Potential for excessively large data
- Unpredictable storage requirements
- Inconsistent validation between database and application

**Recommendation**:
- Add appropriate length constraints to character fields
- Document the maximum lengths for all text fields

## Implementation Plan

### Phase 1: Documentation and Analysis

1. Create a complete data dictionary documenting all tables, columns, and relationships
2. Identify all application code that interacts with problematic fields
3. Create a test plan to validate changes

### Phase 2: Database Structure Improvements

1. Implement triggers to maintain data consistency during the transition
2. Standardize naming conventions
3. Consolidate redundant indexes
4. Add missing constraints

### Phase 3: Code Updates

1. Update application code to use standardized field names
2. Implement proper validation for field lengths
3. Update queries to use appropriate indexes

### Phase 4: Data Cleanup

1. Remove redundant columns after ensuring application compatibility
2. Verify data integrity across related tables
3. Optimize storage by removing unnecessary indexes

## SQL Fixes

Here are examples of SQL fixes for some of the identified issues:

### Fix 1: Synchronize ID Fields

```sql
-- Create trigger to synchronize user IDs in the users table
CREATE OR REPLACE FUNCTION sync_user_id_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NOT NULL AND NEW.userId IS NULL THEN
        NEW.userId := NEW.id;
    ELSIF NEW.userId IS NOT NULL AND NEW.id IS NULL THEN
        NEW.id := NEW.userId;
    END IF;
    
    IF NEW.id IS NOT NULL THEN
        NEW.user_id := NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_id_fields_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_user_id_fields();
```

### Fix 2: Standardize Naming Conventions

```sql
-- Example migration to rename columns to snake_case
ALTER TABLE users 
  RENAME COLUMN isActive TO is_active,
  RENAME COLUMN isVerified TO is_verified,
  RENAME COLUMN isAdmin TO is_admin,
  RENAME COLUMN walletAddress TO wallet_address,
  RENAME COLUMN referralCode TO referral_code,
  RENAME COLUMN referredById TO referred_by_id,
  RENAME COLUMN referralTier TO referral_tier,
  RENAME COLUMN createdAt TO created_at,
  RENAME COLUMN updatedAt TO updated_at;
```

### Fix 3: Consolidate Redundant Indexes

```sql
-- Drop redundant indexes
DROP INDEX IF EXISTS idx_user_wallet_address;
DROP INDEX IF EXISTS idx_wallets_address;

-- Keep the more specific index
-- idx_users_wallet_address and idx_wallet_address_lower are kept
```

### Fix 4: Add Type Constraints

```sql
-- Add length constraints to character fields
ALTER TABLE users
  ALTER COLUMN username TYPE VARCHAR(50),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN first_name TYPE VARCHAR(100),
  ALTER COLUMN last_name TYPE VARCHAR(100),
  ALTER COLUMN avatar_url TYPE VARCHAR(1024),
  ALTER COLUMN wallet_address TYPE VARCHAR(42);
```

## Conclusion

The Alive-Db database has several structural issues that should be addressed to improve data integrity, performance, and maintainability. The recommendations in this document provide a roadmap for improving the database structure while minimizing impact on the running application. By following the phased approach outlined above, these changes can be implemented with minimal risk and disruption to services.