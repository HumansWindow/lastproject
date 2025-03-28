import { Controller, Post, Body, Req, Logger, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { WalletLoginDto } from '../dto/wallet-login.dto';
import { WalletConnectResponseDto } from '../dto/wallet-connect-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';

@ApiTags('wallet-auth')
@Controller('auth/wallet')
export class WalletAuthController {
  private readonly logger = new Logger(WalletAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('connect')
  @ApiOperation({ summary: 'Initiate wallet connection and get challenge' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a challenge to be signed by the wallet',
    type: WalletConnectResponseDto 
  })    
  async connect(@Body() body: { address: string }): Promise<WalletConnectResponseDto> {
    if (!body.address) {
      throw new BadRequestException('Wallet address is required');
    }
    
    this.logger.log(`Wallet connection request received for address: ${body.address}`);
    
    try {
      // Generate a challenge for the wallet to sign
      const response = await this.authService.handleWalletConnect(body.address);
      this.logger.log(`Generated challenge for ${body.address}: ${response.challenge.substring(0, 20)}...`);
      return response;
    } catch (error) {
      this.logger.error(`Error in wallet connect: ${error.message}`);
      throw new BadRequestException('Failed to generate challenge for wallet');
    }
  }

  @Post('authenticate')
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature' })
  async authenticate(@Body() walletLoginDto: WalletLoginDto, @Req() req: Request) {
    // Log the entire request for detailed debugging
    this.logger.log(`Authentication request headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Authentication request body: ${JSON.stringify(walletLoginDto)}`);
    
    // Log the authentication request details
    this.logger.log(`Authentication request details: ${JSON.stringify({
      address: walletLoginDto.address,
      messageExists: !!walletLoginDto.message,
      messageLength: walletLoginDto.message?.length || 0,
      messagePreview: walletLoginDto.message?.substring(0, 20) || '',
      signatureExists: !!walletLoginDto.signature,
      signatureLength: walletLoginDto.signature?.length || 0,
      signaturePreview: walletLoginDto.signature?.substring(0, 20) || '',
      emailExists: !!walletLoginDto.email
    })}`);
    
    try {
      // 1. Validate required fields
      if (!walletLoginDto.address) {
        throw new BadRequestException('Wallet address is required');
      }
      
      if (!walletLoginDto.message) {
        throw new BadRequestException('Message/challenge is required');
      }
      
      if (!walletLoginDto.signature) {
        throw new BadRequestException('Signature is required');
      }
      
      // 2. Verify the signature independently for extra logging
      try {
        const recoveredAddress = verifyMessage(walletLoginDto.message, walletLoginDto.signature);
        this.logger.log(`Signature pre-verification successful, recovered: ${recoveredAddress}`);
        
        if (recoveredAddress.toLowerCase() !== walletLoginDto.address.toLowerCase()) {
          this.logger.warn(`Address mismatch: ${recoveredAddress.toLowerCase()} vs ${walletLoginDto.address.toLowerCase()}`);
        }
      } catch (verifyError) {
        this.logger.error(`Pre-verification signature check failed: ${verifyError.message}`);
        throw new UnauthorizedException(`Invalid signature format: ${verifyError.message}`);
      }
      
      // 3. Now proceed with the actual authentication
      const result = await this.authService.authenticateWallet(walletLoginDto, req);
      this.logger.log(`Authentication successful for: ${walletLoginDto.address}`);
      return result;
    } catch (error) {
      this.logger.error(`Authentication error for ${walletLoginDto?.address || 'unknown'}: ${error.message}`);
      
      // More detailed error information
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message || 'Invalid request data');
      } else if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message || 'Invalid signature');
      } else if (error instanceof ForbiddenException) {
        throw new ForbiddenException(error.message || 'Access denied');
      }
      
      // Log detailed error for troubleshooting
      this.logger.error(`Detailed error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
