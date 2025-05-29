# Referral System Migration Guide

This guide provides a comprehensive overview for migrating the referral system to a new project or updating the existing implementation.

## System Overview

The referral system allows users to invite others to the platform through unique referral codes. It supports:

1. **Referral Code Generation** - Creating unique, collision-resistant codes for each user
2. **Referral Tracking** - Recording relationships between referrers and referred users
3. **Reward Management** - Supporting claiming of rewards for successful referrals
4. **Statistics Reporting** - Providing detailed referral analytics for users
5. **Security Features** - Preventing self-referrals and duplicate referral usage

## Database Schema

### Core Entities

#### 1. Referral Codes

```typescript
@Entity({ name: 'referral_codes' })
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'code' })
  code: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'user_id' })
  referrerId: string;

  // Add userId as an alias for referrerId to maintain compatibility
  // with existing code that uses userId
  get userId(): string {
    return this.referrerId;
  }

  set userId(value: string) {
    this.referrerId = value;
  }

  @ManyToOne(() => User, user => user.referralCodes)
  @JoinColumn({ name: 'user_id' })
  referrer: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### 2. Referrals

```typescript
@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'referrer_id' })
  referrerId: string;
  
  @Column({ name: 'referred_id' })
  referredId: string;

  @Column({ name: 'created_at' }) 
  createdAt: Date;
}
```

#### 3. Referral Uses

```typescript
@Entity('referral_uses')
export class ReferralUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerId: string;

  @Column()
  referredId: string;

  @Column({ default: false })
  rewardClaimed: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
```

## Backend Implementation

### Module Structure

Create the following directory structure in your new project:

```
/src
  /referral
    /dto                  # Data Transfer Objects
      create-referral.dto.ts
      toggle-referral-code.dto.ts
    /entities            # Database entities
      referral.entity.ts
      referral-code.entity.ts
    referral.module.ts   # Module definition
    referral.service.ts  # Business logic
    referral.controller.ts # API endpoints
```

### Module Configuration (referral.module.ts)

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral, ReferralUse } from './entities/referral.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral, ReferralUse, ReferralCode]),
    forwardRef(() => UsersModule), // Circular dependency handling
  ],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
```

### Core Service (referral.service.ts)

Key features of the referral service:

1. **Code Generation** - Creates unique 8-character alphanumeric codes
2. **Collision Detection** - Verifies uniqueness of generated codes
3. **Security Checks** - Prevents self-referrals and duplicate usage
4. **Statistics Tracking** - Counts referrals and successful conversions
5. **Reward Management** - Supports claiming of rewards for successful referrals

Key methods in the service:

```typescript
// Generate a unique referral code for a user
async generateReferralCode(userId: string): Promise<ReferralCode>

// Get statistics about a user's referrals
async getReferralStats(userId: string)

// Enable/disable a user's referral code
async toggleReferralCode(userId: string, isActive: boolean)

// Process a referral during registration
async processReferral(code: string, newUserId: string)

// Record a conversion after certain user actions
async recordReferralUse(referrerId: string, referredId: string)

// Claim rewards for successful referrals
async claimReferralReward(userId: string, referralUseId: string)

// Validate a referral code
async getReferralByCode(code: string): Promise<ReferralCode>
```

### API Endpoints (referral.controller.ts)

The controller provides RESTful endpoints for referral operations:

```typescript
@ApiTags('referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  // Get referral statistics for current user
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getReferralStats(@Request() req: RequestWithUser)

  // Generate a new referral code
  @Post('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async generateReferralCode(@Request() req: RequestWithUser)

  // Toggle referral code activation status
  @Post('toggle-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async toggleReferralCode(
    @Request() req: RequestWithUser,
    @Body() body: ToggleReferralCodeDto,
  )

  // Claim reward for a successful referral
  @Post('claim/:referralUseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async claimReferralReward(
    @Request() req: RequestWithUser,
    @Param('referralUseId') referralUseId: string
  )

  // Validate a referral code
  @Get('validate/:code')
  async validateReferralCode(@Param('code') code: string)
}
```

