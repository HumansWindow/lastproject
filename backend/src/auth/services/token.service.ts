import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private errorHandlingService: ErrorHandlingService,
  ) {}

  /**
   * Generate a JWT access token for the user
   */
  async generateAccessToken(userId: string): Promise<string> {
    try {
      const payload = { sub: userId };
      return this.jwtService.sign(payload);
    } catch (error) {
      this.logger.error(`Error generating access token for user ${userId}: ${error.message}`);
      this.errorHandlingService.handleAuthError(error, 'generateAccessToken');
    }
  }

  /**
   * Create a new refresh token for a user
   */
  async createRefreshToken(userId: string): Promise<string> {
    try {
      // Set expiration date (e.g., 7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Generate a secure random token
      const token = this.generateRandomToken();
      
      // Skip database storage if configured for testing
      const skipTokenStorage = process.env.SKIP_REFRESH_TOKEN_STORAGE === 'true';
      if (skipTokenStorage && (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development')) {
        this.logger.warn(`[TEST MODE] Skipping refresh token storage for user: ${userId}`);
        return token;
      }
      
      // Store the token in the database
      const refreshToken = this.refreshTokenRepository.create({
        token,
        expiresAt,
        userId,
        createdAt: new Date(),
      });
      
      await this.refreshTokenRepository.save(refreshToken);
      
      return token;
    } catch (error) {
      this.logger.error(`Error creating refresh token for user ${userId}: ${error.message}`);
      this.errorHandlingService.handleAuthError(error, 'createRefreshToken');
    }
  }
  
  /**
   * Validate a refresh token and return the associated user ID
   */
  async validateRefreshToken(token: string): Promise<string> {
    try {
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { token }
      });
      
      if (!refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      // Check if token is expired
      if (refreshToken.expiresAt < new Date()) {
        throw new Error('Refresh token has expired');
      }
      
      return refreshToken.userId;
    } catch (error) {
      this.logger.error(`Error validating refresh token: ${error.message}`);
      this.errorHandlingService.handleRefreshTokenError(error);
    }
  }
  
  /**
   * Refresh the tokens: invalidate the old refresh token and create new ones
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const queryRunner = this.refreshTokenRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Find and validate the refresh token
      const tokenEntity = await queryRunner.manager.findOne(RefreshToken, {
        where: { token: refreshToken }
      });
      
      if (!tokenEntity) {
        throw new Error('Invalid refresh token');
      }
      
      if (tokenEntity.expiresAt < new Date()) {
        throw new Error('Refresh token has expired');
      }
      
      const userId = tokenEntity.userId;
      
      // Invalidate the old refresh token
      await queryRunner.manager.remove(tokenEntity);
      
      // Generate new tokens
      const newAccessToken = await this.generateAccessToken(userId);
      const newRefreshToken = await this.createRefreshToken(userId);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      // Rollback on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.errorHandlingService.handleRefreshTokenError(error);
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }
  
  /**
   * Generate a secure random token
   */
  private generateRandomToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }
}
