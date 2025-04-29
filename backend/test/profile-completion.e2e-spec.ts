import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProfileService } from '../src/profile/profile.service';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { Request } from 'express';
import { createMock } from '@golevelup/ts-jest';

describe('Profile Completion Workflow (e2e)', () => {
  let app: INestApplication;
  let profileService: ProfileService;
  let authService: AuthService;
  let usersService: UsersService;

  // Test authentication token
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    profileService = moduleFixture.get<ProfileService>(ProfileService);
    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);

    // Create a test user and get a valid authentication token
    testUserId = uuidv4();
    
    // Create user with valid properties from CreateUserDto
    const testUserDto: CreateUserDto = {
      firstName: 'Test',
      lastName: 'User',
      email: `test-${testUserId.substring(0, 8)}@example.com`,
      password: '12345678',
    };
    
    // Use the DTO to create the user
    const user = await usersService.create(testUserDto);
    
    // Create a proper mock Request object that matches Express.Request
    const mockReq = createMock<Request>({
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest Test Agent'
      },
      // Add additional required properties here if needed
    });
    
    // Pass both required arguments to login
    const authResult = await authService.login({
      email: testUserDto.email,
      password: testUserDto.password,
    }, mockReq);
    
    authToken = authResult.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      await usersService.remove(testUserId);
    } catch (e) {
      console.warn('Failed to clean up test user:', e.message);
    }
    
    await app.close();
  });

  it('should check if profile exists', () => {
    return request(app.getHttpServer())
      .get('/profile/exists')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('exists');
      });
  });

  it('should create a profile through the complete endpoint', () => {
    return request(app.getHttpServer())
      .post('/profile/complete')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'User',
        email: `updated-${testUserId.substring(0, 8)}@example.com`,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('userId', testUserId);
        expect(body).toHaveProperty('firstName', 'Updated');
        expect(body).toHaveProperty('lastName', 'User');
      });
  });

  it('should mark profile as complete-later', () => {
    return request(app.getHttpServer())
      .post('/profile/complete-later')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        completeLater: true,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toHaveProperty('completeLater', true);
      });
  });

  it('should update an existing profile', () => {
    return request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'New Name',
        bio: 'This is my test profile',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('firstName', 'New Name');
        expect(body).toHaveProperty('bio', 'This is my test profile');
      });
  });

  it('should ensure userId is correctly handled', async () => {
    // This test verifies that the userId/user_id fields are correctly synced
    
    // First get the profile
    const response = await request(app.getHttpServer())
      .get('/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const profile = response.body;
    
    // Now validate that both user_id and userId are properly set
    expect(profile).toHaveProperty('userId');
    expect(profile.userId).toBe(testUserId);
    
    // Get the profile directly from the database to verify internal consistency
    const dbProfile = await profileService.findByUserId(testUserId);
    
    // Verify the internal properties - this tests if the database trigger is working
    expect(dbProfile).toBeDefined();
    expect(dbProfile.userId).toBe(testUserId);
  });
});