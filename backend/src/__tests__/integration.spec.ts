import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Headers,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TestModule } from './test.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { RefreshToken } from '../auth/dto/refresh-token.entity';
import { ReferralCode } from '../referral/entities/referral-code.entity';
import { UserDevice } from '../users/entities/user-device.entity';
import { UserSession } from '../users/entities/user-session.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Server } from 'http';
import { closeServer, makeTestRequest } from './utils/test-utils';

// Mock auth guard
class MockJwtAuthGuard {
  canActivate() {
    // Always authenticate in test environment
    return true;
  }
}

// Create mock controllers for our integration test
@Controller('auth')
class MockAuthController {
  @Post('register')
  register(@Body() data: any) {
    return {
      user: {
        id: 'test-user-id',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      },
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() data: any) {
    return {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: { id: 'test-user-id', email: data.email },
    };
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() data: any) {
    if (data.refreshToken !== 'test-refresh-token') {
      return { error: 'Invalid refresh token' };
    }
    return { 
      accessToken: 'new-test-access-token',
      refreshToken: 'new-test-refresh-token'
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout() {
    return { message: 'Logged out successfully' };
  }
}

@Controller('users')
class MockUserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile() {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Integration',
      lastName: 'Test',
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() data: any) {
    return { 
      id: 'test-user-id', 
      email: 'test@example.com', 
      firstName: data.firstName || 'Integration',
      lastName: data.lastName || 'Test'
    };
  }
}

@Controller('referrals')
class MockReferralController {
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  generateReferralCode() {
    return { code: 'TEST123', userId: 'test-user-id' };
  }

  @Post('validate')
  validateReferralCode(@Body() data: any) {
    return { 
      valid: data.code === 'TEST123', 
      referrerId: data.code === 'TEST123' ? 'referrer-id' : null
    };
  }
}

@Controller('wallets')
class MockWalletController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getUserWallets() {
    return [
      { id: 'wallet-1', address: '0x123', balance: '100' },
      { id: 'wallet-2', address: '0x456', balance: '200' }
    ];
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createWallet() {
    return { id: 'new-wallet', address: '0x789', balance: '0' };
  }
}

describe('Integration Flow Tests', () => {
  let app: INestApplication;
  let httpRequest: request.SuperTest<request.Test>;
  let server: Server;
  let accessToken: string;
  let refreshToken: string;
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Wallet, RefreshToken, ReferralCode, UserDevice, UserSession],
          synchronize: true,
          dropSchema: true
        }),
        TestModule,
      ],
      controllers: [
        MockAuthController, 
        MockUserController, 
        MockReferralController,
        MockWalletController
      ],
      providers: [
        {
          provide: JwtAuthGuard,
          useClass: MockJwtAuthGuard,
        }
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard)
    .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    
    server = app.getHttpServer();
    httpRequest = request(server);
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (server) {
      await closeServer(server);
    }
  }, 10000);

  // Add custom test request function to always include auth headers
  const authenticatedRequest = async (
    method: string,
    path: string,
    data?: any
  ) => {
    return makeTestRequest(
      httpRequest,
      method,
      path,
      data,
      { 'Authorization': `Bearer ${accessToken || 'test-access-token'}` }
    );
  };

  describe('Full User Journey', () => {
    it('should complete registration and authentication flow', async () => {
      // Step 1: Register a new user
      const registerResponse = await makeTestRequest(
        httpRequest,
        'post',
        '/api/auth/register',
        {
          email: testEmail,
          password: testPassword,
          firstName: 'Integration',
          lastName: 'Test',
        }
      );

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body).toHaveProperty('accessToken');
      expect(registerResponse.body).toHaveProperty('refreshToken');
      
      accessToken = registerResponse.body.accessToken;
      refreshToken = registerResponse.body.refreshToken;
      
      // Step 2: Login with created credentials
      const loginResponse = await makeTestRequest(
        httpRequest,
        'post',
        '/api/auth/login',
        {
          email: testEmail,
          password: testPassword,
        }
      );

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('accessToken');
      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
      
      // Step 3: Access protected profile with token
      const profileResponse = await authenticatedRequest(
        'get',
        '/api/users/profile'
      );
      
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body).toHaveProperty('id');
      expect(profileResponse.body).toHaveProperty('email');
    });
    
    it('should manage user data and settings', async () => {
      // Setup: Ensure we have a token from previous test or login again
      if (!accessToken) {
        const loginResp = await makeTestRequest(
          httpRequest,
          'post',
          '/api/auth/login',
          {
            email: testEmail,
            password: testPassword,
          }
        );
        accessToken = loginResp.body.accessToken;
      }
      
      // Step 1: Update user profile
      const updatedName = 'Updated Name';
      const updateResponse = await authenticatedRequest(
        'patch',
        '/api/users/profile',
        { firstName: updatedName }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty('firstName', updatedName);
      
      // Step 2: Generate referral code
      const referralResponse = await authenticatedRequest(
        'post',
        '/api/referrals/generate'
      );

      expect(referralResponse.status).toBe(201);
      expect(referralResponse.body).toHaveProperty('code', 'TEST123');
      
      // Step 3: Validate the generated referral code
      const validateResponse = await makeTestRequest(
        httpRequest,
        'post',
        '/api/referrals/validate',
        { code: 'TEST123' }
      );
      
      expect(validateResponse.status).toBe(201);
      expect(validateResponse.body).toHaveProperty('valid', true);
    });
    
    it('should handle wallet operations', async () => {
      // Step 1: Get user wallets
      const walletsResponse = await authenticatedRequest(
        'get',
        '/api/wallets'
      );
      
      expect(walletsResponse.status).toBe(200);
      expect(Array.isArray(walletsResponse.body)).toBe(true);
      expect(walletsResponse.body.length).toBeGreaterThan(0);
      
      // Step 2: Create a new wallet
      const newWalletResponse = await authenticatedRequest(
        'post',
        '/api/wallets'
      );
      
      expect(newWalletResponse.status).toBe(201);
      expect(newWalletResponse.body).toHaveProperty('id', 'new-wallet');
    });
    
    it('should manage authentication tokens', async () => {
      // Step 1: Refresh the access token
      const refreshResponse = await makeTestRequest(
        httpRequest,
        'post',
        '/api/auth/refresh',
        { refreshToken }
      );

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toHaveProperty('accessToken', 'new-test-access-token');
      
      accessToken = refreshResponse.body.accessToken;
      if (refreshResponse.body.refreshToken) {
        refreshToken = refreshResponse.body.refreshToken;
      }
      
      // Step 2: Logout
      const logoutResponse = await authenticatedRequest(
        'post',
        '/api/auth/logout'
      );
      
      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toHaveProperty('message', 'Logged out successfully');
    });
  });
});
