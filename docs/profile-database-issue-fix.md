# Profile Database Issue Fix: userId vs user_id Field Problem

## Issue Summary

**Date:** April 26, 2025  
**Issue:** Database error in profile completion functionality  
**Error Message:** `record "new" has no field "userId"`  
**Status:** Resolved

## Problem Description

Users were unable to complete their profiles through both:
- `/profile/complete` endpoint
- `/profile/complete-later` endpoint

The error occurred in the database layer, where a trigger on the `profiles` table was attempting to reference a field named `userId`, but the actual column name in the table is `user_id` (with an underscore).

## Root Cause Analysis

1. The application uses `snake_case` for database fields (e.g., `user_id`) but a database trigger was written using `camelCase` (e.g., `userId`).

2. When attempting to insert or update profile records, the trigger function `sync_profile_user_id()` was trying to access a non-existent field `userId` in the NEW record.

3. This trigger inconsistency was preventing users from:
   - Completing their profiles
   - Deferring profile completion with the "complete later" option

## Diagnostic Logs

The error manifested in database operations:

```
query failed: INSERT INTO "public"."profiles"("id", "user_id"...) VALUES (DEFAULT, $1, DEFAULT...)
error: record "new" has no field "userId"
```

During profile completion attempts, the application would try to create a profile record, but the database trigger would fail when trying to access `userId`.

## Resolution

A SQL fix script (`fix-profile-user-id-field.sql`) was created and executed to address the issue:

1. **Identified problematic triggers**: The script scanned all triggers on the `profiles` table and identified the problematic one (`trigger_sync_profile_user_id`) that was referencing the incorrect field name.

2. **Fixed trigger functions**: The problematic trigger was dropped, as it was causing the error and contained references to the incorrect field name.

3. **Added field validation**: A new trigger function `fix_profile_id_fields()` was created to ensure the `user_id` field is never null, providing proper validation without using the incorrect field name.

4. **Applied database changes**: The fix was successfully applied to the production database, showing the following results:
   ```
   Found 3 triggers on profiles table
   Trigger: trigger_sync_profile_user_id, Function: sync_profile_user_id
   Function sync_profile_user_id contains userId references, fixing...
   Dropped trigger trigger_sync_profile_user_id
   Trigger: RI_ConstraintTrigger_c_16677, Function: RI_FKey_check_ins
   Trigger: RI_ConstraintTrigger_c_16678, Function: RI_FKey_check_upd
   After fixes: 3 triggers on profiles table
   Profile field synchronization fix completed successfully
   ```

## Verification

After applying the fix:
1. Users are now able to complete their profiles successfully
2. The "complete later" functionality works properly
3. The database maintains integrity with the constraint that `user_id` cannot be null

## Recommendations for Future Development

We've implemented all of the following recommendations to prevent similar issues in the future:

1. ✅ **Standardize naming conventions**: Created a comprehensive naming conventions document at `/docs/standards/naming-conventions.md` that covers database, code, and API endpoint naming standards.

2. ✅ **Database trigger auditing**: Implemented a script at `/scripts/audit-database-triggers.sh` that automatically detects naming inconsistencies in database triggers, their function bodies, and field references.

3. ✅ **Enhanced error handling**: Developed a robust `ProfileErrorHandlerService` that specifically detects field naming inconsistencies and provides descriptive error messages to assist debugging.

4. ✅ **Naming convention documentation**: Created detailed documentation about naming conventions to avoid similar issues, including proper TypeORM entity-to-database field mapping practices.

5. ✅ **Automated tests**: Added comprehensive test coverage:
   - Unit tests for profile service (`profile-completion.test.ts`)
   - Integration tests for profile controller (`profile-controller.integration.test.ts`)
   - End-to-end tests for profile completion workflow (`profile-completion.e2e-spec.ts`)

## Implementation Details

### 1. Standardized Naming Conventions

Created a detailed naming conventions document that covers:
- Database naming (tables, columns, indexes, constraints, triggers)
- Code naming (variables, classes, interfaces, constants)
- ORM mapping guidelines to prevent inconsistencies between code and database

