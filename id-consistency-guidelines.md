# ID Field Consistency Guidelines

This document outlines the standards for ID fields across the Alive Human project to maintain consistency and avoid confusion.

## Primary Keys

- **Use UUID** for all entity primary keys (`@PrimaryGeneratedColumn('uuid')`)
- Exception: The blockchain wallet entity will continue using auto-increment IDs for compatibility reasons

## Field Naming

1. **Primary Keys**
   - Always use `id: string` for the entity's own primary key

2. **Foreign Keys**
   - Use `entityNameId` pattern for foreign keys (e.g., `userId`, `walletId`)
   - When using relations, maintain this naming even if TypeORM can infer it

3. **ID Access in Controllers**
   - Always use `req.user.id` to access the authenticated user's ID
   - Never use `req.user.userId` as this creates inconsistency

4. **JWT Payload**
   - Use standard JWT `sub` field for subject identifier (user ID)
   - Do not use custom fields like `id` or `userId` in JWT payload

## Database Queries

1. **Finding by ID**
   - Use explicit parameter names: `findOne(id: string)`
   - For service methods finding by foreign keys: `findByUserId(userId: string)`

2. **Where Clauses**
   - Be explicit in property naming: `{ where: { id } }` for primary keys
   - Use explicit naming for foreign keys: `{ where: { userId } }`

## DTO Objects

- Be consistent with field names between DTOs and entities
- If an entity has `id`, the corresponding DTO should also use `id`

## Implementation Notes

- Audit all controllers to ensure consistent usage of `req.user.id`
- Update any interface that defines user objects to use `id` instead of `userId`
- When creating new entities, follow the UUID pattern for primary keys
- Document any exceptions to these guidelines with clear reasons
