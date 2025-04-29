# Refresh Token Code Fix

## Issue Identified

The wallet authentication error occurs because the code uses `user_id` (snake_case) while the foreign key constraint in the database was pointing to `userId` (camelCase). 

## Database Fix Applied

We've applied these database fixes:

1. Ensured both column naming styles exist (`user_id` and `userId`)
2. Set up foreign key constraints for both columns
3. Created triggers to keep them in sync automatically

## Code Changes Required

Locate your refresh token entity file (likely in `src/auth/entities/refresh-token.entity.ts` or similar) and update it to handle both column naming conventions:

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  // Add both column names to handle any naming convention
  @Column({ name: 'expiresAt' })
  expiresAt: Date;

  @Column({ name: 'user_id' }) // This is what TypeORM will use internally
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' }) // Match the column name used above
  user: User;
}
```

## Testing the Fix

1. Restart your backend service:
   ```bash
   npm run start:dev
   ```

2. Try authenticating with your wallet again
3. Check logs to make sure no foreign key constraint errors appear

The fix should now allow proper refresh token creation during wallet authentication.