### 2. Database Trigger Auditing

The `audit-database-triggers.sh` script analyzes:
- Trigger function bodies for camelCase references
- Naming consistency in function and trigger definitions
- Potential inconsistencies between application code and database schema

### 3. Enhanced Error Handling

Implemented a specialized error handler that:
- Captures database field naming inconsistencies
- Provides detailed error messages with suggested fixes
- Logs comprehensive diagnostic information for debugging
- Differentiates between regular errors and schema inconsistencies

### 4. Automated Testing

Added tests that specifically check:
- Profile creation with proper error handling
- Profile completion workflow end-to-end
- "Complete later" functionality
- Handling of field naming inconsistencies
- Robust error reporting for developers

## Additional Fixes Implemented

### Database Configuration Update

In addition to fixing the database trigger issue, we identified and corrected an inconsistency in the database connection password:

1. **Authentication Issue**: The PostgreSQL database connection was failing with the error:
   ```
   psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: FATAL: password authentication failed for user "Aliveadmin"
   ```

2. **Root Cause**: The password in the `.env` file was inconsistently formatted compared to the actual database configuration:
   - Incorrect format in config: `alivehumans@2024` (lowercase 'h')
   - Correct format in database: `aliveHumans@2024` (capital 'H')

3. **Resolution**: 
   - Updated the `.env` file with the correct password format
   - Ran `fix-postgres-auth.sh` script to ensure consistent authentication settings
   - Verified connection using the corrected password

4. **Verification**: Successfully connected to the database and confirmed the fixed triggers on the profiles table:
   ```
   tgname                     |        proname        
   ---------------------------+-----------------------
   RI_ConstraintTrigger_c_16677 | RI_FKey_check_ins
   RI_ConstraintTrigger_c_16678 | RI_FKey_check_upd
   ensure_profile_id_fields   | fix_profile_id_fields
   ```

## Next Steps

While the main recommendations have been implemented, the following additional tasks should be considered for ongoing improvement:

1. **Integration with CI/CD pipeline**:
   - Add the database trigger audit script to CI/CD workflows
   - Configure pre-commit hooks to run naming convention checks
   - Set up automated testing for the profile completion flow

2. **Developer training**:
   - Schedule knowledge sharing session about the naming conventions
   - Review the naming conventions documentation with the team
   - Ensure all developers understand the importance of consistent field naming

3. **Regular audits**:
   - Set up quarterly reviews of database schema consistency
   - Monitor profile completion error rates
   - Periodically review database trigger functions

4. **Further codebase standardization**:
   - Extend naming convention standardization to other modules
   - Consider implementing a code generator for entity-to-database mapping
   - Refactor existing inconsistent code based on the new standards

### Project-Specific Notes

1. The project uses both `DB_PASSWORD` and `DATABASE_PASSWORD` in different configuration files. Ensure both are updated with the correct format `aliveHumans@2024`.

2. Remember to restart any services that might be caching database connection details after updating configuration files.

3. Consider implementing the standardization plan detailed in `id-standardization-plan.md` to prevent similar issues in the future.

## Implementation Status Summary

| Recommendation | Status | Details |
|---------------|--------|---------|
| Naming conventions | ✅ Completed | Documentation created at `/docs/standards/naming-conventions.md` |
| Database trigger auditing | ✅ Completed | Script implemented at `/scripts/audit-database-triggers.sh` |
| Enhanced error handling | ✅ Completed | `ProfileErrorHandlerService` created and integrated |
| Naming convention docs | ✅ Completed | Comprehensive documentation created |
| Automated tests | ✅ Completed | Unit, integration, and E2E tests implemented |
| CI/CD Integration | ⏳ Pending | To be completed in future sprint |
| Developer training | ⏳ Pending | Schedule training session |
| Regular audits | ⏳ Pending | Set up monitoring and review schedule |
| Further standardization | ⏳ Pending | Apply to other modules |

This completes the implementation of all initially recommended fixes, with additional enhancements planned for future work.