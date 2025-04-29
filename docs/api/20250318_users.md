# User Authentication and Account Management

## Files Involved in User Authentication

### Core Authentication Files

1. **Authentication Controller**
   - `/backend/src/auth/auth.controller.ts`
   - Handles all HTTP requests for authentication-related operations
   - Endpoints include registration, login, logout, refresh token, email verification

2. **Authentication Service**
   - `/backend/src/auth/auth.service.ts`
   - Implements business logic for user authentication
   - Manages JWT token generation, validation, and refresh
   - Implements security measures like rate limiting and device tracking

3. **Authentication DTOs**
   - `/backend/src/auth/dto/auth.dto.ts` - Basic auth data structures
   - `/backend/src/auth/dto/login.dto.ts` - Login request validation
   - `/backend/src/auth/dto/register.dto.ts` - Registration data validation
   - `/backend/src/auth/dto/refresh-token.entity.ts` - Database entity for refresh tokens

4. **Authentication Strategies**
   - `/backend/src/auth/strategies/local.strategy.ts` - Username/password authentication
   - `/backend/src/auth/strategies/jwt.strategy.ts` - Token validation for protected routes
   - `/backend/src/auth/strategies/wallet.strategy.ts` - Blockchain wallet authentication

5. **Authentication Guards**
   - `/backend/src/auth/guards/jwt-auth.guard.ts`
   - `/backend/src/auth/guards/local-auth.guard.ts`
   - `/backend/src/auth/guards/wallet-auth.guard.ts`

### User Management Files

1. **User Entity**
   - `/backend/src/users/entities/user.entity.ts`
   - Database model with user properties and relationships
   - One-to-many relationship with wallets, devices, and sessions

2. **Users Service**
   - `/backend/src/users/users.service.ts`
   - User data management and CRUD operations
   - Methods for finding, creating, and updating users
   - Password reset and email verification logic

3. **Users Controller**
   - `/backend/src/users/users.controller.ts`
   - REST API endpoints for user profile management
   - Role-based access control for admin operations

4. **Users Module**
   - `/backend/src/users/users.module.ts`
   - Connects user components together
   - Imports and exports required services

5. **User Security Entities**
   - `/backend/src/users/entities/user-device.entity.ts` - Tracks devices used by users
   - `/backend/src/users/entities/user-session.entity.ts` - Tracks active user sessions

6. **Security Services**
   - `/backend/src/users/services/user-devices.service.ts` - Manages device tracking
   - `/backend/src/users/services/user-sessions.service.ts` - Manages session tracking

### Supporting Services

1. **Device Detection**
   - `/backend/src/shared/services/device-detector.service.ts`
   - Identifies and fingerprints user devices for security

2. **Mail Service**
   - `/backend/src/mail/mail.service.ts`
   - Sends verification emails and password reset links

3. **Referral Service**
   - `/backend/src/referral/referral.service.ts`
   - Handles referral code validation during registration

### Test Files

1. **Authentication Tests**
   - `/backend/src/__tests__/auth/auth.spec.ts`
   - Comprehensive tests for authentication workflows
   - Tests registration, login, token refresh, and email verification
   - Validates security features and device tracking
   - Recently fixed and completed with all tests passing

2. **Mock Services for Testing**
   - `/backend/src/__tests__/mocks/device-detector.service.mock.ts`
   - `/backend/src/__tests__/mocks/user-devices.service.mock.ts`
   - `/backend/src/__tests__/mocks/user-sessions.service.mock.ts`

## Authentication Flow

1. **Registration**
   - User submits credentials via `/auth/register`
   - Server validates input data
   - Checks for existing users
   - Creates new user with hashed password
   - Generates JWT tokens
   - Tracks device information
   - Sends verification email
   - Returns user data and tokens

2. **Login**
   - User submits credentials via `/auth/login`
   - Server validates credentials
   - Checks device security policy
   - Generates JWT tokens
   - Creates or updates session
   - Returns user data and tokens

3. **Token Refresh**
   - Client uses refresh token to get new access token
   - Server validates refresh token
   - Issues new token pair
   - Updates session information

4. **Email Verification**
   - User receives verification email with token
   - Clicks link to verify email via `/auth/verify-email`
   - Server validates token and marks email as verified

5. **Password Reset**
   - User requests password reset via `/auth/forgot-password`
   - Server sends reset email with token
   - User submits new password with token via `/auth/reset-password`
   - Server validates token and updates password

## Test Coverage

1. **Registration Tests**
   - Successful user registration
   - Validation of email format
   - Password strength requirements
   - Detection of duplicate emails
   - Referral code validation
   - Rate limiting for registrations

2. **Login Tests**
   - Successful authentication with valid credentials
   - Rejection of invalid credentials
   - Security checks for suspicious activities

3. **Token Refresh Tests**
   - JWT token refresh with valid refresh tokens
   - Handling of expired tokens
   - Rejection of invalid tokens

4. **Email Verification Tests**
   - Verification email sending during registration
   - Token validation for email verification
   - Handling of invalid tokens
   - Resending verification emails

## Needed Test Coverage

1. **Password Reset Tests**
   - Token generation for password reset
   - Password reset token validation
   - Successful password update
   - Handling of expired tokens
   - Security measures to prevent token abuse

2. **Session Management Tests**
   - Testing session creation and tracking
   - Session expiration handling
   - Device association rules
