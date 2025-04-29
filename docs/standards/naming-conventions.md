# Project Naming Conventions

## Overview

This document outlines the naming conventions to be followed throughout the project. Consistent naming conventions are vital to avoid issues like the recent profile database error caused by conflicting field naming styles.

## Database Naming Conventions

### Tables
- **Format**: `snake_case`, plural
- **Examples**: `users`, `profiles`, `user_sessions`, `refresh_tokens`

### Columns
- **Format**: `snake_case`
- **Examples**: `user_id`, `first_name`, `last_name`, `created_at`
- **Common Fields**:
  - Primary keys: `id`
  - Foreign keys: `resource_id` (e.g., `user_id`)
  - Timestamps: `created_at`, `updated_at`

### Indexes
- **Format**: `idx_table_column`
- **Compound Indexes**: `idx_table_column1_column2`
- **Examples**: `idx_profiles_user_id`, `idx_user_devices_device_id`

### Constraints
- **Primary Keys**: `pk_table`
- **Foreign Keys**: `fk_table_referenced_table`
- **Unique Constraints**: `uq_table_column`

### Database Functions and Triggers
- **Functions**: `function_verb_noun` in `snake_case`
- **Triggers**: `trigger_action_table` in `snake_case`
- **Examples**: `function_update_timestamp`, `trigger_sync_profile_fields`

## Code Naming Conventions

### TypeScript/JavaScript

#### Variables and Properties
- **Format**: `camelCase`
- **Examples**: `userId`, `firstName`, `profileService`

#### Classes
- **Format**: `PascalCase`
- **Examples**: `User`, `ProfileService`, `AuthController`

#### Interfaces
- **Format**: `PascalCase` (may use `I` prefix for distinction)
- **Examples**: `UserProfile`, `IAuthProvider`

#### Types and Enums
- **Format**: `PascalCase`
- **Examples**: `VisibilityLevel`, `AuthType`

#### Constants
- **Format**: `UPPER_SNAKE_CASE`
- **Examples**: `API_URL`, `TOKEN_KEY`

### API Endpoints
- **Format**: `kebab-case`
- **Examples**: `/user/profile`, `/auth/login`, `/profile/complete-later`

## File and Directory Naming

- **Directories**: `kebab-case`
- **TypeScript/JavaScript Files**: `kebab-case.ts`, `kebab-case.tsx`
- **Test Files**: `kebab-case.spec.ts`, `kebab-case.test.ts`
- **SQL Migration Files**: `YYYYMMDD_description.sql`

## ORM/Database Mapping Guidelines

### Entity to Database Mapping
When using TypeORM or similar ORMs, always specify the column name explicitly to avoid inconsistencies.

**CORRECT:**
```typescript
@Column({ name: 'user_id' })
userId: string;
```

**INCORRECT:**
```typescript
@Column()
userId: string; // Will create a "userId" column in the database which is inconsistent
```

### Key Field Mapping Rules

Always follow these rules for entity-to-database mappings:

1. Use `camelCase` for entity properties in TypeScript/JavaScript code
2. Use `snake_case` for database column names
3. Always specify the column name with the `name` property in decorators
4. For relationships, always specify `JoinColumn` with the proper column name

```typescript
// Example of proper field definition in an entity
@Column({ name: 'user_id' })
userId: string;

@OneToOne(() => User)
@JoinColumn({ name: 'user_id' })
user: User;
```

## Compliance and Validation

1. Use ESLint/TSLint rules to enforce naming conventions in code
2. Use pre-commit hooks to validate naming conventions
3. Run database schema validation tests periodically
4. Review new code for naming convention compliance during code reviews
5. Use standard TypeORM practices to ensure database-to-code mapping is consistent

## Handling Legacy Code

When working with legacy code that doesn't follow these conventions:

1. Document deviations in a centralized list
2. Plan standardization sprints to gradually fix inconsistencies
3. When fixing an area, standardize naming in the entire module

## Versioning and Implementation

**Version**: 1.0  
**Effective Date**: April 26, 2025  
**Last Updated**: April 26, 2025

This document should be reviewed and updated regularly as the project evolves.