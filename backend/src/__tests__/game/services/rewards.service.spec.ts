import { Test, TestingModule } from '@nestjs/testing';
import { RewardsService } from '../../../game/services/rewards.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RewardTransaction } from '../../../game/entities/reward-transaction.entity';
import { GameModule } from '../../../game/entities/game-module.entity';
import { UserQuizResponse } from '../../../game/entities/user-quiz-response.entity';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionStatus } from '../../../game/dto/reward.dto';

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardTransactionRepository: Repository<RewardTransaction>;
  let gameModuleRepository: Repository<GameModule>;
  let userQuizResponseRepository: Repository<UserQuizResponse>;
  let configService: ConfigService;

  // Mock data
  const userId = 'user1';
  
  const mockModules = [
    {
      id: 'module1',
      title: 'Module 1',
      rewardAmount: 10,
      sections: [
        {
          id: 'section1',
          sectionType: 'text-image'
        },
        {
          id: 'section2',
          sectionType: 'quiz'
        }
      ]
    },
    {
      id: 'module2',
      title: 'Module 2',
      rewardAmount: 20,
      sections: []
    }
  ];

  const mockTransactions = [
    {
      id: 'transaction1',
      userId: 'user1',
      moduleId: 'module1',
      amount: 12.5,
      status: 'completed',
      transactionHash: '0x123456',
      processedAt: new Date('2025-04-01'),
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-04-01'),
      module: mockModules[0]
    },
    {
      id: 'transaction2',
      userId: 'user1',
      moduleId: 'module2',
      amount: 20,
      status: 'pending',
      transactionHash: null,
      processedAt: null,
      createdAt: new Date('2025-04-02'),
      updatedAt: new Date('2025-04-02'),
      module: mockModules[1]
    }
  ];

  const mockQuizResponses = [
    {
      id: 'response1',
      userId: 'user1',
      questionId: 'question1',
      userAnswer: '4',
      isCorrect: true,
      pointsAwarded: 1
    },
    {
      id: 'response2',
      userId: 'user1',
      questionId: 'question2',
      userAnswer: 'false',
      isCorrect: false,
      pointsAwarded: 0
    }
  ];

  // Mock repositories
  const mockRewardTransactionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '10' }),
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    }))
  };

  const mockGameModuleRepository = {
    findOne: jest.fn()
  };

  const mockUserQuizResponseRepository = {
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockQuizResponses)
    }))
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      if (key === 'GAME_MAX_QUIZ_BONUS_PERCENT') return 20;
      return defaultValue;
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: getRepositoryToken(RewardTransaction),
          useValue: mockRewardTransactionRepository,
        },
        {
          provide: getRepositoryToken(GameModule),
          useValue: mockGameModuleRepository,
        },
        {
          provide: getRepositoryToken(UserQuizResponse),
          useValue: mockUserQuizResponseRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardTransactionRepository = module.get<Repository<RewardTransaction>>(getRepositoryToken(RewardTransaction));
    gameModuleRepository = module.get<Repository<GameModule>>(getRepositoryToken(GameModule));
    userQuizResponseRepository = module.get<Repository<UserQuizResponse>>(getRepositoryToken(UserQuizResponse));
    configService = module.get<ConfigService>(ConfigService);

    // Override the simulateBlockchainProcessing method to prevent delays in tests
    jest.spyOn(service as any, 'simulateBlockchainProcessing').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateReward', () => {
    it('should calculate reward for a module without existing transaction', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      mockRewardTransactionRepository.findOne.mockResolvedValue(null);
      
      // Mock calculateQuizBonus to return a fixed value
      jest.spyOn(service as any, 'calculateQuizBonus').mockResolvedValue('2.50000000');

      // Execute
      const result = await service.calculateReward(userId, moduleId);

      // Verify
      expect(result.moduleId).toEqual(moduleId);
      expect(result.baseAmount).toEqual(10);
      expect(result.bonusAmount).toEqual('2.50000000');
      expect(result.totalAmount).toEqual('12.50000000');
      expect(result.alreadyClaimed).toBe(false);
      expect(mockGameModuleRepository.findOne).toHaveBeenCalledWith({
        where: { id: moduleId },
        relations: ['sections']
      });
      expect(mockRewardTransactionRepository.findOne).toHaveBeenCalled();
    });

    it('should return existing reward transaction if already claimed', async () => {
      // Setup
      const moduleId = 'module1';
      mockGameModuleRepository.findOne.mockResolvedValue(mockModules[0]);
      mockRewardTransactionRepository.findOne.mockResolvedValue(mockTransactions[0]);

      // Execute
      const result = await service.calculateReward(userId, moduleId);

      // Verify
      expect(result.moduleId).toEqual(moduleId);
      expect(result.alreadyClaimed).toBe(true);
      expect(result.transactionId).toEqual(mockTransactions[0].id);
      expect(result.totalAmount).toEqual(mockTransactions[0].amount.toString());
    });

    it('should throw NotFoundException when module not found', async () => {
      // Setup
      const moduleId = 'nonexistent';
      mockGameModuleRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.calculateReward(userId, moduleId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('queueRewardTransaction', () => {
    it('should return existing transaction if already claimed', async () => {
      // Setup
      const moduleId = 'module1';
      
      // Mock calculateReward to return already claimed result
      jest.spyOn(service, 'calculateReward').mockResolvedValue({
        moduleId,
        baseAmount: 10,
        bonusAmount: '2.50000000',
        totalAmount: '12.50000000',
        alreadyClaimed: true,
        transactionId: 'transaction1'
      });
      
      mockRewardTransactionRepository.findOne.mockResolvedValue(mockTransactions[0]);

      // Execute
      const result = await service.queueRewardTransaction(userId, moduleId);

      // Verify
      expect(result.id).toEqual('transaction1');
      expect(result.status).toEqual('completed' as TransactionStatus);
      expect(mockRewardTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'transaction1' }
      });
    });

    it('should create new transaction if not already claimed', async () => {
      // Setup
      const moduleId = 'module2';
      
      // Mock calculateReward to return not claimed result
      jest.spyOn(service, 'calculateReward').mockResolvedValue({
        moduleId,
        baseAmount: 20,
        bonusAmount: '0',
        totalAmount: '20.00000000',
        alreadyClaimed: false
      });
      
      const newTransaction = {
        id: 'new-transaction',
        userId,
        moduleId,
        amount: 20,
        status: 'pending',
        createdAt: new Date()
      };
      
      mockRewardTransactionRepository.create.mockReturnValue(newTransaction);
      mockRewardTransactionRepository.save.mockResolvedValue(newTransaction);

      // Execute
      const result = await service.queueRewardTransaction(userId, moduleId);

      // Verify
      expect(result.id).toEqual('new-transaction');
      expect(result.status).toEqual('pending' as TransactionStatus);
      expect(mockRewardTransactionRepository.create).toHaveBeenCalledWith({
        userId,
        moduleId,
        amount: 20,
        status: 'pending'
      });
      expect(mockRewardTransactionRepository.save).toHaveBeenCalled();
    });
  });

  describe('processRewardBatch', () => {
    it('should process a batch of pending transactions', async () => {
      // Setup
      const pendingTransactions = [
        {
          id: 'pending1',
          userId: 'user1',
          moduleId: 'module1',
          amount: 10,
          status: 'pending',
          save: jest.fn()
        },
        {
          id: 'pending2',
          userId: 'user2',
          moduleId: 'module2',
          amount: 20,
          status: 'pending',
          save: jest.fn()
        }
      ];
      
      mockRewardTransactionRepository.find.mockResolvedValue(pendingTransactions);
      mockRewardTransactionRepository.save.mockImplementation(entity => entity);

      // Execute
      const result = await service.processRewardBatch(2);

      // Verify
      expect(result.processedCount).toEqual(2);
      expect(result.successCount).toEqual(2);
      expect(result.failedCount).toEqual(0);
      expect(result.transactionIds).toContain('pending1');
      expect(result.transactionIds).toContain('pending2');
      expect(mockRewardTransactionRepository.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
        order: { createdAt: 'ASC' },
        take: 2
      });
      expect(mockRewardTransactionRepository.save).toHaveBeenCalledTimes(4); // 2 to processing, 2 to completed
    });

    it('should return empty result when no pending transactions exist', async () => {
      // Setup
      mockRewardTransactionRepository.find.mockResolvedValue([]);

      // Execute
      const result = await service.processRewardBatch();

      // Verify
      expect(result.processedCount).toEqual(0);
      expect(result.successCount).toEqual(0);
      expect(result.failedCount).toEqual(0);
      expect(result.transactionIds).toEqual([]);
    });
  });

  describe('getUserRewardHistory', () => {
    it('should return user reward history', async () => {
      // Setup
      mockRewardTransactionRepository.findAndCount.mockResolvedValue([
        mockTransactions,
        mockTransactions.length
      ]);

      // Execute
      const result = await service.getUserRewardHistory(userId, 10, 0);

      // Verify
      expect(result.transactions.length).toEqual(mockTransactions.length);
      expect(result.totalTransactions).toEqual(mockTransactions.length);
      expect(mockRewardTransactionRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
        relations: ['module']
      });
    });
  });

  describe('getTransactionDetails', () => {
    it('should return transaction details for valid ID', async () => {
      // Setup
      const transactionId = 'transaction1';
      mockRewardTransactionRepository.findOne.mockResolvedValue(mockTransactions[0]);

      // Execute
      const result = await service.getTransactionDetails(userId, transactionId);

      // Verify
      expect(result.id).toEqual(transactionId);
      expect(result.moduleId).toEqual(mockTransactions[0].moduleId);
      expect(result.amount).toEqual(mockTransactions[0].amount);
      expect(mockRewardTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { 
          id: transactionId,
          userId
        },
        relations: ['module']
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      // Setup
      const transactionId = 'nonexistent';
      mockRewardTransactionRepository.findOne.mockResolvedValue(null);

      // Execute & Verify
      await expect(service.getTransactionDetails(userId, transactionId)).rejects.toThrow(NotFoundException);
    });
  });
});