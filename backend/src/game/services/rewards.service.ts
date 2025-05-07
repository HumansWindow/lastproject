import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RewardTransaction } from '../entities/reward-transaction.entity';
import { GameModule } from '../entities/game-module.entity';
import { UserQuizResponse } from '../entities/quiz/user-quiz-response.entity';
import { 
  RewardTransactionDto,
  RewardHistoryDto,
  RewardCalculationDto,
  ProcessingResultDto,
  TransactionStatus
} from '../dto/reward.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @InjectRepository(RewardTransaction)
    private readonly rewardTransactionRepository: Repository<RewardTransaction>,
    @InjectRepository(GameModule)
    private readonly gameModuleRepository: Repository<GameModule>,
    @InjectRepository(UserQuizResponse)
    private readonly userQuizResponseRepository: Repository<UserQuizResponse>,
    private readonly configService: ConfigService
  ) {}

  /**
   * Calculate reward for a completed module
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with reward calculation details
   */
  async calculateReward(userId: string, moduleId: string): Promise<RewardCalculationDto> {
    // Verify module exists
    const module = await this.gameModuleRepository.findOne({
      where: { id: moduleId },
      relations: ['sections']
    });
    
    if (!module) {
      throw new NotFoundException(`Game module with ID ${moduleId} not found`);
    }
    
    // Check if reward was already claimed
    const existingReward = await this.rewardTransactionRepository.findOne({
      where: {
        userId: userId,
        moduleId: moduleId,
        status: In(['pending', 'processing', 'completed'])
      }
    });
    
    if (existingReward) {
      return {
        moduleId,
        baseAmount: module.rewardAmount,
        bonusAmount: '0',
        totalAmount: existingReward.amount.toString(),
        alreadyClaimed: true,
        transactionId: existingReward.id
      };
    }
    
    // Get base reward from module
    let baseReward = module.rewardAmount || 0;
    
    // Calculate bonus based on quiz performance if applicable
    let bonusAmount = '0';
    
    // If the module has sections with quizzes, calculate bonus
    if (module.sections && module.sections.length > 0) {
      const quizSectionIds = module.sections
        .filter(s => s.sectionType === 'quiz')
        .map(s => s.id);
      
      if (quizSectionIds.length > 0) {
        bonusAmount = await this.calculateQuizBonus(userId, quizSectionIds, baseReward.toString());
      }
    }
    
    // Calculate total reward
    const totalAmount = this.addTokenAmounts(baseReward.toString(), bonusAmount);
    
    return {
      moduleId,
      baseAmount: baseReward,
      bonusAmount,
      totalAmount,
      alreadyClaimed: false
    };
  }

  /**
   * Queue a reward transaction for processing
   * @param userId User ID
   * @param moduleId Module ID
   * @returns Promise with queued transaction details
   */
  async queueRewardTransaction(userId: string, moduleId: string): Promise<RewardTransactionDto> {
    // Calculate reward amount
    const calculation = await this.calculateReward(userId, moduleId);
    
    // If already claimed, return existing transaction
    if (calculation.alreadyClaimed && calculation.transactionId) {
      const existingTransaction = await this.rewardTransactionRepository.findOne({
        where: { id: calculation.transactionId }
      });
      
      return this.mapToDto(existingTransaction);
    }
    
    // Create new transaction record
    const transaction = this.rewardTransactionRepository.create({
      userId: userId,
      moduleId: moduleId,
      amount: parseFloat(calculation.totalAmount),
      status: 'pending'
    });
    
    const savedTransaction = await this.rewardTransactionRepository.save(transaction);
    return this.mapToDto(savedTransaction);
  }

  /**
   * Process a batch of pending reward transactions
   * @param batchSize Maximum number of transactions to process in this batch
   * @returns Promise with processing results
   */
  async processRewardBatch(batchSize = 10): Promise<ProcessingResultDto> {
    // Find pending transactions to process
    const pendingTransactions = await this.rewardTransactionRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: batchSize
    });
    
    if (pendingTransactions.length === 0) {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        transactionIds: []
      };
    }
    
    let successCount = 0;
    let failedCount = 0;
    const transactionIds = [];
    
    // Process each transaction
    for (const transaction of pendingTransactions) {
      transactionIds.push(transaction.id);
      
      try {
        // Mark as processing
        transaction.status = 'processing';
        await this.rewardTransactionRepository.save(transaction);
        
        // TODO: Integrate with blockchain module to process the actual reward
        // This would be something like:
        // const result = await this.blockchainService.transferTokens(
        //   transaction.userId, 
        //   transaction.amount
        // );
        
        // For now, simulate processing with a delay
        await this.simulateBlockchainProcessing();
        
        // Mock transaction hash
        const mockTxHash = `0x${Buffer.from(transaction.id).toString('hex').substring(0, 40)}`;
        
        // Update transaction as completed
        transaction.status = 'completed';
        transaction.transactionHash = mockTxHash;
        transaction.processedAt = new Date();
        await this.rewardTransactionRepository.save(transaction);
        
        successCount++;
      } catch (error) {
        this.logger.error(`Failed to process transaction ${transaction.id}: ${error.message}`);
        
        // Mark as failed
        transaction.status = 'failed';
        await this.rewardTransactionRepository.save(transaction);
        
        failedCount++;
      }
    }
    
    return {
      processedCount: pendingTransactions.length,
      successCount,
      failedCount,
      transactionIds
    };
  }

  /**
   * Get reward transaction history for a user
   * @param userId User ID
   * @param limit Maximum number of transactions to return
   * @param offset Offset for pagination
   * @returns Promise with reward history
   */
  async getUserRewardHistory(
    userId: string, 
    limit = 10, 
    offset = 0
  ): Promise<RewardHistoryDto> {
    // Get transactions for this user
    const [transactions, total] = await this.rewardTransactionRepository.findAndCount({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['module']
    });
    
    // Calculate total rewards
    const totalPendingResult = await this.rewardTransactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.status IN (:...statuses)', { statuses: ['pending', 'processing'] })
      .getRawOne();
    
    const totalCompletedResult = await this.rewardTransactionRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.status = :status', { status: 'completed' })
      .getRawOne();
    
    const totalPending = totalPendingResult?.total || '0';
    const totalCompleted = totalCompletedResult?.total || '0';
    
    return {
      transactions: transactions.map(tx => this.mapToDto(tx)),
      totalTransactions: total,
      total, // Add missing total property
      totalPending,
      totalCompleted
    };
  }

  /**
   * Get details for a specific reward transaction
   * @param userId User ID
   * @param transactionId Transaction ID
   * @returns Promise with transaction details
   */
  async getTransactionDetails(
    userId: string, 
    transactionId: string
  ): Promise<RewardTransactionDto> {
    const transaction = await this.rewardTransactionRepository.findOne({
      where: { 
        id: transactionId,
        userId: userId
      },
      relations: ['module']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    
    return this.mapToDto(transaction);
  }

  /**
   * Calculate bonus amount based on quiz performance
   * @param userId User ID
   * @param quizSectionIds Array of quiz section IDs
   * @param baseAmount Base reward amount
   * @returns Promise with bonus amount as string
   * @private
   */
  private async calculateQuizBonus(
    userId: string, 
    quizSectionIds: string[], 
    baseAmount: string
  ): Promise<string> {
    // Get user's quiz responses
    const responses = await this.userQuizResponseRepository
      .createQueryBuilder('response')
      .innerJoin('quiz_question', 'question', 'response.question_id = question.id')
      .where('response.userId = :userId', { userId })
      .andWhere('question.sectionId IN (:...sectionIds)', { sectionIds: quizSectionIds })
      .getMany();
    
    if (responses.length === 0) {
      return '0';
    }
    
    // Calculate performance ratio (correct answers / total answers)
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const totalAnswers = responses.length;
    const performanceRatio = correctAnswers / totalAnswers;
    
    // Apply bonus calculation based on configuration
    const maxBonusPercentage = this.configService.get<number>('GAME_MAX_QUIZ_BONUS_PERCENT', 20);
    const bonusPercentage = Math.round(performanceRatio * maxBonusPercentage);
    
    // Calculate bonus amount
    const baseAmountNum = parseFloat(baseAmount);
    const bonusAmount = (baseAmountNum * bonusPercentage / 100).toFixed(8);
    
    return bonusAmount;
  }

  /**
   * Add two token amounts as strings
   * @param amount1 First amount
   * @param amount2 Second amount
   * @returns Sum as string with 8 decimal places
   * @private
   */
  private addTokenAmounts(amount1: string, amount2: string): string {
    const num1 = parseFloat(amount1) || 0;
    const num2 = parseFloat(amount2) || 0;
    return (num1 + num2).toFixed(8);
  }

  /**
   * Simulate blockchain processing delay
   * @private
   */
  private async simulateBlockchainProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Map entity to DTO
   * @param transaction Reward transaction entity
   * @returns Reward transaction DTO
   * @private
   */
  private mapToDto(transaction: RewardTransaction): RewardTransactionDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      moduleId: transaction.moduleId,
      amount: transaction.amount,
      status: transaction.status as TransactionStatus,
      transactionHash: transaction.transactionHash,
      processedAt: transaction.processedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
  }
}