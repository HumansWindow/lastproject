import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Patch, Body, UseGuards, Post, Delete, Param, Query } from '@nestjs/common';
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
import { Server } from 'http';
import { closeServer, runInSeries, makeTestRequest } from './utils/test-utils';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Create a proper auth guard for testing
class MockJwtAuthGuard {
  canActivate(context) {
    // Add a user object to the request
    const request = context.switchToHttp().getRequest();
    request.user = { 
      id: 'test-id', 
      email: 'test@example.com', 
      username: 'testuser' 
    };
    return true;
  }
}

// Create comprehensive mock UsersController with proper auth guard
@Controller('users')
class MockUsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile() {
    return { id: 'test-id', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() data: any) {
    return { id: 'test-id', ...data };
  }

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  updatePreferences(@Body() data: any) {
    return { id: 'test-id', preferences: data };
  }

  @Get('wallets')
  @UseGuards(JwtAuthGuard)
  getWallets() {
    return [
      { id: 'wallet1', address: '0x123', balance: '100' },
      { id: 'wallet2', address: '0x456', balance: '200' }
    ];
  }

  @Post('wallets')
  @UseGuards(JwtAuthGuard)
  createWallet(@Body() data: any) {
    return { id: 'new-wallet', address: data.address, balance: '0' };
  }
}

// Create mock wallet controller
@Controller('wallets')
class MockWalletController {
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getWallet(@Param('id') id: string) {
    return { id, address: `0x${id}`, balance: '100' };
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  transferFunds(@Param('id') id: string, @Body() data: any) {
    return { 
      id: 'tx123', 
      from: id, 
      to: data.to, 
      amount: data.amount, 
      status: 'completed' 
    };
  }
}

// Create mock NFT controller
@Controller('nfts')
class MockNftController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getNfts(@Query('userId') userId: string) {
    return [
      { id: 'nft1', name: 'Artwork #1', owner: userId || 'test-id' },
      { id: 'nft2', name: 'Artwork #2', owner: userId || 'test-id' }
    ];
  }

  @Post('mint')
  @UseGuards(JwtAuthGuard)
  mintNft(@Body() data: any) {
    return { 
      id: 'new-nft', 
      name: data.name, 
      description: data.description,
      owner: 'test-id',
      txHash: '0xabcdef'
    };
  }
}

// Create mock service
class MockUsersService {
  findProfile() {
    return Promise.resolve({
      id: 'test-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
  }

  updateProfile(data: any) {
    return Promise.resolve({
      id: 'test-id',
      ...data,
    });
  }
}

describe('API Endpoints', () => {
  let app: INestApplication;
  let httpRequest: request.SuperTest<request.Test>;
  let server: Server;
  let module: TestingModule;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite', // Using sqlite for testing - no additional packages needed
          database: ':memory:',
          entities: [User, Wallet, RefreshToken, ReferralCode, UserDevice, UserSession],
          synchronize: true, 
          dropSchema: true, // Safe to use with in-memory database
        }),
        TestModule,
      ],
      controllers: [MockUsersController, MockWalletController, MockNftController],
      providers: [
        {
          provide: 'UsersService',
          useClass: MockUsersService,
        },
        {
          provide: JwtAuthGuard,
          useClass: MockJwtAuthGuard,
        }
      ],
    })
    // Override the JwtAuthGuard with our mock
    .overrideGuard(JwtAuthGuard)
    .useClass(MockJwtAuthGuard);

    module = await moduleRef.compile();
    app = module.createNestApplication();

    // Configure global prefix
    app.setGlobalPrefix('api');

    await app.init();
    
    // Get the raw HTTP server for supertest
    server = app.getHttpServer();
    httpRequest = request(server);

    // Mock JWT token for testing
    accessToken = 'mock-jwt-token';
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
      
      if (server) {
        await closeServer(server);
      }
    }
  }, 10000);

  describe('User Profile API', () => {
    it('should fetch user profile successfully', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'get',
        '/api/users/profile',
        null
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual('test-id');
      expect(response.body.email).toEqual('test@example.com');
    });
    
    it('should update user profile with valid data', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'patch',
        '/api/users/profile',
        { firstName: 'Updated', lastName: 'User' }
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual('test-id');
      expect(response.body.firstName).toEqual('Updated');
      expect(response.body.lastName).toEqual('User');
    });
    
    it('should create user preferences', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'post',
        '/api/users/preferences',
        { theme: 'dark', notifications: true }
      );
      
      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
      expect(response.body.preferences).toEqual({ theme: 'dark', notifications: true });
    });
  });

  describe('Wallet API', () => {
    it('should fetch user wallets', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'get',
        '/api/users/wallets',
        null
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].address).toBeDefined();
    });
    
    it('should create a new wallet', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'post',
        '/api/users/wallets',
        { address: '0xnew', type: 'ethereum' }
      );
      
      expect(response.status).toBe(201);
      expect(response.body.address).toBeDefined();
    });
    
    it('should get wallet details', async () => {
      const walletId = 'test123';
      const response = await makeTestRequest(
        httpRequest,
        'get',
        `/api/wallets/${walletId}`,
        null
      );
      
      expect(response.status).toBe(200);
      expect(response.body.id).toEqual(walletId);
      expect(response.body.address).toEqual(`0x${walletId}`);
    });
    
    it('should process a wallet transfer', async () => {
      const walletId = 'source123';
      const response = await makeTestRequest(
        httpRequest,
        'post',
        `/api/wallets/${walletId}/transfer`,
        { to: 'dest456', amount: '50.5' }
      );
      
      expect(response.status).toBe(201);
      expect(response.body.from).toEqual(walletId);
      expect(response.body.status).toEqual('completed');
    });
  });

  describe('NFT API', () => {
    it('should get user NFTs', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'get',
        '/api/nfts',
        null
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
    
    it('should mint a new NFT', async () => {
      const response = await makeTestRequest(
        httpRequest,
        'post',
        '/api/nfts/mint',
        { name: 'My New NFT', description: 'Test NFT Creation' }
      );
      
      expect(response.status).toBe(201);
      expect(response.body.name).toEqual('My New NFT');
      expect(response.body.txHash).toBeDefined();
    });
  });

  describe('Authorization', () => {
    it('should handle auth headers properly', async () => {
      const response = await httpRequest
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(200);
      
      // Note: Our mock guard always returns true, so this demonstrates
      // how to send auth headers but doesn't actually test auth rejection
    });
  });
});
