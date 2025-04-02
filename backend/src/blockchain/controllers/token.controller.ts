import { Controller, Get, Post, Body, Param, UseGuards, Query, Logger, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ShahiTokenService } from '../services/shahi-token.service';

@ApiTags('token')
@Controller('token')
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(
    private readonly shahiTokenService: ShahiTokenService
  ) {}

  @Get('info')
  @ApiOperation({ summary: 'Get basic token information' })
  @ApiResponse({ status: 200, description: 'Returns token information' })
  async getTokenInfo() {
    try {
      return await this.shahiTokenService.getTokenInfo();
    } catch (error) {
      this.logger.error(`Error fetching token info: ${error.message}`);
      throw error;
    }
  }

  @Get('balance/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get token balance for a specific wallet' })
  @ApiParam({ name: 'walletAddress', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Returns token balance' })
  @ApiResponse({ status: 404, description: 'Wallet address not found' })
  async getTokenBalance(@Param('walletAddress') walletAddress: string) {
    try {
      if (!walletAddress) {
        throw new NotFoundException('Wallet address is required');
      }
      
      this.logger.log(`Fetching token balance for wallet ${walletAddress}`);
      
      const balance = await this.shahiTokenService.getTokenBalance(walletAddress);
      
      return { walletAddress, balance };
    } catch (error) {
      this.logger.error(`Error fetching token balance: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get token statistics' })
  @ApiResponse({ status: 200, description: 'Returns token statistics' })
  async getTokenStats() {
    try {
      return await this.shahiTokenService.getTokenStats();
    } catch (error) {
      this.logger.error(`Error fetching token stats: ${error.message}`);
      throw error;
    }
  }
}