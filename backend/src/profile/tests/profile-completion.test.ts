import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from '../profile.service';
import { ProfileErrorHandlerService } from '../profile-error-handler.service';
import { Profile } from '../entities/profile.entity';
import { User } from '../../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Connection, QueryFailedError } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('Profile Completion Flow', () => {
  let profileService: ProfileService;
  let errorHandlerService: ProfileErrorHandlerService;
  let profileRepository: Repository<Profile>;
  let userRepository: Repository<User>;
  
  // Test user data
  const testUser = {
    id: uuidv4(),
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    isVerified: false,
  };

  // Test profile data
  const testProfile = {
    id: uuidv4(),
    userId: testUser.id,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    completeLater: false
  };

  beforeEach(async () => {
    // Create a mock module 
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        ProfileErrorHandlerService,
        {
          provide: getRepositoryToken(Profile),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: Connection,
          useValue: {
            createQueryRunner: jest.fn().mockImplementation(() => ({
              connect: jest.fn(),
              startTransaction: jest.fn(),
              release: jest.fn(),
              rollbackTransaction: jest.fn(),
              commitTransaction: jest.fn(),
              manager: {
                save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
              },
            })),
          },
        },
      ],
    }).compile();

    profileService = module.get<ProfileService>(ProfileService);
    errorHandlerService = module.get<ProfileErrorHandlerService>(ProfileErrorHandlerService);
    profileRepository = module.get<Repository<Profile>>(getRepositoryToken(Profile));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('Profile Service', () => {
    it('should be defined', () => {
      expect(profileService).toBeDefined();
    });

    it('should create a new profile successfully', async () => {
      // Mock existing user
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(testUser as any);
      
      // Mock no existing profile
      jest.spyOn(profileRepository, 'findOne')
        .mockResolvedValueOnce(null) // No existing profile
        .mockResolvedValueOnce(null); // No conflicting email
      
      // Mock save
      jest.spyOn(profileRepository, 'create').mockReturnValueOnce(testProfile as any);
      jest.spyOn(profileRepository, 'save').mockResolvedValueOnce(testProfile as any);

      const result = await profileService.create(testUser.id, {
        firstName: testProfile.firstName,
        lastName: testProfile.lastName,
        email: testProfile.email,
      });

      expect(result).toEqual(testProfile);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: testUser.id } });
      expect(profileRepository.findOne).toHaveBeenCalledTimes(2);
      expect(profileRepository.create).toHaveBeenCalled();
      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      // Mock user not found
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(profileService.create('non-existent-id', {
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when profile already exists', async () => {
      // Mock existing user
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(testUser as any);
      
      // Mock existing profile
      jest.spyOn(profileRepository, 'findOne').mockResolvedValueOnce(testProfile as any);

      await expect(profileService.create(testUser.id, {
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow(ConflictException);
    });
  });

  describe('Profile Completion', () => {
    it('should mark profile as complete-later', async () => {
      // Mock existing user
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(testUser as any);
      
      // Mock existing profile
      const profileWithCompleteLater = {
        ...testProfile,
        completeLater: true
      };
      
      jest.spyOn(profileRepository, 'findOne').mockResolvedValueOnce(testProfile as any);
      jest.spyOn(profileRepository, 'save').mockResolvedValueOnce(profileWithCompleteLater as any);

      const result = await profileService.markCompleteLater(testUser.id, { completeLater: true });
      
      expect(result).toEqual(profileWithCompleteLater);
      expect(profileRepository.findOne).toHaveBeenCalledWith({ where: { userId: testUser.id } });
      expect(profileRepository.save).toHaveBeenCalled();
    });

    it('should create a minimal profile when marking complete-later for new user', async () => {
      // Mock existing user but no profile
      jest.spyOn(profileRepository, 'findOne').mockImplementation(() => {
        throw new NotFoundException(`Profile for user ${testUser.id} not found`);
      });
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(testUser as any);
      
      // Mock queryRunner
      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn().mockResolvedValueOnce({
            ...testProfile,
            completeLater: true
          }),
        },
      };
      
      jest.spyOn(profileRepository.manager.connection, 'createQueryRunner')
        .mockReturnValueOnce(mockQueryRunner as any);
      
      const result = await profileService.markCompleteLater(testUser.id, { completeLater: true });
      
      expect(result).toEqual({
        ...testProfile,
        completeLater: true
      });
      
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle naming inconsistency errors properly', async () => {
      // Mock implementation to test error handler
      jest.spyOn(errorHandlerService, 'isNamingInconsistencyError').mockReturnValueOnce(true);
      jest.spyOn(errorHandlerService, 'parseDbError').mockReturnValueOnce({
        message: 'Database naming inconsistency detected: field "userId" referenced but only "user_id" exists',
        details: {
          type: 'FIELD_NAMING_INCONSISTENCY',
          problematicField: 'userId',
          correctField: 'user_id',
        }
      });
      
      // Mock save function to throw a naming inconsistency error
      jest.spyOn(profileRepository, 'save').mockImplementation(() => {
        const error: any = new Error('record "new" has no field "userId"');
        error.name = 'QueryFailedError';
        throw error;
      });
      
      // Mock user and profile for the test
      jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(testUser as any);
      jest.spyOn(profileRepository, 'findOne')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      jest.spyOn(profileRepository, 'create').mockReturnValueOnce(testProfile as any);
      
      try {
        await profileService.create(testUser.id, {
          firstName: testProfile.firstName,
          lastName: testProfile.lastName,
          email: testProfile.email,
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response).toHaveProperty('fieldNamingError', true);
        expect(errorHandlerService.isNamingInconsistencyError).toHaveBeenCalled();
        expect(errorHandlerService.parseDbError).toHaveBeenCalled();
      }
    });
  });
});