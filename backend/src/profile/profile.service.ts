import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { 
  CreateProfileDto, 
  UpdateProfileDto, 
  UpdateLocationDto,
  UpdateProfileEmailDto,
  UpdateProfilePasswordDto,
  UpdateNotificationSettingsDto
} from './dto/profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new profile for a user
   */
  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if profile already exists
    const existingProfile = await this.profileRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new ConflictException(`Profile for user ${userId} already exists`);
    }

    // Check if email is unique if provided
    if (createProfileDto.email) {
      const emailExists = await this.profileRepository.findOne({
        where: { email: createProfileDto.email }
      });
      if (emailExists) {
        throw new ConflictException(`Email ${createProfileDto.email} is already in use`);
      }
    }

    // Create new profile
    const newProfile = this.profileRepository.create({
      userId,
      ...createProfileDto,
    });

    return this.profileRepository.save(newProfile);
  }

  /**
   * Create a new profile for a user within a transaction
   * This method is used when creating profiles as part of a larger transaction
   */
  async createWithTransaction(
    entityManager: EntityManager,
    userId: string, 
    createProfileDto: CreateProfileDto
  ): Promise<Profile> {
    this.logger.log(`Creating profile with transaction for user: ${userId}`);
    
    // Check if user exists using the provided entity manager
    const user = await entityManager.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if profile already exists using the provided entity manager
    const existingProfile = await entityManager.findOne(Profile, { where: { userId } });
    if (existingProfile) {
      throw new ConflictException(`Profile for user ${userId} already exists`);
    }

    // Check if email is unique if provided
    if (createProfileDto.email) {
      const emailExists = await entityManager.findOne(Profile, {
        where: { email: createProfileDto.email }
      });
      if (emailExists) {
        throw new ConflictException(`Email ${createProfileDto.email} is already in use`);
      }
    }

    // Create new profile using the entity manager
    const newProfile = entityManager.create(Profile, {
      userId,
      ...createProfileDto,
    });

    return entityManager.save(newProfile);
  }

  /**
   * Find a profile by user ID
   */
  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(`Profile for user ${userId} not found`);
    }
    return profile;
  }

  /**
   * Find a profile by email
   */
  async findByEmail(email: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { email } });
  }

  /**
   * Find a profile by ID
   */
  async findById(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  /**
   * Update a user's profile
   */
  async update(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);

    // Check if email is unique if it's being updated
    if (updateProfileDto.email && updateProfileDto.email !== profile.email) {
      const emailExists = await this.profileRepository.findOne({
        where: { email: updateProfileDto.email }
      });
      if (emailExists) {
        throw new ConflictException(`Email ${updateProfileDto.email} is already in use`);
      }
    }

    // Remove password from DTO as it requires special handling
    const { password, ...updateData } = updateProfileDto;

    // Update profile
    Object.assign(profile, updateData);

    // Only hash and update password if provided
    if (password) {
      profile.password = await bcrypt.hash(password, 10);
    }

    return this.profileRepository.save(profile);
  }

  /**
   * Update a user's location
   */
  async updateLocation(userId: string, locationDto: UpdateLocationDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);

    // Update the location fields
    Object.assign(profile, locationDto);
    profile.lastLocationUpdate = new Date();

    return this.profileRepository.save(profile);
  }

  /**
   * Update a user's email
   */
  async updateEmail(userId: string, dto: UpdateProfileEmailDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);

    // Check if email is unique
    const emailExists = await this.profileRepository.findOne({
      where: { email: dto.email }
    });
    if (emailExists && emailExists.id !== profile.id) {
      throw new ConflictException(`Email ${dto.email} is already in use`);
    }

    profile.email = dto.email;
    return this.profileRepository.save(profile);
  }

  /**
   * Update a user's password
   */
  async updatePassword(userId: string, dto: UpdateProfilePasswordDto): Promise<{ success: boolean }> {
    const profile = await this.findByUserId(userId);

    // Check if password is set and user is using password authentication
    if (!profile.password) {
      throw new UnauthorizedException('Password login is not enabled for this profile');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, profile.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    profile.password = await bcrypt.hash(dto.newPassword, 10);
    await this.profileRepository.save(profile);

    return { success: true };
  }

  /**
   * Update a user's notification settings
   */
  async updateNotificationSettings(userId: string, dto: UpdateNotificationSettingsDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);

    profile.emailNotifications = dto.emailNotifications;
    profile.pushNotifications = dto.pushNotifications;

    return this.profileRepository.save(profile);
  }

  /**
   * Delete a user's profile
   */
  async remove(userId: string): Promise<{ success: boolean }> {
    const profile = await this.findByUserId(userId);
    await this.profileRepository.remove(profile);
    return { success: true };
  }

  /**
   * Check if a profile exists for a user
   */
  async exists(userId: string): Promise<boolean> {
    const count = await this.profileRepository.count({ where: { userId } });
    return count > 0;
  }
}