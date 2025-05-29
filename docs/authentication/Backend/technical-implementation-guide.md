# Authentication Technical Implementation Guide

This guide provides detailed technical information about the implementation of the authentication system in the LastProject application.

## Table of Contents

1. [Authentication Architecture](#authentication-architecture)
2. [Key Components](#key-components)
3. [Technical Implementation Details](#technical-implementation-details)
4. [Code Examples](#code-examples)
5. [Authentication Flow Diagrams](#authentication-flow-diagrams)
6. [Configuration Options](#configuration-options)
7. [Security Implementation Details](#security-implementation-details)

## Authentication Architecture

The authentication system in LastProject follows a modular architecture built on NestJS framework, with the following high-level design:

```
┌─────────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│   Authentication    │      │    Guards &       │      │    User/Wallet      │
│     Controllers     │─────▶│    Strategies     │─────▶│      Services       │
└─────────────────────┘      └───────────────────┘      └─────────────────────┘
          │                           │                          │
          │                           │                          │
          ▼                           ▼                          ▼
┌─────────────────────┐      ┌───────────────────┐      ┌─────────────────────┐
│       Token         │      │     Session       │      │     Database        │
│      Services       │◀────▶│     Security      │◀────▶│     Repositories    │
└─────────────────────┘      └───────────────────┘      └─────────────────────┘
```

## Key Components

### 1. Authentication Module (`auth.module.ts`)

The central module that organizes authentication-related components:

- Imports necessary dependencies (JWT, Passport)
- Declares controllers and services
- Sets up authentication strategies
- Configures middleware

```typescript
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION', '15m')
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Wallet, RefreshToken, UserDevice]),
    forwardRef(() => UsersModule),
    forwardRef(() => ReferralModule),
    forwardRef(() => BlockchainModule),
  ],
  controllers: [
    AuthController,
    WalletAuthController,
    WalletAuthDebugController,
    DebugController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    WalletStrategy,
    TokenService,
    WalletAuthService,
    WalletTransactionService,
    SessionSecurityService,
    // ...other providers
  ],
  exports: [
    AuthService,
    JwtStrategy,
    TokenService,
    WalletAuthService,
    SessionSecurityService,
  ],
})
export class AuthModule {}
```

### 2. Authentication Service (`auth.service.ts`)

The core service that handles authentication logic:

- User validation
- Login and registration
- Token handling
- Session management
- Wallet integration

### 3. Authentication Controllers

Handle HTTP requests and route them to appropriate services:

- `auth.controller.ts`: Traditional authentication endpoints
- `wallet-auth.controller.ts`: Wallet-based authentication endpoints
- `wallet-auth-debug.controller.ts`: Debug/testing endpoints for wallet auth

### 4. Authentication Strategies

NestJS Passport strategies for different authentication methods:

- `jwt.strategy.ts`: Validates JWT tokens for protected routes
- `local.strategy.ts`: Validates username/password credentials
- `wallet.strategy.ts`: Custom strategy for wallet signature verification

### 5. Authentication Guards

Route guards that protect endpoints based on authentication status:

- `jwt-auth.guard.ts`: Ensures valid JWT token
- `local-auth.guard.ts`: Ensures valid username/password credentials
- `refresh-token.guard.ts`: Validates refresh token requests
- `access-token.guard.ts`: Validates access token requests
- `session-security.guard.ts`: Validates session integrity

### 6. Token Service

Handles JWT token generation, validation, and rotation:

- Access token generation
- Refresh token management
- Token revocation
- Token validation

## Technical Implementation Details

### JWT Token Implementation

The system uses a dual-token approach with access and refresh tokens.

#### Access Token Structure:

```typescript
interface JwtPayload {
  sub: string;         // User ID
  role: string[];      // User roles
  walletAddress?: string; // Optional wallet address
  sessionId?: string;  // Session identifier
  deviceId?: string;   // Device identifier
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}
```

#### Refresh Token Implementation:

```typescript
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ nullable: true })
  replacedByToken: string;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Wallet Authentication Implementation

The wallet authentication process is implemented as follows:

1. **Challenge Generation**:

```typescript
@Post('connect')
@SkipSessionCheck()
async connect(@Body() body: { address?: string, walletAddress?: string }, @Req() req: Request): Promise<WalletConnectResponseDto> {
  // Validate wallet address
  const walletAddress = body.walletAddress || body.address;
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Generate a challenge for the wallet to sign
  const response = await this.authService.handleWalletConnect(normalizedAddress);
  
  // Store challenge in cache
  this.challengeCache.set(normalizedAddress, {
    challenge: response.challenge,
    timestamp: response.timestamp,
    expiresAt: Date.now() + this.CHALLENGE_EXPIRATION
  });
  
  return response;
}
```

2. **Signature Verification**:

```typescript
async verifyWalletSignature(address: string, message: string, signature: string): Promise<boolean> {
  try {
    // Normalize the address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Verify message was signed by the claimed wallet address
    const recoveredAddress = verifyMessage(message, signature).toLowerCase();
    
    // Check if recovered address matches the claimed address
    const isValid = recoveredAddress === normalizedAddress;
    
    if (!isValid) {
      this.logger.warn(`Wallet signature verification failed: Expected ${normalizedAddress}, got ${recoveredAddress}`);
    }
    
    return isValid;
  } catch (error) {
    this.logger.error(`Error verifying wallet signature: ${error.message}`);
    return false;
  }
}
```

### Session Security Implementation

The session security system monitors and controls user sessions:

```typescript
@Injectable()
export class SessionSecurityService {
  private readonly logger = new Logger(SessionSecurityService.name);

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly configService: ConfigService
  ) {}

  async createSession(userId: string, deviceId: string, ipAddress: string, userAgent: string): Promise<UserSession> {
    // Create a new session record
    const session = this.userSessionRepository.create({
      userId,
      deviceId,
      ipAddress,
      userAgent,
      isActive: true,
      lastActivityAt: new Date(),
    });
    
    // Save the session to database
    return this.userSessionRepository.save(session);
  }

  async validateSession(sessionId: string, userId: string): Promise<boolean> {
    // Find the session
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId }
    });
    
    // Check if session exists and is active
    return !!session && session.isActive;
  }

  // Other session management methods...
}
```

## Code Examples

### User Registration

```typescript
async register(registerDto: RegisterDto): Promise<User> {
  const { email, password, firstName, lastName } = registerDto;
  
  // Check if user with this email already exists
  const existingUser = await this.profileService.findByEmail(email);
  if (existingUser) {
    throw new ConflictException('A user with this email already exists');
  }
  
  // Create new user
  const user = this.userRepository.create({
    isVerified: false,
    role: [UserRole.USER],
  });
  
  await this.userRepository.save(user);
  
  // Create profile for the user
  await this.profileService.create({
    userId: user.id,
    email,
    password, // ProfileService will hash this
    firstName,
    lastName
  });
  
  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Store verification token (implementation omitted)
  
  // Send verification email
  await this.mailService.sendVerificationEmail(email, verificationToken);
  
  return user;
}
```

### Wallet Login

```typescript
async walletLogin(
  walletAddress: string,
  signature: string,
  message: string,
  deviceInfo: DeviceInfo
): Promise<TokenResponse> {
  // Verify wallet signature
  const isSignatureValid = await this.verifyWalletSignature(
    walletAddress,
    message,
    signature
  );
  
  if (!isSignatureValid) {
    throw new UnauthorizedException('Invalid signature');
  }
  
  // Find or create user with this wallet
  let user = await this.findUserByWallet(walletAddress);
  
  if (!user) {
    user = await this.createUserWithWallet(walletAddress);
  }
  
  // Generate tokens
  const accessToken = await this.tokenService.generateAccessToken(
    user.id,
    deviceInfo.deviceId,
    deviceInfo.request
  );
  
  const refreshToken = await this.tokenService.createRefreshToken(
    user.id,
    deviceInfo.deviceId,
    deviceInfo.ipAddress
  );
  
  return { accessToken, refreshToken, user };
}
```

## Authentication Flow Diagrams

### Email/Password Authentication Flow

```
┌─────────┐          ┌─────────┐          ┌────────────┐          ┌─────────┐
│         │          │         │          │            │          │         │
│ Client  │          │  Auth   │          │   User     │          │  Token  │
│         │          │ Service │          │  Service   │          │ Service │
│         │          │         │          │            │          │         │
└────┬────┘          └────┬────┘          └─────┬──────┘          └────┬────┘
     │                     │                    │                      │
     │   Login Request     │                    │                      │
     │ ─────────────────► │                    │                      │
     │                     │                    │                      │
     │                     │  Validate User     │                      │
     │                     │ ─────────────────► │                      │
     │                     │                    │                      │
     │                     │  User Validated    │                      │
     │                     │ ◄───────────────── │                      │
     │                     │                    │                      │
     │                     │                Generate JWT Tokens        │
     │                     │ ───────────────────────────────────────► │
     │                     │                                          │
     │                     │                  Tokens                  │
     │                     │ ◄─────────────────────────────────────── │
     │                     │                                          │
     │    Auth Response    │                                          │
     │ ◄───────────────── │                                          │
     │                     │                                          │
```

### Wallet Authentication Flow

```
┌─────────┐        ┌─────────┐        ┌──────────┐        ┌─────────┐
│         │        │  Wallet │        │          │        │         │
│ Client  │        │  Auth   │        │  Auth    │        │  Token  │
│         │        │   Ctrl  │        │ Service  │        │ Service │
│         │        │         │        │          │        │         │
└────┬────┘        └────┬────┘        └────┬─────┘        └────┬────┘
     │                  │                  │                   │
     │ Connect Request  │                  │                   │
     │ ───────────────► │                  │                   │
     │                  │                  │                   │
     │                  │ Generate Challenge                   │
     │                  │ ───────────────► │                   │
     │                  │                  │                   │
     │                  │    Challenge     │                   │
     │                  │ ◄─────────────── │                   │
     │                  │                  │                   │
     │ Challenge Response                  │                   │
     │ ◄─────────────── │                  │                   │
     │                  │                  │                   │
     │   Sign Message   │                  │                   │
     │ ─────────────┐   │                  │                   │
     │              │   │                  │                   │
     │              ▼   │                  │                   │
     │ Auth w/ Signature│                  │                   │
     │ ───────────────► │                  │                   │
     │                  │                  │                   │
     │                  │ Verify Signature │                   │
     │                  │ ───────────────► │                   │
     │                  │                  │                   │
     │                  │  Valid Signature │                   │
     │                  │ ◄─────────────── │                   │
     │                  │                  │                   │
     │                  │               Generate Tokens        │
     │                  │ ───────────────────────────────────► │
     │                  │                                      │
     │                  │                 Tokens               │
     │                  │ ◄─────────────────────────────────── │
     │                  │                                      │
     │  Auth Response   │                                      │
     │ ◄─────────────── │                                      │
     │                  │                                      │
```

## Configuration Options

The authentication system can be configured through environment variables:

```
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Session Security
MAX_SESSIONS_PER_USER=5
SESSION_INACTIVITY_TIMEOUT=7d

# Authentication Settings
AUTH_WALLET_ONLY=false
AUTH_ALLOW_EMAIL_REGISTRATION=true
AUTH_REQUIRE_EMAIL_VERIFICATION=true

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## Security Implementation Details

### Password Hashing

Passwords are hashed using bcrypt with a configurable salt rounds:

```typescript
@Injectable()
export class BcryptService {
  private readonly saltRounds: number;
  
  constructor(configService: ConfigService) {
    this.saltRounds = configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
  }
  
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, this.saltRounds);
  }
  
  async compare(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
```

### Rate Limiting

Rate limiting is implemented using NestJS Throttler:

```typescript
@Injectable()
export class MintRateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    // Use both IP and user ID for rate limiting
    const userId = req.user?.id;
    const ipAddress = req.ip;
    return `${ipAddress}_${userId || 'anonymous'}`;
  }
  
  protected errorMessage(): string {
    return 'Too many requests. Please try again later.';
  }
}
```

### Token Rotation

Refresh tokens are rotated to enhance security:

```typescript
async refreshTokens(refreshToken: string, deviceId: string, ipAddress: string): Promise<TokenPair> {
  // Find token in database
  const token = await this.findRefreshToken(refreshToken);
  
  // Validate token
  if (!token || token.isRevoked || token.expiresAt < new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  // Verify token is used with the same device
  if (token.deviceId && token.deviceId !== deviceId) {
    // Token potentially stolen - revoke
    await this.revokeRefreshToken(token.id, 'Used with different device');
    throw new ForbiddenException('Invalid device');
  }
  
  // Generate new token pair
  const accessToken = await this.generateAccessToken(token.userId, deviceId);
  const newRefreshToken = await this.createRefreshToken(token.userId, deviceId, ipAddress);
  
  // Revoke old token
  await this.revokeRefreshToken(token.id, newRefreshToken.token);
  
  return { accessToken, refreshToken: newRefreshToken.token };
}
```
