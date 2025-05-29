import { Test, TestingModule } from '@nestjs/testing';
import { ReferralController } from '../referral/referral.controller';
import { ReferralService } from '../referral/referral.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';
import { RequestWithUser } from '../shared/interfaces/request-with-user.interface';
import { TestRequestWithUser } from './utils/test-request.interface';
import { ReferralCode } from '../referral/entities/referral-code.entity';

describe('ReferralController', () => {
  let controller: ReferralController;
  let service: Partial<ReferralService>;

  const mockUser = { id: 'test-user-id', email: 'test@example.com', isAdmin: false };
  const mockReferral = {
    id: 'test-referral-id',
    code: 'TESTCODE',
    referrerId: 'test-user-id',
    isActive: true,
  } as ReferralCode;
  const mockReferralStats = {
    referralCode: 'TESTCODE',
    totalReferrals: 5,
    claimedRewards: 2,
    unclaimedRewards: 3,
    referredUsers: [
      {
        id: 'referred-1',
        email: 'referred1@example.com',
        fullName: 'Referred User 1',
        joinedAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    service = {
      getReferralStats: jest.fn().mockResolvedValue(mockReferralStats),
      generateReferralCode: jest.fn().mockResolvedValue(mockReferral),
      toggleReferralCode: jest
        .fn()
        .mockImplementation((userId, isActive) => Promise.resolve({ ...mockReferral, isActive })),
      claimReferralReward: jest.fn().mockResolvedValue({ message: 'Reward claimed successfully' }),
      getReferralByCode: jest.fn().mockImplementation((code) => {
        if (code === 'TESTCODE') {
          return Promise.resolve(mockReferral);
        }
        throw new BadRequestException('Invalid referral code');
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralController],
      providers: [
        {
          provide: ReferralService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReferralController>(ReferralController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getReferralStats', () => {
    it('should return referral stats', async () => {
      // Use TestRequestWithUser for tests to avoid needing all Express Request properties
      const reqWithUser: TestRequestWithUser = { user: mockUser };
      const result = await controller.getReferralStats(reqWithUser as unknown as RequestWithUser);
      expect(result).toEqual(mockReferralStats);
      expect(service.getReferralStats).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('generateReferralCode', () => {
    it('should generate a referral code', async () => {
      // Use TestRequestWithUser for tests to avoid needing all Express Request properties
      const reqWithUser: TestRequestWithUser = { user: mockUser };
      const result = await controller.generateReferralCode(reqWithUser as unknown as RequestWithUser);
      expect(result).toEqual(mockReferral);
      expect(service.generateReferralCode).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('toggleReferralCode', () => {
    it('should toggle referral code activation status', async () => {
      const isActive = false;
      // Use TestRequestWithUser for tests to avoid needing all Express Request properties
      const reqWithUser: TestRequestWithUser = { user: mockUser };
      const result = await controller.toggleReferralCode(reqWithUser as unknown as RequestWithUser, { isActive });
      expect(result).toEqual({ ...mockReferral, isActive });
      expect(service.toggleReferralCode).toHaveBeenCalledWith(mockUser.id, isActive);
    });
  });

  describe('claimReferralReward', () => {
    it('should claim a referral reward', async () => {
      const referralUseId = 'test-referral-use-id';
      // Use TestRequestWithUser for tests to avoid needing all Express Request properties
      const reqWithUser: TestRequestWithUser = { user: mockUser };
      const result = await controller.claimReferralReward(reqWithUser as unknown as RequestWithUser, referralUseId);
      expect(result).toEqual({ message: 'Reward claimed successfully' });
      expect(service.claimReferralReward).toHaveBeenCalledWith(mockUser.id, referralUseId);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate a valid referral code', async () => {
      const result = await controller.validateReferralCode('TESTCODE');
      expect(result).toEqual({ valid: true, referral: mockReferral });
    });

    it('should handle an invalid referral code', async () => {
      jest.spyOn(service, 'getReferralByCode').mockImplementation(() => {
        throw new BadRequestException('Invalid referral code');
      });

      const result = await controller.validateReferralCode('INVALIDCODE');
      expect(result).toEqual({
        valid: false,
        message: 'Invalid referral code',
      });
    });
  });
});
