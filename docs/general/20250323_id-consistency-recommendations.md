# ID Field Consistency Recommendations
Generated on: Mon Mar 24 12:25:39 AM +1345 2025

## Summary

Overall Consistency Score: 85/100

## Key Findings

### Primary Key Types
- UUID primary keys: 11
- Auto-increment primary keys: 1
- Dominant type: UUID

### ID Field Usage Patterns
- Methods using 'id' parameter: 1
- Methods using 'userId' parameter: 5
- Controllers using req.user.id: 4
- Controllers using req.user.userId: 3

## Recommendations

3. **Standardize User ID Access in Controllers**
   - Current situation: Mixed use of req.user.id (4 uses) and req.user.userId (3 uses)
   - Recommendation: Standardize on req.user.id as it's more commonly used

## Implementation Plan

1. **Update Entity ID Types**
   - For any entities not using UUID, create migration to change column type
   - Update entity classes to use consistent @PrimaryGeneratedColumn decorator

2. **Standardize JWT Usage**
   - Update JwtStrategy to use consistent field naming
   - Update all services that interact with JWT payloads

3. **Fix Controller ID References**
   - Update all controllers to use consistent req.user.id access pattern
   - Fix @Param decorators to use consistent naming

4. **Update DTO Objects**
   - Standardize field names across all DTOs
   - Ensure CreateDTO and UpdateDTO have consistent naming
