# Dependency Injection Fix Implementation

This document provides the code and implementation details needed to fix the dependency injection issue in the GameModule.

## Steps to Fix:

### 1. Create RewardTransactionRepository

```typescript
// File: /backend/src/game/repositories/reward-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { RewardTransaction } from '../entities/reward-transaction.entity';

@Injectable()
export class RewardTransactionRepository {
  constructor(
    @InjectRepository(RewardTransaction)
    private readonly rewardTransactionRepository: Repository<RewardTransaction>,
  ) {}

  /**
   * Find a reward transaction by ID
   */
  async findOne(options: any): Promise<RewardTransaction | null> {
    return this.rewardTransactionRepository.findOne(options);
  }

  /**
   * Find a reward transaction by specific criteria
   */
  async findOneBy(criteria: FindOptionsWhere<RewardTransaction>): Promise<RewardTransaction | null> {
    return this.rewardTransactionRepository.findOne({
      where: criteria,
    });
  }

  /**
   * Find multiple reward transactions
   */
  async find(options: FindManyOptions<RewardTransaction>): Promise<RewardTransaction[]> {
    return this.rewardTransactionRepository.find(options);
  }

  /**
   * Find all reward transactions with count
   */
  async findAndCount(options: FindManyOptions<RewardTransaction>): Promise<[RewardTransaction[], number]> {
    return this.rewardTransactionRepository.findAndCount(options);
  }

  /**
   * Create a new reward transaction entity (without saving)
   */
  create(rewardTransactionData: Partial<RewardTransaction>): RewardTransaction {
    return this.rewardTransactionRepository.create(rewardTransactionData);
  }

  /**
   * Save a reward transaction
   */
  async save(rewardTransaction: RewardTransaction): Promise<RewardTransaction> {
    return this.rewardTransactionRepository.save(rewardTransaction);
  }

  /**
   * Create and save a new reward transaction
   */
  async createAndSave(rewardTransactionData: Partial<RewardTransaction>): Promise<RewardTransaction> {
    const rewardTransaction = this.rewardTransactionRepository.create(rewardTransactionData);
    return this.rewardTransactionRepository.save(rewardTransaction);
  }

  /**
   * Update a reward transaction
   */
  async update(id: string, rewardTransactionData: Partial<RewardTransaction>): Promise<RewardTransaction> {
    await this.rewardTransactionRepository.update(id, rewardTransactionData);
    return this.findOne({ where: { id } });
  }

  /**
   * Delete a reward transaction
   */
  async remove(id: string): Promise<void> {
    await this.rewardTransactionRepository.delete(id);
  }
  
  /**
   * Create a query builder
   */
  createQueryBuilder(alias: string): SelectQueryBuilder<RewardTransaction> {
    return this.rewardTransactionRepository.createQueryBuilder(alias);
  }
}
```

### 2. Update GameModule

```typescript
// File: /backend/src/game/game.module.ts

// Add import for RewardTransactionRepository
import { RewardTransactionRepository } from './repositories/reward-transaction.repository';
// Add import for RewardTransaction entity
import { RewardTransaction } from './entities/reward-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // ... existing entities
      RewardTransaction, // Add this line
    ]),
    // ... other imports
  ],
  providers: [
    // ... existing providers
    RewardTransactionRepository, // Add this line
  ],
})
export class GameModule {}
```

### 3. Update RewardsService Constructor

```typescript
// File: /backend/src/game/services/rewards.service.ts

// Add import
import { RewardTransactionRepository } from '../repositories/reward-transaction.repository';

@Injectable()
export class RewardsService {
  constructor(
    private readonly rewardTransactionRepository: RewardTransactionRepository,
    private readonly gameModuleRepository: GameModuleRepository,
    private readonly userQuizResponseRepository: UserQuizResponseRepository,
    private readonly configService: ConfigService
  ) {}
  
  // ... rest of the service
}
```

## Testing the Fix

After implementing these changes, you should:

1. Verify that the application starts without dependency injection errors
2. Test the rewards functionality to ensure it works as expected
3. Add unit tests to verify proper dependency injection

## Additional Notes

This pattern should be applied to other repositories in the GameModule to ensure consistent architecture and avoid similar issues in the future.
