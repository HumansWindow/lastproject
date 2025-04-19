import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

describe('Auth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, RefreshToken],
          synchronize: true,
          dropSchema: true,
        }),
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '15m' },
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('/POST register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.username).toBe('testuser');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('/POST register - should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });

    it('/POST login - should authenticate user', async () => {
      // First register a user
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'Password123!',
      });

      // Then try to login
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('/POST refresh - should issue new tokens with valid refresh token', async () => {
      // Register and login to get a refresh token
      await request(app.getHttpServer()).post('/auth/register').send({
        username: 'refreshuser',
        email: 'refresh@example.com',
        password: 'Password123!',
      });

      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'refresh@example.com',
        password: 'Password123!',
      });
      const refreshToken = loginRes.body.refreshToken;

      // Use the refresh token to get new tokens
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.refreshToken).not.toBe(refreshToken);
        });
    });
  });

  describe('Wallet Authentication', () => {
    it('/GET wallet-nonce - should generate nonce for address', async () => {
      const address = '0x1234567890123456789012345678901234567890';

      return request(app.getHttpServer())
        .get(`/auth/wallet-nonce?address=${address}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('nonce');
        });
    });
  });
});
