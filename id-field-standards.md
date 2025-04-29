# ID Field Naming Standards

This document outlines our standards for ID fields in TypeORM entities based on our standardization process.

## Primary Keys

- All primary keys should be named `id`
- UUID primary keys should use `@PrimaryGeneratedColumn('uuid')` and have type `string`

## Foreign Keys

### Standard Pattern (Recommended)

For foreign keys, we follow this pattern:

```typescript
// Example for a Post entity referencing a User
@Column({ name: 'user_id' })
userId: string;

@ManyToOne(() => User)
@JoinColumn({ name: 'user_id' })
user: User;
```

This is NOT considered a redundancy or inconsistency. Having both:
- A scalar property (`userId`) for direct access and querying
- A relation property (`user`) for eager/lazy loading the related entity

Is the recommended TypeORM pattern.

### Column Naming

- All database columns should use snake_case: `user_id`
- All TypeScript properties should use camelCase: `userId`
- Always include explicit column names in decorators: `@Column({ name: 'user_id' })`

## Special Cases

### Self-referencing Entities

For entities that reference themselves (like User referencing another User), use descriptive names:

```typescript
// GOOD:
@Column({ name: 'referrer_id', nullable: true })
referrerId: string;

@ManyToOne(() => User, user => user.referrals)
@JoinColumn({ name: 'referrer_id' })
referrer: User;

// AVOID:
@Column({ name: 'user_id', nullable: true }) // Ambiguous - which user?
userId: string;
```

### Multiple References to Same Entity

When an entity has multiple references to the same entity type, use descriptive prefixes:

```typescript
// GOOD:
@Column({ name: 'assigned_to_user_id' })
assignedToUserId: string;

@Column({ name: 'created_by_user_id' })
createdByUserId: string;

// AVOID:
@Column({ name: 'assigned_user_id' })
assignedUserId: string; // Less clear
```

## UUID Handling

- Always use `string` type for UUID fields
- Use TypeORM's built-in UUID generation with `@PrimaryGeneratedColumn('uuid')`
- For optional UUID fields, use `nullable: true`

## Implementation Notes

The patterns identified in our codebase in `user-device.entity.ts` and `user-session.entity.ts` follow the recommended approach and should be maintained.