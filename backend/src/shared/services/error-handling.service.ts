import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);
  
  /**
   * Handle authentication-related errors with appropriate HTTP responses
   */
  handleAuthError(error: any, context: string): never {
    this.logger.error(`Authentication error in ${context}: ${error.message}`, error.stack);
    
    if (error.name === 'PrismaClientKnownRequestError') {
      // Handle database-specific errors
      throw new InternalServerErrorException(`Database error: ${error.message}`);
    } else if (error instanceof JsonWebTokenError) {
      // Handle JWT-specific errors
      throw new UnauthorizedException(`Token error: ${error.message}`);
    } else if (error instanceof TokenExpiredError) {
      // Handle token expiration specifically
      throw new UnauthorizedException('Token has expired. Please login again.');
    } else if (error.code === 'P2025') {
      // Prisma record not found
      throw new BadRequestException(`Resource not found: ${error.message}`);
    } else {
      // General errors
      throw new InternalServerErrorException(`Authentication error: ${error.message}`);
    }
  }
  
  /**
   * Handle wallet-specific authentication errors
   */
  handleWalletAuthError(error: any, walletAddress: string): never {
    this.logger.error(`Wallet auth error for address ${walletAddress}: ${error.message}`, error.stack);
    
    if (error.message?.includes('signature')) {
      throw new UnauthorizedException('Invalid wallet signature');
    } else if (error.message?.includes('challenge')) {
      throw new BadRequestException('Invalid or expired challenge');
    } else {
      throw new InternalServerErrorException(`Wallet authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Handle token refresh errors
   */
  handleRefreshTokenError(error: any, tokenId?: string): never {
    this.logger.error(`Refresh token error ${tokenId ? `for token ${tokenId}` : ''}: ${error.message}`, error.stack);
    
    if (error.message?.includes('expired')) {
      throw new UnauthorizedException('Refresh token has expired. Please login again.');
    } else if (error.message?.includes('invalid')) {
      throw new UnauthorizedException('Invalid refresh token');
    } else {
      throw new InternalServerErrorException(`Token refresh failed: ${error.message}`);
    }
  }
}