## Frontend Implementation

### Referral Service API

```typescript
// src/services/api/referral-service.ts

import { apiClient } from './api-client';

/**
 * Interface for referral statistics
 */
export interface ReferralStats {
  referralCode: string | null;
  isActive: boolean;
  totalReferrals: number;
  successfulReferrals: number;
  referredUsers: ReferredUser[];
}

export interface ReferredUser {
  id: string;
  email?: string;
  createdAt: Date;
}

export interface ReferralCode {
  id: string;
  code: string;
  isActive: boolean;
  referrerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  referral?: ReferralCode;
  message?: string;
}

/**
 * Service for handling referral operations
 */
class ReferralService {
  private endpoint = '/referral';
  
  /**
   * Get statistics about the current user's referrals
   * @returns Promise with referral statistics
   */
  async getReferralStats(): Promise<ReferralStats> {
    const response = await apiClient.get<ReferralStats>(`${this.endpoint}/stats`);
    return response.data;
  }
  
  /**
   * Generate a new referral code for the current user
   * @returns Promise with the generated referral code
   */
  async generateReferralCode(): Promise<ReferralCode> {
    const response = await apiClient.post<ReferralCode>(`${this.endpoint}/generate-code`);
    return response.data;
  }
  
  /**
   * Toggle the active status of the current user's referral code
   * @param isActive Whether the code should be active
   * @returns Promise with the updated referral code
   */
  async toggleReferralCode(isActive: boolean): Promise<ReferralCode> {
    const response = await apiClient.post<ReferralCode>(`${this.endpoint}/toggle-code`, { isActive });
    return response.data;
  }
  
  /**
   * Validate a referral code
   * @param code The referral code to validate
   * @returns Promise with validation result
   */
  async validateReferralCode(code: string): Promise<ReferralValidationResult> {
    try {
      const response = await apiClient.get<ReferralValidationResult>(`${this.endpoint}/validate/${code}`);
      return response.data;
    } catch (error) {
      return {
        valid: false,
        message: error.response?.data?.message || 'Invalid referral code'
      };
    }
  }
  
  /**
   * Claim a reward for a successful referral
   * @param referralUseId ID of the referral use to claim
   * @returns Promise with claim result
   */
  async claimReferralReward(referralUseId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${this.endpoint}/claim/${referralUseId}`
    );
    return response.data;
  }
  
  /**
   * Get referral details by code
   * @param code The referral code to look up
   * @returns Promise with referral information
   */
  async getReferralByCode(code: string): Promise<ReferralCode> {
    const validation = await this.validateReferralCode(code);
    if (!validation.valid || !validation.referral) {
      throw new Error(validation.message || 'Invalid referral code');
    }
    return validation.referral;
  }
}

export const referralService = new ReferralService();
```

### Integration with Authentication

Add referral code support in the registration process:

```typescript
// In auth-service.ts

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param referralCode Optional referral code
 * @returns Promise with auth tokens
 */
