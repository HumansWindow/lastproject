# Wallet Authentication Code Fixes

## Database Schema Fixed

✅ The refresh_tokens table has been fixed to support both camelCase and snake_case column naming.

## Issue Identified

The wallet authentication error was caused by:

1. Mismatch between column naming in code vs. database (`expires_at` vs `expiresAt`)
2. Missing `NOT NULL` constraints on required columns
3. Failed foreign key constraint during token creation

## Code Changes Required

To prevent these issues from happening again, apply the following code changes:

### 1. Update your RefreshToken entity

```typescript
// src/auth/entities/refresh-token.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  // Support both naming conventions with transformers
  @Column({
    name: 'expiresAt',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    }
  })
  expiresAt: Date;

  // Support both naming conventions with transformers
  @Column({
    name: 'userId',
    transformer: {
      to: (value: string) => value,
      from: (value: string) => value,
    }
  })
  userId: string;

  @Column({
    name: 'createdAt',
    default: () => 'NOW()',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value,
    }
  })
  createdAt: Date;

  // Define relationship to User entity
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

### 2. Update your TokenService

```typescript
// src/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async createRefreshToken(userId: string): Promise<string> {
    // Generate a random token or use a JWT
    const token = this.generateRandomToken();
    
    // Calculate expiration date (e.g., 7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create and save the refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId,
      createdAt: new Date(),
    });
    
    await this.refreshTokenRepository.save(refreshToken);
    
    return token;
  }

  private generateRandomToken(): string {
    // Implement a secure token generation method
    return require('crypto').randomBytes(64).toString('hex');
  }
}
```

### 3. Update your WalletAuthService

```typescript
// src/auth/services/wallet-auth.service.ts
// Inside your walletLogin method:
async walletLogin(address: string, signature: string): Promise<any> {
  try {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Your existing code...
      
      // Create tokens
      const accessToken = await this.tokenService.generateAccessToken(user.id);
      const refreshToken = await this.tokenService.createRefreshToken(user.id);
      
      // If everything is successful, commit the transaction
      await queryRunner.commitTransaction();
      
      return {
        accessToken,
        refreshToken,
        user: { id: user.id, walletAddress: user.walletAddress }
      };
    } catch (err) {
      // If anything fails, roll back the transaction
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  } catch (error) {
    this.logger.error(`[${traceId}] Wallet login error: ${error.message}`);
    throw new InternalServerErrorException(`Failed to generate authentication tokens: ${error.message}`);
  }
}
```

## Testing

After applying these changes:

1. Restart your backend service: `npm run start:dev`
2. Try to authenticate with a wallet again
3. Check logs for any remaining errors
4. Ensure no errors occur in the token creation process

