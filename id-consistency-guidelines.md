# User ID Consistency Guidelines

## Overview

This document provides guidelines for maintaining consistency in how user IDs are handled throughout the system. Following these guidelines will help prevent type mismatch errors and ensure smooth interactions between different parts of the application.

## Standards

### 1. Data Types

- **User IDs**: Always use UUID strings for user IDs.
- **Database Columns**: All user ID columns in the database should be of type `uuid`.
- **TypeScript Types**: Always declare user ID variables as `string` in TypeScript.

### 2. Naming Conventions

- **Database Column Names**: Use `user_id` (snake_case) for all database columns referencing a user.
- **TypeScript Properties**: Use `userId` (camelCase) for all TypeScript properties referencing a user.
- **Entity Mapping**: Always use `@Column({ name: 'user_id' })` to map between TypeScript properties and database columns.

### 3. Entity Relationship Configuration

```typescript
// Example User relation in an Entity
@Column({ name: 'user_id', type: 'uuid' })
userId: string;

@ManyToOne(() => User, user => user.relatedEntities)
@JoinColumn({ name: 'user_id' })
user: User;
```

### 4. Service Methods

- Always treat user IDs as string UUIDs in service methods.
- Never cast user IDs to numbers or assume they can be parsed as integers.
- Use TypeORM QueryBuilder for complex queries to ensure proper type handling.

```typescript
// Example service method
async findByUserId(userId: string): Promise<Entity[]> {
  return this.repository.find({ 
    where: { userId } 
  });
}
```

### 5. Authentication

- When storing/retrieving user IDs in JWT tokens, always treat them as strings.
- Never compare user IDs with `==` (use `===` to ensure type safety).

### 6. API Endpoints

- Document all user ID parameters in API endpoints as UUID strings.
- Validate incoming user IDs as valid UUIDs using a validation pipe or decorator.

```typescript
// Example validation
@Get(':userId')
findByUserId(@Param('userId', new ParseUUIDPipe()) userId: string) {
  return this.service.findByUserId(userId);
}
```

## Database Migration

A migration (`StandardizeUserIds1750000000000`) has been implemented to standardize all user ID fields across the database:

- Convert any remaining integer user ID columns to UUIDs
- Standardize column naming (from `userId` to `user_id` in database)
- Fix inconsistent foreign key constraints

To run this migration:

```bash
# Run the ID standardization script
./run-id-standardization.sh

# Verify ID consistency across the system
./run-backend-commands.sh test:id-consistency
```

## Key Files and Components

### Entity Files

All entity files should follow this pattern for user IDs:

1. **Diary Entity** (`/backend/src/diary/entities/diary.entity.ts`):
   ```typescript
   @Column({ name: 'user_id', type: 'uuid' })
   userId: string;
   
   @ManyToOne(() => User, (user) => user.diaries)
   @JoinColumn({ name: 'user_id' })
   user: User;
   ```

### Service Files

Service files should handle user IDs as strings throughout:

1. **Diary Service** (`/backend/src/diary/services/diary.service.ts`):
   ```typescript
   async create(userId: string, createDiaryDto: CreateDiaryDto): Promise<Diary> {
     const diary = this.diaryRepository.create({
       ...createDiaryDto,
       userId: userId, // Keep as string, don't parse to integer
     });
     // ...rest of method
   }
   
   async findAll(userId: string): Promise<Diary[]> {
     return this.diaryRepository.find({
       where: { userId: userId }, // Direct string comparison
       order: { createdAt: 'DESC' },
     });
   }
   ```

### Database Scripts

Several scripts ensure database consistency:

1. **ID Standardization Script** (`/run-id-standardization.sh`):
   - Converts integer IDs to UUIDs
   - Standardizes column naming conventions
   - Adds appropriate foreign key constraints
   
2. **PostgreSQL Authentication Fix** (`/fix-postgres-auth.sh`):
   - Ensures database connection works properly
   - Updates authentication methods for database users

## Common Issues and Solutions

### Type Mismatch Errors

**Problem**: `invalid input syntax for type integer: "uuid-string"`

**Solution**: This indicates a table still using INTEGER for a user ID field. Run the standardization migration to fix these issues.

### TypeScript Type Mismatch Errors

**Problem**: TypeScript errors like `Type 'number' is not assignable to type 'string'` when handling user IDs

**Solution**: Remove any `parseInt()` calls or number type casting when handling user IDs. Always treat them as strings.

**Example Fix - DiaryService**:
```typescript
// Incorrect approach - causes TypeScript errors
const diary = this.diaryRepository.create({
  ...createDiaryDto,
  userId: parseInt(userId, 10), // Error: Type 'number' is not assignable to type 'string'
});

// Correct approach
const diary = this.diaryRepository.create({
  ...createDiaryDto,
  userId: userId, // Keep as string
});
```

### Equality Comparison Issues

**Problem**: User ID comparison fails even when IDs should match

**Solution**: Always use strict equality (`===`) when comparing user IDs, and ensure they're the same type (string):

```typescript
// Incorrect
if (diary.userId != userId) { /* ... */ }

// Correct
if (diary.userId !== userId) { /* ... */ }
```

### Undefined User Relationships

**Problem**: User relationships returning undefined even when IDs match

**Solution**: Check that the entity is using the correct column name in the `@JoinColumn` decorator.

### JWT Authentication Failures

**Problem**: Users authenticated with wallet fail subsequent requests

**Solution**: Ensure the user ID is properly stored as a UUID string in the JWT token.

## Testing ID Consistency

Run the provided tests to verify ID consistency:

```bash
npm run test:id-consistency
```

This will validate that all user ID references across the system are consistent and properly typed.

## Database Connection Issues

If you encounter database connection errors with the PostgreSQL user:

```
error: password authentication failed for user "Aliveadmin"
```

Run the fix-postgres-auth.sh script to repair authentication:

```bash
./fix-postgres-auth.sh
```

## Wallet Authentication and User IDs

When using wallet authentication:

1. The wallet address is stored directly on the User entity (`walletAddress` field)
2. The User entity still uses a UUID as its primary identifier
3. The device-wallet pairing system uses the UUID user ID for reference
4. JWT tokens contain the UUID, not the wallet address

Always use the user's UUID for references to users, not their wallet address.
