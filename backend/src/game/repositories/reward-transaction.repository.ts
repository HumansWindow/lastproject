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
   * Find all reward transactions
   */
  async findAll(options?: {
    userId?: string;
    moduleId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<[RewardTransaction[], number]> {
    const where: FindOptionsWhere<RewardTransaction> = {};

    if (options?.userId) {
      where.userId = options.userId;
    }
    
    if (options?.moduleId) {
      where.moduleId = options.moduleId;
    }
    
    if (options?.status) {
      where.status = options.status;
    }

    return this.rewardTransactionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: options?.skip,
      take: options?.take,
    });
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
