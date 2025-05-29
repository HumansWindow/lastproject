# Authentication Developer's Guide

This guide is intended for developers working with the LastProject authentication system. It covers best practices, integration patterns, and common development scenarios.

## Table of Contents

1. [Integration Patterns](#integration-patterns)
2. [Best Practices](#best-practices)
3. [Authentication API Endpoints](#authentication-api-endpoints)
4. [Common Development Scenarios](#common-development-scenarios)
5. [Troubleshooting](#troubleshooting)
6. [Testing](#testing)

## Integration Patterns

When integrating your module with the authentication system, follow these patterns for consistency and security.

### 1. Route Protection

To protect your routes with authentication, use the appropriate guards:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('protected-resource')
@UseGuards(AuthGuard('jwt')) // Protect all controller routes
export class ProtectedResourceController {
  
  @Get()
  getResource(@GetUser() user: User) {
    // This route is protected and user is authenticated
    return { message: `Hello ${user.id}!` };
  }
  
  @Get('public')
  @Public() // Use the Public decorator to exclude from auth
  getPublicResource() {
    // This route is public despite controller-level guard
    return { message: 'This is public' };
  }
}
```

### 2. Role-Based Access Control

For role-based restrictions, use the RolesGuard:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Apply both guards
export class AdminController {
  
  @Get()
  @Roles(UserRole.ADMIN)
  getAdminDashboard() {
    // Only users with ADMIN role can access
    return { message: 'Admin dashboard' };
  }
  
  @Get('reports')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  getReports() {
    // Users with ADMIN or MODERATOR role can access
    return { message: 'Reports' };
  }
}
```

### 3. Accessing Authenticated User

When you need access to the authenticated user in your service or controller:

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';

@Injectable()
export class YourService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(REQUEST) private readonly request: any
  ) {}
  
  async doSomethingWithAuthenticatedUser() {
    // Option 1: Get user from request directly
    const user = this.request.user;
    
    // Option 2: Get full user from database using ID from request
    const fullUser = await this.usersService.findById(this.request.user.id);
    
    // Proceed with operation
  }
}
```

### 4. Working with WebSockets

For WebSocket authentication, use the WsAuthGuard:

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'socket.io';
import { WsAuthGuard } from '../auth/guards/ws-auth.guard';
import { WsUser } from '../auth/decorators/ws-user.decorator';

@WebSocketGateway({ cors: true })
@UseGuards(WsAuthGuard) // Protect all websocket connections
export class YourGateway {
  @WebSocketServer() server: Server;
  
  @SubscribeMessage('message')
  handleMessage(@WsUser() user: any, payload: any): void {
    // Handle authenticated websocket message
    this.server.to(user.id).emit('response', { 
      message: `Message received, ${user.id}!`,
      payload
    });
  }
}
```

## Best Practices

### 1. Security Best Practices

- **Never store JWT tokens in local storage**: Use secure, httpOnly cookies
- **Always validate input data**: Use DTOs with class-validator
- **Rate limit authentication endpoints**: Prevent brute force attacks
- **Log authentication events**: For security auditing
- **Use HTTPS**: Ensure all auth traffic is encrypted
- **Set appropriate token expiration**: Short-lived access tokens (15-60 mins)

### 2. Code Best Practices

- **Separate Authentication Logic**: Keep auth logic in dedicated services
- **Use Decorators for Metadata**: Like `@Public()` and `@Roles()`
- **Error Handling**: Return appropriate status codes and non-revealing error messages
- **Typed User Access**: Use strongly typed user objects with decorators

### 3. Error Handling

Follow these error handling practices for authentication-related errors:

```typescript
import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

// For invalid credentials
throw new UnauthorizedException('Invalid credentials');

// For valid credentials but insufficient permissions
throw new ForbiddenException('Insufficient privileges');

// For invalid input data
throw new BadRequestException('Invalid wallet address format');
```

## Authentication API Endpoints

### Traditional Authentication

| Method | Endpoint           | Description                | Authentication |
|--------|-------------------|----------------------------|----------------|
| POST   | `/auth/register`  | Register new user          | None           |
| POST   | `/auth/login`     | Login with email/password  | None           |
| POST   | `/auth/logout`    | Logout user                | JWT            |
| POST   | `/auth/refresh`   | Refresh access token       | Refresh Token  |

### Wallet Authentication

| Method | Endpoint                      | Description                   | Authentication |
|--------|------------------------------|-------------------------------|----------------|
| POST   | `/auth/wallet/connect`       | Initiate wallet connection    | None           |
| POST   | `/auth/wallet/authenticate`  | Complete wallet authentication| None           |
| POST   | `/auth/wallet/recovery-challenge` | Get recovery token       | None           |
| POST   | `/auth/wallet/profile`       | Get wallet profile            | JWT            |

### Example Requests and Responses

#### Wallet Connect

Request:
```json
POST /auth/wallet/connect
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
}
```

Response:
```json
{
  "address": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
  "challenge": "I am signing this message to authenticate with LastProject. Nonce: a1b2c3d4e5f6",
  "timestamp": 1653502283746,
  "isExistingUser": true
}
```

#### Wallet Authenticate

Request:
```json
POST /auth/wallet/authenticate
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "message": "I am signing this message to authenticate with LastProject. Nonce: a1b2c3d4e5f6",
  "signature": "0x4d7f29326795d3afd1c943ffd2113608ed1f8c7e86a9b7d6763d1fb5633950af50642509c5551cc1595656a0251e47083b9dce389b822f8e80df9172ee6eb8db1c"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456ghi789jkl0",
  "user": {
    "id": "12345",
    "walletAddress": "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    "role": ["user"]
  }
}
```

## Common Development Scenarios

### 1. Protecting a New Module

When creating a new module that requires authentication:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { YourController } from './your.controller';
import { YourService } from './your.service';

@Module({
  imports: [AuthModule], // Import auth module to use guards
  controllers: [YourController],
  providers: [YourService],
})
export class YourModule {}
```

### 2. Adding Custom Auth Logic

If you need custom authentication behavior:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for public route marker
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    // Fall back to regular JWT auth guard
    return super.canActivate(context) as Promise<boolean>;
  }
}
```

### 3. Working with Frontend Integration

For frontend applications, implement authentication like this:

```typescript
// Frontend code example (assuming React + Axios)

// Store tokens securely in httpOnly cookies, managed by backend

// Interceptor for handling token expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        await axios.post('/auth/refresh');
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Wallet authentication example
async function connectWallet() {
  // Request connection
  const response = await axios.post('/auth/wallet/connect', {
    address: currentWalletAddress
  });
  
  // Request wallet signature
  const { challenge } = response.data;
  const signature = await requestWalletSignature(challenge);
  
  // Authenticate
  const authResponse = await axios.post('/auth/wallet/authenticate', {
    address: currentWalletAddress,
    message: challenge,
    signature
  });
  
  // Store user info in state
  setUser(authResponse.data.user);
}
```

## Troubleshooting

### 1. JWT Validation Issues

If you encounter JWT validation errors, check:

- Token expiration time
- JWT secret consistency across services
- JWT audience/issuer settings
- Token format and encoding

### 2. Wallet Signature Failures

Common causes of wallet signature validation failures:

- Message format differences (whitespace, newlines)
- Case sensitivity in wallet addresses
- Invalid or expired challenges
- Front-end wallet integration issues

### 3. CORS Issues

For cross-origin requests with authentication:

```typescript
// In main.ts
app.enableCors({
  origin: configService.get<string>('FRONTEND_URL'),
  credentials: true, // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
});
```

## Testing

### 1. Unit Testing Authentication

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        // Include other required providers and mocks
      ],
    }).compile();
    
    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);
  });
  
  describe('validateUser', () => {
    it('should return a user object when credentials are valid', async () => {
      const testUser = {
        id: 'user-id',
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
      };
      
      mockUserRepository.findOne.mockResolvedValue(testUser);
      
      const result = await authService.validateUser(
        'test@example.com',
        'password'
      );
      
      expect(result).toEqual({
        id: testUser.id,
        email: testUser.email,
      });
      
      // Password should not be included
      expect(result.password).toBeUndefined();
    });
  });
});
```

### 2. E2E Testing Authentication

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('Traditional Auth Flow', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
    });
    
    it('should login and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);
        
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
    
    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/protected-resource')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
  
  describe('Wallet Auth Flow', () => {
    // Similar tests for wallet auth flow
    // Note: Wallet signing requires mocking
  });
});
```
