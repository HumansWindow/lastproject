import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../profile.controller';
import { ProfileService } from '../profile.service';
import { ProfileErrorHandlerService } from '../profile-error-handler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

describe('Profile Controller Integration', () => {
  let controller: ProfileController;
  let service: ProfileService;
  let mockProfileRepo: any;
  let mockUserRepo: any;

  const testUserId = uuidv4();
  const testProfileId = uuidv4();

  const mockUser = {
    id: testUserId,
    firstName: 'John',
    lastName: 'Doe',
    isActive: true
  };

  const mockProfile = {
    id: testProfileId,
    userId: testUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    completeLater: false
  };

  beforeEach(async () => {
    mockProfileRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    mockUserRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        ProfileService,
        ProfileErrorHandlerService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockProfileRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  describe('Profile Complete Endpoint', () => {
    it('should complete a profile successfully', async () => {
      // Mock existence check
      jest.spyOn(service, 'exists').mockResolvedValue(false);
      
      // Mock user exists
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      
      // Mock profile creation
      mockProfileRepo.findOne.mockResolvedValue(null);
      mockProfileRepo.create.mockReturnValue(mockProfile);
      mockProfileRepo.save.mockResolvedValue(mockProfile);

      const updateProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };

      const result = await controller.completeProfile({ user: { userId: testUserId } }, updateProfileDto);
      
      expect(result).toEqual(mockProfile);
      expect(service.exists).toHaveBeenCalledWith(testUserId);
    });

    it('should handle field naming inconsistency errors gracefully', async () => {
      // Mock an error when trying to create a profile
      jest.spyOn(service, 'exists').mockResolvedValue(false);
      jest.spyOn(service, 'create').mockImplementation(() => {
        const error = new BadRequestException({
          message: 'Database naming inconsistency detected: field "userId" referenced but only "user_id" exists',
          details: {
            type: 'FIELD_NAMING_INCONSISTENCY',
            problematicField: 'userId',
            correctField: 'user_id'
          },
          fieldNamingError: true
        });
        throw error;
      });

      const updateProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };

      try {
        await controller.completeProfile({ user: { userId: testUserId } }, updateProfileDto);
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response).toHaveProperty('fieldNamingError', true);
        expect(error.response.details.type).toBe('FIELD_NAMING_INCONSISTENCY');
      }
    });
  });

  describe('Profile Complete Later Endpoint', () => {
    it('should mark profile as complete later', async () => {
      // Create a mock profile with completeLater set to true
      const completeLaterProfile = {
        ...mockProfile,
        completeLater: true
      };

      // Mock the service
      jest.spyOn(service, 'markCompleteLater').mockResolvedValue(completeLaterProfile);

      const result = await controller.completeLater(
        { user: { userId: testUserId } }, 
        { completeLater: true }
      );

      expect(result).toEqual(completeLaterProfile);
      expect(service.markCompleteLater).toHaveBeenCalledWith(testUserId, { completeLater: true });
    });

    it('should handle errors when marking profile as complete later', async () => {
      // Mock a database error
      jest.spyOn(service, 'markCompleteLater').mockImplementation(() => {
        throw new Error('Database error occurred');
      });

      try {
        await controller.completeLater(
          { user: { userId: testUserId } }, 
          { completeLater: true }
        );
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Database error occurred');
      }
    });
  });

  describe('Check Profile Exists Endpoint', () => {
    it('should return true when profile exists', async () => {
      jest.spyOn(service, 'exists').mockResolvedValue(true);

      const result = await controller.exists({ user: { userId: testUserId } });

      expect(result).toEqual({ exists: true });
      expect(service.exists).toHaveBeenCalledWith(testUserId);
    });

    it('should return false when profile does not exist', async () => {
      jest.spyOn(service, 'exists').mockResolvedValue(false);

      const result = await controller.exists({ user: { userId: testUserId } });

      expect(result).toEqual({ exists: false });
      expect(service.exists).toHaveBeenCalledWith(testUserId);
    });
  });

  // This test ensures that we're parsing userId correctly from the JWT token
  describe('User ID Extraction', () => {
    it('should correctly extract userId from request.user', async () => {
      // Mock a profile
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockProfileRepo.findOne.mockResolvedValue(mockProfile);
      
      // Call get profile endpoint
      await controller.findOwn({ user: { userId: testUserId } });
      
      // Check userId was extracted correctly
      expect(service.findByUserId).toHaveBeenCalledWith(testUserId);
    });

    it('should handle user objects with id instead of userId', async () => {
      // Mock user with different property name
      const requestWithDifferentUserProp = {
        user: { id: testUserId }
      };

      // Mock a profile response
      jest.spyOn(service, 'findByUserId').mockResolvedValue(mockProfile);
      
      // Test the controller handles both userId and id 
      const result = await controller.findOwn(requestWithDifferentUserProp);
      
      expect(result).toEqual(mockProfile);
      expect(service.findByUserId).toHaveBeenCalledWith(testUserId);
    });
  });
});