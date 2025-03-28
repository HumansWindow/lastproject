import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralService } from '../referral/referral.service';
import { UsersService } from '../users/users.service';
import { Referral, ReferralUse } from '../referral/entities/referral.entity';
import { ReferralCode } from '../referral/entities/referral-code.entity';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('ReferralService', () => {
  let service: ReferralService;
  let referralRepository: Repository<Referral>;
  let referralUseRepository: Repository<ReferralUse>;
  let _referralCodeRepository: Repository<ReferralCode>;
  let usersService: Partial<UsersService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
  };

  const mockReferral = {
    id: 'test-referral-id',
    code: 'TESTCODE',
    referrerId: 'test-user-id',
    isActive: true,
    usageCount: 0,
    referrer: mockUser,
  };

  const mockReferralUse = {
    id: 'test-referral-use-id',
    referralId: 'test-referral-id',
    referrerId: 'test-user-id',
    referredId: 'referred-user-id',
    rewardClaimed: false,
  };

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn().mockImplementation((id) => {
        if (id === 'test-user-id') {
          return Promise.resolve(mockUser);
        } else if (id === 'referred-user-id') {
          return Promise.resolve({
            ...mockUser,
            id: 'referred-user-id',
            email: 'referred@example.com',
          });
        }
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(Referral),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ReferralUse),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ReferralCode),
          useClass: Repository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    referralRepository = module.get<Repository<Referral>>(getRepositoryToken(Referral));
    referralUseRepository = module.get<Repository<ReferralUse>>(getRepositoryToken(ReferralUse));
    _referralCodeRepository = module.get<Repository<ReferralCode>>(
      getRepositoryToken(ReferralCode),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateReferralCode', () => {
    it('should generate a referral code for a valid user', async () => {
      // Mock first findOne call (for existing referral) to return null
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(null);
      // Mock second findOne call (inside the while loop) to return null
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(referralRepository, 'create').mockReturnValueOnce(mockReferral as any);
      jest.spyOn(referralRepository, 'save').mockResolvedValueOnce(mockReferral as any);

      const result = await service.generateReferralCode('test-user-id');
      expect(result.code).toBeDefined();
      expect(result.referrerId).toBe('test-user-id');
      expect(result.isActive).toBe(true);
    });

    it('should return existing referral code if one exists', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);

      const result = await service.generateReferralCode('test-user-id');
      expect(result).toEqual(mockReferral);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);

      await expect(service.generateReferralCode('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processReferral', () => {
    it('should process a valid referral', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);
      jest.spyOn(referralUseRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(referralUseRepository, 'create').mockReturnValueOnce(mockReferralUse as any);
      jest.spyOn(referralUseRepository, 'save').mockResolvedValueOnce(mockReferralUse as any);
      jest.spyOn(referralRepository, 'save').mockResolvedValueOnce({
        ...mockReferral,
        usageCount: 1,
      } as any);
      // Mock the referralCodeRepository.findOne call to return null
      jest.spyOn(_referralCodeRepository, 'findOne').mockResolvedValueOnce(null);

      await service.processReferral('TESTCODE', 'referred-user-id');

      expect(referralUseRepository.save).toHaveBeenCalled();
      expect(referralRepository.save).toHaveBeenCalledWith({
        ...mockReferral,
        usageCount: 1,
      });
    });

    it('should throw BadRequestException for invalid referral code', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.processReferral('INVALIDCODE', 'referred-user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for self-referral', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);

      await expect(service.processReferral('TESTCODE', 'test-user-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user already used a referral', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);
      jest.spyOn(referralUseRepository, 'findOne').mockResolvedValueOnce(mockReferralUse as any);

      await expect(service.processReferral('TESTCODE', 'referred-user-id')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getReferralStats', () => {
    it('should return referral stats for a valid user', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);
      jest.spyOn(referralUseRepository, 'find').mockResolvedValueOnce([mockReferralUse] as any);

      const result = await service.getReferralStats('test-user-id');

      expect(result).toHaveProperty('referralCode', 'TESTCODE');
      expect(result).toHaveProperty('totalReferrals', 1);
      expect(result).toHaveProperty('claimedRewards');
      expect(result).toHaveProperty('unclaimedRewards');
      expect(result).toHaveProperty('referredUsers');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(null);

      await expect(service.getReferralStats('nonexistent-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('claimReferralReward', () => {
    it('should claim an unclaimed referral reward', async () => {
      jest.spyOn(referralUseRepository, 'findOne').mockResolvedValueOnce({
        ...mockReferralUse,
        rewardClaimed: false,
      } as any);
      jest
        .spyOn(referralUseRepository, 'save')
        .mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.claimReferralReward('test-user-id', 'test-referral-use-id');

      expect(result).toHaveProperty('message', 'Reward claimed successfully');
      expect(referralUseRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ rewardClaimed: true }),
      );
    });

    it('should throw NotFoundException if referral use not found', async () => {
      jest.spyOn(referralUseRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.claimReferralReward('test-user-id', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if reward already claimed', async () => {
      jest.spyOn(referralUseRepository, 'findOne').mockResolvedValueOnce({
        ...mockReferralUse,
        rewardClaimed: true,
      } as any);

      await expect(
        service.claimReferralReward('test-user-id', 'test-referral-use-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleReferralCode', () => {
    it('should toggle a referral code activation status', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);
      jest
        .spyOn(referralRepository, 'save')
        .mockImplementation((entity) => Promise.resolve(entity as any));

      const result = await service.toggleReferralCode('test-user-id', false);

      expect(result.isActive).toBe(false);
      expect(referralRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException if referral code not found', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.toggleReferralCode('test-user-id', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReferralByCode', () => {
    it('should return a valid referral code', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(mockReferral as any);

      const result = await service.getReferralByCode('TESTCODE');

      expect(result).toEqual(mockReferral);
    });

    it('should throw BadRequestException for invalid or inactive code', async () => {
      jest.spyOn(referralRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.getReferralByCode('INVALIDCODE')).rejects.toThrow(BadRequestException);
    });
  });
});
