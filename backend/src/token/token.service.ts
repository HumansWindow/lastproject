import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository?: Repository<RefreshToken>,
  ) {
    this.logger.log('TokenService initialized');
  }

  /**
   * Generate access and refresh tokens for a user
   * @param userId User ID
   * @param additionalClaims Additional claims to include in the token
   * @returns Object containing access and refresh tokens
   */
  async generateTokens(userId: string, additionalClaims: Record<string, any> = {}) {
    this.logger.debug(`Generating tokens for user: ${userId}`);
    
    const payload = {
      sub: userId,
      ...additionalClaims
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    // Generate refresh token with longer expiration
    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenType: 'refresh' },
      {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', this.configService.get<string>('JWT_SECRET')),
      },
    );

    this.logger.debug(`Tokens generated successfully for user: ${userId}`);
    
    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate an access token for a user with optional session information
   * @param userId User ID
   * @param additionalClaims Additional claims to include
   * @param req Optional request object for session context
   * @returns JWT access token string
   */
  async generateAccessToken(userId: string, additionalClaims: Record<string, any> = {}, req?: Request): Promise<string> {
    // Create the base payload
    const payload: Record<string, any> = {
      sub: userId,
      ...additionalClaims,
    };
    
    // Add session context if request is provided
    if (req) {
      // Add IP address for additional security
      payload.ip = req.ip || (req.connection && req.connection.remoteAddress) || 'unknown';
      
      // Add user agent for browser tracking
      payload.userAgent = req.headers['user-agent'] || 'unknown';
      
      // Optionally add other session data like device fingerprint
      if (req.headers['x-device-fingerprint']) {
        payload.deviceFingerprint = req.headers['x-device-fingerprint'];
      }
    }
    
    // Generate and return the access token
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Create a refresh token in the database and return it
   * @param userId User ID
   * @returns JWT refresh token string
   */
  async createRefreshToken(userId: string): Promise<string> {
    // Generate JWT refresh token
    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenType: 'refresh' },
      {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', this.configService.get<string>('JWT_SECRET')),
      },
    );
    
    // Compute expiration date for database storage
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
    const match = expiresIn.match(/^(\d+)([smhdw])$/);
    let expiresInMs = 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2];
      
      switch (unit) {
        case 's': expiresInMs = value * 1000; break;
        case 'm': expiresInMs = value * 60 * 1000; break;
        case 'h': expiresInMs = value * 60 * 60 * 1000; break;
        case 'd': expiresInMs = value * 24 * 60 * 60 * 1000; break;
        case 'w': expiresInMs = value * 7 * 24 * 60 * 60 * 1000; break;
      }
    }
    
    const expiresAt = new Date(Date.now() + expiresInMs);
    
    try {
      // Store the refresh token if repository is available
      if (this.refreshTokenRepository) {
        const tokenEntity = this.refreshTokenRepository.create({
          token: refreshToken,
          userId,
          expiresAt
        });
        
        await this.refreshTokenRepository.save(tokenEntity);
        this.logger.log(`Refresh token stored in database for user: ${userId}`);
      } else {
        this.logger.warn(`RefreshToken repository not available - token not stored in database`);
      }
    } catch (error) {
      // Log error but don't fail - we can still return the token
      this.logger.error(`Failed to store refresh token in database: ${error.message}`);
    }
    
    return refreshToken;
  }

  /**
   * Verify an access token
   * @param token The JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyAccessToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Verify a refresh token
   * @param token The refresh token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', this.configService.get<string>('JWT_SECRET')),
      });
    } catch (error) {
      this.logger.error(`Refresh token verification failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Decode a JWT token without verifying it
   * @param token The JWT token to decode
   * @returns Decoded token payload or null if malformed
   */
  decodeToken(token: string) {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.error(`Token decoding failed: ${error.message}`);
      return null;
    }
  }
}
