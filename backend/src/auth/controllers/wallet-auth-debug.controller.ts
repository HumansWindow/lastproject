import { Controller, Get, Post, Body, Logger, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { verifyMessage } from 'ethers/lib/utils';
import { Request } from 'express';

@ApiTags('wallet-debug')
@Controller('auth/wallet-debug')
export class WalletAuthDebugController {
  private readonly logger = new Logger(WalletAuthDebugController.name);

  @Post('verify-signature')
  @ApiOperation({ summary: 'Verify a signature for debugging' })
  @ApiResponse({ status: 200, description: 'Signature verification result' })
  async verifySignature(@Body() body: { address: string; message: string; signature: string }) {
    const { address, message, signature } = body;
    
    this.logger.log(`Verifying signature for debugging`);
    this.logger.log(`Address: ${address}`);
    this.logger.log(`Message: ${message}`);
    this.logger.log(`Signature: ${signature}`);
    
    try {
      const recoveredAddress = verifyMessage(message, signature);
      
      return {
        valid: recoveredAddress.toLowerCase() === address.toLowerCase(),
        recoveredAddress,
        match: recoveredAddress.toLowerCase() === address.toLowerCase(),
        providedAddress: address
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        errorType: error.name,
        stack: error.stack
      };
    }
  }

  @Get('request-info')
  @ApiOperation({ summary: 'Get request headers and info for debugging' })
  async getRequestInfo(@Req() req: Request) {
    return {
      headers: req.headers,
      ip: req.ip,
      method: req.method,
      url: req.url,
      protocol: req.protocol,
      secure: req.secure
    };
  }

  @Post('mock-authenticate')
  @ApiOperation({ summary: 'Test wallet authentication payload' })
  async mockAuthenticate(@Body() walletLoginDto: any, @Req() req: Request) {
    try {
      const { address, signature, message } = walletLoginDto;
      
      this.logger.log(`Mock authentication request details:`, {
        address,
        messageExists: !!message,
        messageLength: message?.length || 0,
        messagePreview: message?.substring(0, 30) || '',
        signatureExists: !!signature,
        signatureLength: signature?.length || 0,
        signaturePreview: signature?.substring(0, 20) || '',
        emailExists: !!walletLoginDto.email
      });
      
      // Validate the basic requirements
      if (!address) return { error: 'Wallet address is required', code: 'ADDRESS_REQUIRED' };
      if (!message) return { error: 'Message/challenge is required', code: 'MESSAGE_REQUIRED' };
      if (!signature) return { error: 'Signature is required', code: 'SIGNATURE_REQUIRED' };
      
      // Try signature verification
      try {
        const recoveredAddress = verifyMessage(message, signature);
        
        // Return the result without actual authentication
        return {
          signatureValid: recoveredAddress.toLowerCase() === address.toLowerCase(),
          recoveredAddress,
          requestReceived: true,
          headers: {
            contentType: req.headers['content-type'],
            origin: req.headers.origin,
            host: req.headers.host
          }
        };
      } catch (error) {
        return {
          signatureValid: false,
          error: error.message,
          errorType: error.name
        };
      }
    } catch (error) {
      return {
        error: error.message,
        stack: error.stack
      };
    }
  }
}
