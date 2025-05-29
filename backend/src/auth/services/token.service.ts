import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async createRefreshToken(userId: string): Promise<string> {
    // Generate a random token
    const token = uuidv4();
    
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create and save the refresh token
    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId,
      createdAt: new Date(),
    });
    
    await this.refreshTokenRepository.save(refreshToken);
    
    return token;
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Find the refresh token in the database
      const tokenEntity = await this.refreshTokenRepository.findOne({ 
        where: { token: refreshToken } 
      });
      
      if (!tokenEntity) {
        throw new Error('Refresh token not found');
      }
      
      // Check if the token has expired
      if (tokenEntity.expiresAt < new Date()) {
        // Delete the expired token
        await this.refreshTokenRepository.remove(tokenEntity);
        throw new Error('Refresh token has expired');
      }
      
      // Generate a new access token
      const accessToken = this.jwtService.sign({ 
        sub: tokenEntity.userId 
      });
      
      // Generate a new refresh token and remove the old one
      await this.refreshTokenRepository.remove(tokenEntity);
      const newRefreshToken = await this.createRefreshToken(tokenEntity.userId);
      
      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      this.logger.error(`Error refreshing tokens: ${error.message}`);
      throw error;
    }
  }
  
  async deleteRefreshToken(token: string): Promise<void> {
    try {
      const tokenEntity = await this.refreshTokenRepository.findOne({ 
        where: { token } 
      });
      
      if (tokenEntity) {
        await this.refreshTokenRepository.remove(tokenEntity);
      }
    } catch (error) {
      this.logger.error(`Error deleting refresh token: ${error.message}`);
      throw error;
    }
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    try {
      const tokens = await this.refreshTokenRepository.find({ 
        where: { userId } 
      });
      
      if (tokens.length > 0) {
        await this.refreshTokenRepository.remove(tokens);
      }
    } catch (error) {
      this.logger.error(`Error deleting user refresh tokens: ${error.message}`);
      throw error;
    }
  }
  
  // Updated to match the AuthService expectations (accepts userId, additionalPayload, and request)
  async generateAccessToken(userId: string, additionalPayload?: any, req?: Request): Promise<string> {
    // Create a base payload with the user ID as the subject
    const payload = { 
      sub: userId,
      ...additionalPayload
    };
    
    // Add request-specific metadata if available
    if (req) {
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Add these to the payload if needed
      payload.ip = ip;
      payload.userAgent = userAgent ? userAgent.substring(0, 100) : undefined;
    }
    
    return this.jwtService.sign(payload);
  }
  
  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}