async register(
  email: string, 
  password: string, 
  referralCode?: string
): Promise<AuthTokens> {
  try {
    const response = await apiClient.post<AuthTokens>('/auth/register', { 
      email, 
      password,
      referralCode
    });
    
    // Store tokens in localStorage
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
```

## UI Components

### Referral Code Display

Create a component to display a user's referral code:

```tsx
// ReferralCodeDisplay.tsx
import React, { useState, useEffect } from 'react';
import { referralService } from '../services/api';

export const ReferralCodeDisplay: React.FC = () => {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadReferralStats = async () => {
      try {
        setLoading(true);
        const stats = await referralService.getReferralStats();
        setReferralStats(stats);
        setError(null);
      } catch (err) {
        setError('Failed to load referral information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReferralStats();
  }, []);
  
  const generateCode = async () => {
    try {
      setLoading(true);
      const code = await referralService.generateReferralCode();
      setReferralStats(prev => prev ? { ...prev, referralCode: code.code, isActive: code.isActive } : null);
      setError(null);
    } catch (err) {
      setError('Failed to generate referral code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCodeStatus = async () => {
    if (!referralStats) return;
    
    try {
      setLoading(true);
      const updated = await referralService.toggleReferralCode(!referralStats.isActive);
      setReferralStats(prev => prev ? { ...prev, isActive: updated.isActive } : null);
      setError(null);
    } catch (err) {
      setError('Failed to update referral code status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading referral information...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div className="referral-code-container">
      <h2>Invite Friends</h2>
      
      {referralStats?.referralCode ? (
        <>
          <div className="code-display">
            <span>Your referral code: </span>
            <strong>{referralStats.referralCode}</strong>
            <span className={`status ${referralStats.isActive ? 'active' : 'inactive'}`}>
              {referralStats.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <button onClick={toggleCodeStatus}>
            {referralStats.isActive ? 'Deactivate Code' : 'Activate Code'}
          </button>
          
          <div className="stats">
            <div>Total Referrals: {referralStats.totalReferrals}</div>
            <div>Successful Referrals: {referralStats.successfulReferrals}</div>
          </div>
          
          {referralStats.referredUsers.length > 0 && (
            <div className="referred-users">
              <h3>Referred Users</h3>
              <ul>
                {referralStats.referredUsers.map(user => (
                  <li key={user.id}>
                    {user.email || 'Anonymous User'} - Joined: {new Date(user.createdAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div>
          <p>You don't have a referral code yet.</p>
          <button onClick={generateCode}>Generate Code</button>
        </div>
      )}
    </div>
  );
};
```

### Referral Code Input

Create a component for entering a referral code during registration:

```tsx
// ReferralCodeInput.tsx
import React, { useState } from 'react';
import { referralService } from '../services/api';

interface ReferralCodeInputProps {
  onValidCode: (code: string) => void;
}

export const ReferralCodeInput: React.FC<ReferralCodeInputProps> = ({ onValidCode }) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCode(value);
    setError(null);
    setIsValid(false);
  };
  
  const validateCode = async () => {
    if (!code.trim()) {
      setError('Please enter a referral code');
      return;
    }
    
    try {
      setValidating(true);
      setError(null);
      
      const result = await referralService.validateReferralCode(code);
      
      if (result.valid) {
        setIsValid(true);
        onValidCode(code);
      } else {
        setError(result.message || 'Invalid referral code');
        setIsValid(false);
      }
    } catch (err) {
      setError('Failed to validate referral code');
      setIsValid(false);
      console.error(err);
    } finally {
      setValidating(false);
    }
  };
  
  return (
    <div className="referral-code-input">
      <label htmlFor="referral-code">Referral Code (Optional)</label>
      <div className="input-group">
        <input
          id="referral-code"
          type="text"
          value={code}
          onChange={handleChange}
          placeholder="Enter referral code"
          maxLength={8}
        />
        <button 
          onClick={validateCode} 
          disabled={validating || !code.trim() || isValid}
        >
          {validating ? 'Validating...' : isValid ? 'Valid' : 'Validate'}
        </button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {isValid && <div className="success">Valid referral code!</div>}
    </div>
  );
};
```

## Implementation Guidelines

### Security Considerations

1. **Prevent Self-Referrals** - Users shouldn't be able to refer themselves
2. **Rate Limiting** - Restrict code generation to prevent abuse
3. **Code Uniqueness** - Ensure collision resistance through database checks
4. **Input Validation** - Sanitize and validate all inputs to prevent SQL injection or similar attacks

### Performance Optimization

1. **Caching** - Cache frequently used data like referral statistics
2. **Indexing** - Add database indexes on frequently queried fields:
   - `referral_codes.code` for code lookups
   - `referrals.referred_id` for checking if a user was already referred
   - `referrals.referrer_id` for gathering statistics
   - `referral_uses.referrer_id` for counting successful referrals

### ID Consistency

The referral module follows standardized ID naming conventions:

1. **Primary Keys**: Use `id` as the primary key field name
2. **Foreign Keys**: Use suffixed names for clarity:
   - `referrerId` for the user who refers
   - `referredId` for the user who is referred

Consider adding TypeORM relationships for enhanced type safety:

```typescript
@ManyToOne(() => User)
@JoinColumn({ name: 'referrerId' })
referrer: User;

@ManyToOne(() => User)
@JoinColumn({ name: 'referredId' })
referred: User;
```

## Testing Strategy

### Unit Tests

1. **Service Tests** (referral.service.spec.ts)
   - Test code generation with collision handling
   - Verify security checks for self-referrals
   - Test statistics calculation accuracy
   - Verify reward claiming functionality
   - Test error handling for missing or invalid data

2. **Controller Tests** (referral.controller.spec.ts)
   - Test authentication and authorization
   - Verify proper service method invocation
   - Test response formatting and error handling

### Integration Tests

1. **API Tests**
   - Test referral code validation endpoint
   - Test registration with a referral code
   - Test reward claiming flow
   - Verify statistics accuracy

### Test Mocking

Use Jest's mocking capabilities to isolate tests:

```typescript
// Mock repositories
jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral);

// Mock service calls
jest.spyOn(service, 'getReferralByCode').mockImplementation((code) => {
  if (code === 'TESTCODE') {
    return Promise.resolve(mockReferral);
  }
  throw new BadRequestException('Invalid referral code');
});
```

## Blockchain Integration

For token-based reward systems, implement the connection between the referral system and blockchain services:

```typescript
// In referral.service.ts

// Claim reward for a successful referral
async claimReferralReward(userId: string, referralUseId: string) {
  const referralUse = await this.referralUseRepository.findOne({
    where: { id: referralUseId, referrerId: userId },
  });

  if (!referralUse) {
    throw new NotFoundException('Referral use not found');
  }

  if (referralUse.rewardClaimed) {
    throw new BadRequestException('Reward already claimed');
  }

  // Mark as claimed
  referralUse.rewardClaimed = true;
  await this.referralUseRepository.save(referralUse);

  // Connect to blockchain service to transfer tokens
  // Calculate reward amount based on business rules
  const rewardAmount = 50; // Example: 50 tokens per referral
  
  try {
    await this.blockchainService.transferReward(userId, rewardAmount);
    
    // Record the token transfer
    await this.tokenTransactionRepository.create({
      userId,
      amount: rewardAmount,
      type: 'REFERRAL_REWARD',
      referenceId: referralUseId,
      status: 'COMPLETED'
    });
    
    return {
      success: true,
      message: 'Reward claimed successfully',
      amount: rewardAmount
    };
  } catch (error) {
    // Revert the claimed status if transfer fails
    referralUse.rewardClaimed = false;
    await this.referralUseRepository.save(referralUse);
    
    throw new InternalServerErrorException('Failed to transfer reward tokens');
  }
}
```

## Migration Checklist

When migrating the referral system to a new project:

1. **Database Migration**
   - Create the necessary tables: `referral_codes`, `referrals`, `referral_uses`
   - Add appropriate indexes for performance
   - Ensure proper foreign key constraints

2. **Code Migration**
   - Copy the entity files with proper imports
   - Copy the service implementation with dependencies
   - Copy controller implementation with proper route setup
   - Update imports and dependencies as needed

3. **Integration Points**
   - Update authentication service to accept referral codes
   - Integrate with user registration flow
   - Connect to blockchain services for rewards (if applicable)

4. **UI Implementation**
   - Migrate frontend components for displaying referral info
   - Implement referral code input in registration form
   - Add referral dashboard or statistics view

5. **Testing**
   - Migrate unit and integration tests
   - Run tests to verify functionality
   - Verify security features are properly implemented

## Conclusion

The referral system provides a robust foundation for implementing user referral functionality. Its modular design allows for easy integration with authentication systems and potential extension with blockchain-based rewards.

When migrating, focus on maintaining the security features and consistent ID naming patterns to ensure a smooth transition. The system's architecture allows for scalability and future enhancements without major restructuring.