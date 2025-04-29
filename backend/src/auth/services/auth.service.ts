import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get user profile info for token debugging
   */
  async getUserProfileInfo(userId: string) {
    try {
      // Try to get user from database
      const user = await this.usersService.findOne(userId);
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      
      // Return basic user info for debug purposes
      return {
        id: user.id,
        walletAddress: user.walletAddress,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get user profile info: ${error.message}`);
    }
  }

  /**
   * Verify a wallet signature
   */
  async verifyWalletSignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      // In test mode, bypass signature verification if enabled
      if (this.configService.get<boolean>('BYPASS_WALLET_SIGNATURE', false)) {
        return true;
      }

      // Implement actual signature verification logic here using ethers.js
      // This is a simplified version
      const ethers = await import('ethers');
      
      // Recover the address from the signature
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      
      // Compare case-insensitive (addresses should be checksum addresses)
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Authenticate a wallet using signature
   * This method is used by both regular and debug endpoints
   */
  async authenticateWallet(data: WalletLoginDto) {
    const { walletAddress, signature, message } = data;
    
    // In test mode, bypass signature verification if enabled
    const bypassSignature = this.configService.get<boolean>('BYPASS_WALLET_SIGNATURE', false);
    
    if (!bypassSignature) {
      // Verify signature
      const isValid = await this.verifyWalletSignature(walletAddress, message, signature);
      if (!isValid) {
        throw new Error('Invalid signature');
      }
    }
    
    try {
      // Find or create user
      const user = await this.findOrCreateUserByWallet(walletAddress);
      
      // Generate JWT token
      const accessToken = this.jwtService.sign(
        { 
          sub: user.id,
          role: user.role 
        },
        {
          expiresIn: '1h',
          secret: this.configService.get<string>('JWT_SECRET')
        }
      );
      
      // Optional: Generate refresh token (simplified)
      const refreshToken = this.jwtService.sign(
        { 
          sub: user.id,
          tokenType: 'refresh' 
        },
        {
          expiresIn: '7d',
          secret: this.configService.get<string>('JWT_REFRESH_SECRET')
        }
      );
      
      // Return authentication result
      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        accessToken,
        wallet: walletAddress,
        isNewUser: user.isNewUser,
        newProfile: user.newProfile
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Helper method to find or create a user by wallet
   * For simplicity, assuming a simplified implementation
   */
  private async findOrCreateUserByWallet(walletAddress: string) {
    // Implementation depends on your user model and repository
    // This is a simplified example
    try {
      // Check if user exists
      const existingUser = await this.usersService.findByWalletAddress(walletAddress);
      
      if (existingUser) {
        return {
          ...existingUser,
          isNewUser: false,
          newProfile: false
        };
      }
      
      // Create new user
      const newUser = await this.usersService.createWithWallet(walletAddress);
      
      return {
        ...newUser,
        isNewUser: true,
        newProfile: true
      };
    } catch (error) {
      throw new Error(`Failed to find or create user: ${error.message}`);
    }
  }
}
