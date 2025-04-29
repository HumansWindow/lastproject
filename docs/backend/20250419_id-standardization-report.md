# ID Field Standardization Report
  
Generated on: 4/20/2025, 6:42:14 AM

## Summary

- Files analyzed: 20
- Entities found: 19
- UUID issues found: 0
- Naming issues found: 2
- Column issues found: 0
- Issues fixed: 0
- Issues requiring manual attention: 0

## Issues by Entity


### user-device.entity.ts

- **LOW** (Line 19): Potentially redundant ID field in user_devices entity: userId
    - Suggestion: Consider using a more specific name for self-references (like "referrerId" instead of "userId")


### user-session.entity.ts

- **LOW** (Line 18): Potentially redundant ID field in user_sessions entity: userId
    - Suggestion: Consider using a more specific name for self-references (like "referrerId" instead of "userId")


## Recommendations

1. Use 'string' type consistently for all UUID fields
2. Always include explicit column name with @Column({ name: 'snake_case_name' })
3. Use descriptive names for self-referencing entities (e.g., 'referrerId' instead of 'userId')
4. Ensure all relationships use @JoinColumn with explicit column names
5. For primary keys, consistently use 'id' as the field name

## Next Steps

- Run the script with --fix flag to automatically apply simple fixes
- Manually review and address more complex issues
- Run TypeScript compiler to ensure no new errors were introduced
- Update services and controllers that might be affected by naming changes
- Create and test database migrations for any column renames
