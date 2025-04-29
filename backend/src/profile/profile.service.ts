import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, QueryFailedError } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { 
  CreateProfileDto, 
  UpdateProfileDto, 
  UpdateLocationDto,
  UpdateProfileEmailDto,
  UpdateProfilePasswordDto,
  UpdateNotificationSettingsDto,
  CompleteLaterDto
} from './dto/profile.dto';
import * as bcrypt from 'bcrypt';
import { ProfileErrorHandlerService } from './profile-error-handler.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly errorHandler: ProfileErrorHandlerService,
  ) {}

  /**
   * Create a new profile for a user
   */
  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    try {
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

      return await this.profileRepository.save(newProfile);
    } catch (error) {
      // Check for specific field naming inconsistency errors
      if (this.errorHandler.isNamingInconsistencyError(error)) {
        const { message, details } = this.errorHandler.parseDbError(error);
        throw new BadRequestException({ 
          message, 
          details,
          fieldNamingError: true 
        });
      }
      
      // Handle other database errors
      if (error instanceof QueryFailedError) {
        const { message } = this.errorHandler.parseDbError(error);
        throw new InternalServerErrorException(message);
      }
      
      // Re-throw known application exceptions
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // For any other errors, log and throw a generic error
      this.logger.error(`Failed to create profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create profile');
    }
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
    try {
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

      return await entityManager.save(newProfile);
    } catch (error) {
      // Handle specific naming inconsistency errors
      if (this.errorHandler.isNamingInconsistencyError(error)) {
        const { message, details } = this.errorHandler.parseDbError(error);
        this.logger.error(`Field naming inconsistency detected: ${message}`, details);
        throw new BadRequestException({
          message: 'Field naming inconsistency detected in database transaction',
          details,
          fieldNamingError: true
        });
      }
      
      // Re-throw the original error for transaction handling
      throw error;
    }
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
   * Mark a profile as "complete later"
   * @param userId User ID
   * @param completeLaterDto Complete later data
   * @returns Updated profile
   */
  async markCompleteLater(userId: string, completeLaterDto: CompleteLaterDto): Promise<Profile> {
    try {
      // First check if the profile exists
      let profile: Profile;
      try {
        profile = await this.findByUserId(userId);
        
        // Update the existing profile
        profile.completeLater = completeLaterDto.completeLater;
        return await this.profileRepository.save(profile);
      } catch (error) {
        if (error instanceof NotFoundException) {
          // If profile doesn't exist, create a minimal one with completeLater flag
          const user = await this.userRepository.findOne({ where: { id: userId } });
          if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
          }
          
          try {
            // Create minimal profile with completeLater flag
            // We use queryRunner to ensure transaction safety
            const queryRunner = this.profileRepository.manager.connection.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            
            try {
              // Create the profile entity first
              const newProfile = new Profile();
              // Set only the required user ID field using snake_case convention
              newProfile.userId = userId;  // This maps to user_id in the database
              newProfile.completeLater = completeLaterDto.completeLater;
              
              // Save within the transaction
              const savedProfile = await queryRunner.manager.save(newProfile);
              await queryRunner.commitTransaction();
              
              return savedProfile;
            } catch (txError) {
              // If anything fails, roll back the transaction
              await queryRunner.rollbackTransaction();
              
              // Check specifically for naming inconsistency errors
              if (this.errorHandler.isNamingInconsistencyError(txError)) {
                const { message, details } = this.errorHandler.parseDbError(txError);
                this.logger.error(`Field naming inconsistency during complete-later: ${message}`, details);
                throw new BadRequestException({
                  message: 'Database field naming inconsistency detected',
                  details,
                  fieldNamingError: true
                });
              }
              
              this.logger.error(`Failed to create profile: ${txError.message}`, txError.stack);
              throw txError;
            } finally {
              // Release the query runner
              await queryRunner.release();
            }
          } catch (dbError) {
            // Handle specific database errors with better messages
            if (dbError instanceof QueryFailedError) {
              const { message } = this.errorHandler.parseDbError(dbError);
              throw new InternalServerErrorException(message);
            }
            
            this.logger.error(`Database error creating profile: ${dbError.message}`, dbError.stack);
            throw dbError;
          }
        }
        
        // Re-throw any other errors
        throw error;
      }
    } catch (error) {
      // Handle any uncaught errors
      if (!(error instanceof NotFoundException) && 
          !(error instanceof BadRequestException) && 
          !(error instanceof InternalServerErrorException)) {
        this.logger.error(`Unexpected error in markCompleteLater: ${error.message}`, error.stack);
        throw new InternalServerErrorException('An unexpected error occurred while processing your request');
      }
      throw error;
    }
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