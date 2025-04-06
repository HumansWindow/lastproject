import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthServiceMock {
  async register(registerDto: any) {
    return {
      user: {
        id: 'test-user-id',
        email: registerDto.email,
        username: registerDto.username,
        firstName: registerDto.firstName || null,
        lastName: registerDto.lastName || null,
        isActive: true,
        isVerified: false,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  async validateUser(email: string, password: string) {
    if (email === 'login@example.com' && password === 'Password123!') {
      return {
        id: 'test-user-id',
        email,
        username: 'loginuser',
      };
    }
    return null;
  }

  async login(user: any) {
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }
}
