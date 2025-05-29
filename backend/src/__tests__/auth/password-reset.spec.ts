import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { AuthService } from '../../auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MailService } from '../../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { BcryptService } from '../../shared/services/bcrypt.service';

describe('Password Reset Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;
  let mailService: MailService;
  let bcryptService: BcryptService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    // Create test module
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
    })
    .overrideProvider(MailService)
    .useValue({
      sendPasswordReset: jest.fn().mockResolvedValue(true),
      sendEmailVerification: jest.fn().mockResolvedValue(true),
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get services
    authService = moduleRef.get<AuthService>(AuthService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    bcryptService = moduleRef.get<BcryptService>(BcryptService);
    mailService = moduleRef.get<MailService>(MailService);
    
    // Get repositories
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  let testUser: User;

  beforeEach(async () => {
    // Create a test user
    testUser = new User();
    testUser.id = uuidv4();
    testUser.email = `test-${Date.now()}@example.com`;
    testUser.password = await bcryptService.hash('password123');
    testUser.createdAt = new Date();
    // Update property name to match entity
    testUser.isVerified = true;
    await userRepo.save(testUser);
  });

  afterEach(async () => {
    // Clean up after each test
    await userRepo.delete({ id: testUser.id });
  });

  describe('Password Reset Flow', () => {
    it('should generate a password reset token', async () => {
      // Request password reset
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('password reset instructions');
      
      // Check if email was sent
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.any(String), // email
        expect.any(String), // reset token
        expect.any(String), // user's name if available
      );
    });
    
    it('should handle forgot password for non-existent email without revealing user existence', async () => {
      // Request password reset for non-existent email
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('password reset instructions');
      
      // Mail service should not be called for non-existent users
      expect(mailService.sendPasswordReset).not.toHaveBeenCalledWith(
        'nonexistent@example.com',
        expect.any(String),
        expect.any(String),
      );
    });

    it('should validate a valid password reset token', async () => {
      // Use spyOn to access private method
      const generateTokenSpy = jest.spyOn(authService as any, 'generatePasswordResetToken');
      const resetToken = await generateTokenSpy(testUser.email);
      
      // Ensure a token was generated
      expect(resetToken).toBeDefined();
      
      // Verify token through the API
      const response = await request(app.getHttpServer())
        .get(`/auth/validate-reset-token?token=${resetToken}`)
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.valid).toBe(true);
    });

    it('should reject an invalid password reset token', async () => {
      // Use an invalid token
      const invalidToken = 'invalid-token-123';
      
      // Verify token through the API
      const response = await request(app.getHttpServer())
        .get(`/auth/validate-reset-token?token=${invalidToken}`)
        .expect(400);
      
      expect(response.body).toBeDefined();
      expect(response.body.valid).toBe(false);
    });

    it('should reject an expired password reset token', async () => {
      // Generate an expired token (mocked)
      const payload = {
        sub: testUser.id,
        email: testUser.email,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
      };
      
      const expiredToken = jwtService.sign(payload);
      
      // Verify token through the API
      const response = await request(app.getHttpServer())
        .get(`/auth/validate-reset-token?token=${expiredToken}`)
        .expect(400);
      
      expect(response.body).toBeDefined();
      expect(response.body.valid).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should allow resetting password with valid token', async () => {
      // Use spyOn to access private method
      const generateTokenSpy = jest.spyOn(authService as any, 'generatePasswordResetToken');
      const resetToken = await generateTokenSpy(testUser.email);
      
      // New password
      const newPassword = 'newSecurePassword123';
      
      // Reset password
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('password has been reset');
      
      // Verify the password was actually changed
      const updatedUser = await userRepo.findOne({ where: { id: testUser.id } });
      const passwordMatches = await bcryptService.compare(newPassword, updatedUser.password);
      expect(passwordMatches).toBe(true);
    });

    it('should reject password reset with invalid token', async () => {
      // Invalid token
      const invalidToken = 'invalid-token-123';
      
      // Try to reset password
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: invalidToken,
          password: 'newInvalidPassword123',
        })
        .expect(400);
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject password reset with weak password', async () => {
      // Use spyOn to access private method
      const generateTokenSpy = jest.spyOn(authService as any, 'generatePasswordResetToken');
      const resetToken = await generateTokenSpy(testUser.email);
      
      // Weak password
      const weakPassword = 'weak';
      
      // Try to reset password
      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: weakPassword,
        })
        .expect(400);
      
      expect(response.body).toBeDefined();
      expect(response.body.message).toContain('password');
    });

    it('should allow logging in with new password after reset', async () => {
      // Use spyOn to access private method
      const generateTokenSpy = jest.spyOn(authService as any, 'generatePasswordResetToken');
      const resetToken = await generateTokenSpy(testUser.email);
      
      // New password
      const newPassword = 'newSecurePassword123';
      
      // Reset password
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);
      
      // Try to login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: newPassword,
        })
        .expect(200);
      
      expect(loginResponse.body).toBeDefined();
      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();
      expect(loginResponse.body.user).toBeDefined();
      expect(loginResponse.body.user.email).toBe(testUser.email);
    });

    it('should not allow logging in with old password after reset', async () => {
      // Original password
      const originalPassword = 'password123';
      
      // Use spyOn to access private method
      const generateTokenSpy = jest.spyOn(authService as any, 'generatePasswordResetToken');
      const resetToken = await generateTokenSpy(testUser.email);
      
      // New password
      const newPassword = 'newSecurePassword123';
      
      // Reset password
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);
      
      // Try to login with old password
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: originalPassword,
        })
        .expect(401);
      
      expect(loginResponse.body.message).toContain('Invalid');
    });
  });
});