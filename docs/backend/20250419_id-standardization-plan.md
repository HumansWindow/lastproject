# ID Field Standardization Plan

## Current State Analysis

After analyzing the backend codebase, we've identified several inconsistencies in how user IDs and other ID fields are named and referenced across the application. These inconsistencies create maintenance challenges and potential bugs.

### Identified Inconsistencies

#### User Entity Issues

1. **Redundant ID Fields**:
   - The User entity has both `id` (primary key) and `userId` (self-reference) fields
   - This creates confusion about which ID field should be used in relations

2. **Inconsistent Naming Patterns**:
   - JavaScript properties use camelCase: `userId`, `referrerId`
   - Database columns use snake_case: `user_id`, `referrer_id`
   - Some entities attempt to handle both conventions simultaneously

3. **Relationship Definitions**:
   - TypeORM relationships use different patterns for joining tables
   - Some entities use `user_id` while others use `userId`

### Affected Files and Entities

- `src/users/entities/user.entity.ts`
- `src/users/entities/user-device.entity.ts`
- `src/users/entities/user-session.entity.ts`
- `src/wallets/entities/wallet.entity.ts`
- `src/diary/entities/diary.entity.ts`
- `src/auth/entities/refresh-token.entity.ts`
- `src/profile/entities/profile.entity.ts`
- Various service and controller files that access these entities

## Standardization Guidelines

To address these inconsistencies, we should adopt the following conventions:

### Naming Conventions

1. **Entity Primary Keys**:
   - Always use `id` for primary key fields in all entities
   - Type should be consistently `string` for UUID fields

2. **Foreign Key Fields**:
   - Use camelCase with the pattern `entityNameId` (e.g., `userId`, `walletId`)
   - Database columns should use snake_case with the pattern `entity_name_id` (e.g., `user_id`)

3. **TypeORM Decorators**:
   - Always include `@Column({ name: 'snake_case_name' })` to explicitly map to database columns
   - Use `@JoinColumn({ name: 'snake_case_name' })` for all relationships 

4. **Self-References**:
   - For self-referencing entities (like User), use descriptive names like `referrerId` instead of generic `userId`

## Implementation Checklist

- [ ] Update User entity to standardize ID references
- [ ] Fix foreign key references in all related entities
- [ ] Update service methods to use the standardized naming pattern
- [ ] Create database migration to rename any inconsistent database columns
- [ ] Update TypeORM queries to use the standardized field names
- [ ] Add validation to ensure all ID fields use proper types (UUID)
- [ ] Update tests to reflect the new standardized naming pattern

## SQL Migration Approach

For PostgreSQL database migrations, we'll need to:

1. Create a migration file that:
   - Renames any inconsistent columns
   - Updates foreign key constraints
   - Maintains data integrity during the migration

2. Test the migration on a staging database before applying to production

## TypeScript Code Standardization Solution

The recommended approach is to:

1. Use TypeORM's column name decorators consistently
2. Define clear interfaces for all entity types
3. Use a consistent pattern for ID fields and foreign keys

## Next Steps

1. Review this standardization plan
2. Implement changes starting with core entities (User, Wallet)
3. Update related services and controllers
4. Create and test database migrations
5. Deploy changes in a controlled manner