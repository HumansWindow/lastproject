import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  const mockRequest = {} as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            walletLogin: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            verifyEmail: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw BadRequestException for invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'Password123!',
        username: 'testuser', // Add the required username field
      };

      try {
        await controller.register(registerDto, mockRequest);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Invalid email format');
      }
    });

    it('should call authService.register with valid email', async () => {
      const registerDto = {
        email: 'valid@email.com',
        password: 'Password123!',
        username: 'validuser', // Add the required username field
      };

      jest.spyOn(service, 'register').mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        message: 'Registration successful',
        userId: 'mock-user-id',
      });
      await controller.register(registerDto, mockRequest);
      expect(service.register).toHaveBeenCalledWith(registerDto, mockRequest);
    });
  });

  describe('login', () => {
    it('should return HTTP 200 on successful login', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      jest.spyOn(service, 'login').mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'mock-id',
          email: 'user@example.com',
          firstName: 'Mock',
          lastName: 'User',
          isAdmin: false,
        },
      });
      await controller.login(loginDto, mockRequest);
      expect(service.login).toHaveBeenCalledWith(loginDto, mockRequest);
    });
  });
});
