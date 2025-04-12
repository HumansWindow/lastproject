import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralUse } from './entities/referral.entity';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import { ReferralCode } from './entities/referral-code.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(ReferralUse)
    private referralUseRepository: Repository<ReferralUse>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @InjectRepository(ReferralCode)
    private referralCodeRepository: Repository<ReferralCode>,
  ) {}

  // Fix the async method
  private async generateUniqueCode(): Promise<string> {
    // Generate a random code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if the code already exists
    const existingCode = await this.referralCodeRepository.findOne({
      where: { code }
    });
    
    // If the code already exists, generate a new one
    if (existingCode) {
      return this.generateUniqueCode();
    }
    
    return code;
  }

  // Generate a referral code for a user
  async generateReferralCode(userId: string): Promise<ReferralCode> {
    // Check if user already has a code
    const existingCode = await this.referralCodeRepository.findOne({
      where: { referrerId: userId } // Use referrerId instead of userId
    });

    if (existingCode) {
      return existingCode;
    }

    // Generate new code
    const code = await this.generateUniqueCode();
    const referralCode = this.referralCodeRepository.create({
      code,
      referrerId: userId, // Use referrerId instead of userId
      isActive: true,
    });

    return this.referralCodeRepository.save(referralCode);
  }

  // Get referral statistics for a user
  async getReferralStats(userId: string) {
    // Get total number of referrals
    const totalReferrals = await this.referralRepository.count({
      where: { referrerId: userId },
    });

    // Get successful referrals (those who completed required actions)
    const successfulReferrals = await this.referralUseRepository.count({
      where: { referrerId: userId },
    });

    // Get referral code
    const referralCode = await this.referralCodeRepository.findOne({
      where: { referrerId: userId }, // Use referrerId instead of userId
    });

    // Get list of referred users with basic info
    const referrals = await this.referralRepository.find({
      where: { referrerId: userId },
    });

    const referredUserIds = referrals.map(r => r.referredId);
    const referredUsers = await Promise.all(
      referredUserIds.map((id) => this.usersService.findOne(id)),
    );

    // Extract only necessary information to avoid exposing sensitive data
    const referredUserInfo = await Promise.all(
      referredUsers.map(async user => {
        // Email is now in the profile, so we'll have to handle if it's not available
        let email = undefined;
        
        // Email is accessed through getter which uses profile
        if (user.email) {
          email = user.email;
        }
        
        return {
          id: user.id,
          email, // Use the email from the profile if available
          createdAt: user.createdAt,
        };
      })
    );

    return {
      totalReferrals,
      successfulReferrals,
      referralCode: referralCode?.code || null,
      isActive: referralCode?.isActive || false,
      referredUsers: referredUserInfo,
    };
  }

  // Toggle referral code active status
  async toggleReferralCode(userId: string, isActive: boolean) {
    const referralCode = await this.referralCodeRepository.findOne({
      where: { referrerId: userId }, // Use referrerId instead of userId
    });

    if (!referralCode) {
      throw new NotFoundException('Referral code not found');
    }

    referralCode.isActive = isActive;
    return this.referralCodeRepository.save(referralCode);
  }

  // Process a referral when a user signs up with a referral code
  async processReferral(code: string, newUserId: string) {
    // Look up the referral code
    const referralCode = await this.referralCodeRepository.findOne({
      where: { code, isActive: true },
    });

    if (!referralCode) {
      throw new BadRequestException('Invalid or inactive referral code');
    }

    // Prevent self-referrals
    if (referralCode.referrerId === newUserId) { // Use referrerId instead of userId
      throw new BadRequestException('Cannot refer yourself');
    }

    // Check if this user has already been referred
    const existingReferral = await this.referralRepository.findOne({
      where: { referredId: newUserId },
    });

    if (existingReferral) {
      throw new BadRequestException('User has already been referred');
    }

    // Create the referral record
    const referral = this.referralRepository.create({
      referrerId: referralCode.referrerId, // Use referrerId instead of userId
      referredId: newUserId,
    });

    await this.referralRepository.save(referral);

    // Return referral info
    return {
      referrerId: referralCode.referrerId, // Use referrerId instead of userId
      referredId: newUserId,
    };
  }

  // Record a successful referral use (e.g., after user completes required actions)
  async recordReferralUse(referrerId: string, referredId: string) {
    // Verify the referral exists
    const referral = await this.referralRepository.findOne({
      where: { referrerId, referredId },
    });

    if (!referral) {
      throw new NotFoundException('Referral not found');
    }

    // Check if already recorded
    const existingUse = await this.referralUseRepository.findOne({
      where: { referrerId, referredId },
    });

    if (existingUse) {
      return existingUse;
    }

    // Record the use
    const referralUse = this.referralUseRepository.create({
      referrerId,
      referredId,
      rewardClaimed: false,
    });

    return this.referralUseRepository.save(referralUse);
  }

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

    // In a real implementation, you would trigger the reward here
    // For example, connect to a blockchain service to transfer tokens
    // await this.blockchainService.transferReward(userId, REWARD_AMOUNT);

    return {
      success: true,
      message: 'Reward claimed successfully',
    };
  }
  
  // Add this method to support test cases
  async getReferralByCode(code: string): Promise<ReferralCode> {
    const referralCode = await this.referralCodeRepository.findOne({
      where: { code },
    });
    
    if (!referralCode) {
      throw new BadRequestException('Invalid referral code');
    }
    
    return referralCode;
  }
}
