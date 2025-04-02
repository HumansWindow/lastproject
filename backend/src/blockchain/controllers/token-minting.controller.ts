import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpStatus, 
  HttpException, 
  Logger,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ShahiTokenService } from '../services/shahi-token.service';
import { UserMintingQueueService } from '../services/user-minting-queue.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { MintingQueueItemType } from '../entities/minting-queue-item.entity';

class FirstTimeMintDto {
  deviceId: string;
  merkleProof: string[];
}

class AnnualMintDto {
  deviceId: string;
}

@ApiTags('token-minting')
@Controller('token-minting')
export class TokenMintingController {
  private readonly logger = new Logger(TokenMintingController.name);

  constructor(
    private readonly shahiTokenService: ShahiTokenService,
    private readonly userMintingQueueService: UserMintingQueueService,
  ) {}

  @Get('info')
  @ApiOperation({ summary: 'Get basic token information' })
  @ApiResponse({ status: 200, description: 'Returns token information' })
  async getTokenInfo() {
    try {
      return await this.shahiTokenService.getTokenInfo();
    } catch (error) {
      this.logger.error(`Error fetching token info: ${error.message}`);
      throw new HttpException(
        'Failed to fetch token information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('eligibility/first-time/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check if wallet is eligible for first-time minting' })
  @ApiParam({ name: 'walletAddress', description: 'Wallet address to check' })
  @ApiResponse({ status: 200, description: 'Returns eligibility status' })
  async checkFirstTimeEligibility(@Param('walletAddress') walletAddress: string) {
    try {
      if (!walletAddress) {
        throw new BadRequestException('Wallet address is required');
      }

      const isEligible = await this.shahiTokenService.isEligibleForFirstTimeMinting(walletAddress);
      
      return { walletAddress, isEligible };
    } catch (error) {
      this.logger.error(`Error checking first-time eligibility: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check minting eligibility',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('eligibility/annual/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check if wallet is eligible for annual minting' })
  @ApiParam({ name: 'walletAddress', description: 'Wallet address to check' })
  @ApiResponse({ status: 200, description: 'Returns eligibility status' })
  async checkAnnualEligibility(@Param('walletAddress') walletAddress: string) {
    try {
      if (!walletAddress) {
        throw new BadRequestException('Wallet address is required');
      }

      const isEligible = await this.shahiTokenService.isEligibleForAnnualMinting(walletAddress);
      
      return { walletAddress, isEligible };
    } catch (error) {
      this.logger.error(`Error checking annual eligibility: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check minting eligibility',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('balance/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get token balance for a specific wallet' })
  @ApiParam({ name: 'walletAddress', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Returns token balance' })
  async getBalance(@Param('walletAddress') walletAddress: string) {
    try {
      return {
        walletAddress,
        balance: await this.shahiTokenService.getTokenBalance(walletAddress),
      };
    } catch (error) {
      this.logger.error(`Error fetching token balance: ${error.message}`);
      throw new HttpException(
        'Failed to fetch token balance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('first-time')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Queue first-time token minting' })
  @ApiBody({ type: FirstTimeMintDto })
  @ApiResponse({ status: 201, description: 'Minting request queued successfully' })
  async queueFirstTimeMinting(
    @Body() mintDto: FirstTimeMintDto,
    @GetUser() user: User,
  ) {
    try {
      const { deviceId, merkleProof } = mintDto;

      if (!deviceId || !merkleProof) {
        throw new BadRequestException('Device ID and merkle proof are required');
      }

      // Verify wallet exists
      if (!user.walletAddress) {
        throw new BadRequestException('User wallet address not found');
      }

      // Check if eligible
      const isEligible = await this.shahiTokenService.isEligibleForFirstTimeMinting(user.walletAddress);
      if (!isEligible) {
        throw new BadRequestException('Wallet not eligible for first-time minting');
      }

      // Add to queue
      const queueItem = await this.userMintingQueueService.queueFirstTimeMinting(
        user.id,
        user.walletAddress,
        deviceId,
        merkleProof,
      );

      return {
        message: 'First-time minting request queued successfully',
        queueItemId: queueItem.id,
        status: queueItem.status,
      };
    } catch (error) {
      this.logger.error(`Error queueing first-time minting: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to queue first-time minting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('annual')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Queue annual token minting' })
  @ApiBody({ type: AnnualMintDto })
  @ApiResponse({ status: 201, description: 'Minting request queued successfully' })
  async queueAnnualMinting(
    @Body() mintDto: AnnualMintDto,
    @GetUser() user: User,
  ) {
    try {
      const { deviceId } = mintDto;

      if (!deviceId) {
        throw new BadRequestException('Device ID is required');
      }

      // Verify wallet exists
      if (!user.walletAddress) {
        throw new BadRequestException('User wallet address not found');
      }

      // Check if eligible
      const isEligible = await this.shahiTokenService.isEligibleForAnnualMinting(user.walletAddress);
      if (!isEligible) {
        throw new BadRequestException('Wallet not eligible for annual minting');
      }

      // Add to queue
      const queueItem = await this.userMintingQueueService.queueAnnualMinting(
        user.id,
        user.walletAddress,
        deviceId,
      );

      return {
        message: 'Annual minting request queued successfully',
        queueItemId: queueItem.id,
        status: queueItem.status,
      };
    } catch (error) {
      this.logger.error(`Error queueing annual minting: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Failed to queue annual minting',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user minting history' })
  @ApiResponse({ status: 200, description: 'Returns user minting history' })
  async getMintingHistory(@GetUser() user: User) {
    try {
      return await this.userMintingQueueService.getUserMintingHistory(user.id);
    } catch (error) {
      this.logger.error(`Error fetching minting history: ${error.message}`);
      throw new HttpException(
        'Failed to fetch minting history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queue/status/:queueItemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Check status of a queued minting request' })
  @ApiParam({ name: 'queueItemId', description: 'Queue item ID' })
  @ApiResponse({ status: 200, description: 'Returns queue item status' })
  async checkQueueStatus(@Param('queueItemId') queueItemId: string, @GetUser() user: User) {
    try {
      const queueItem = await this.userMintingQueueService.getQueueItem(queueItemId);
      
      if (!queueItem) {
        throw new HttpException('Queue item not found', HttpStatus.NOT_FOUND);
      }
      
      // Verify ownership
      if (queueItem.userId !== user.id) {
        throw new HttpException('Unauthorized access to queue item', HttpStatus.FORBIDDEN);
      }
      
      return {
        id: queueItem.id,
        status: queueItem.status,
        type: queueItem.type,
        createdAt: queueItem.createdAt,
        processedAt: queueItem.processedAt,
        transactionHash: queueItem.transactionHash,
      };
    } catch (error) {
      this.logger.error(`Error checking queue status: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check queue status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cancel/:queueItemId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cancel a queued minting request' })
  @ApiParam({ name: 'queueItemId', description: 'Queue item ID' })
  @ApiResponse({ status: 200, description: 'Queue item cancelled successfully' })
  async cancelQueueItem(@Param('queueItemId') queueItemId: string, @GetUser() user: User) {
    try {
      const queueItem = await this.userMintingQueueService.getQueueItem(queueItemId);
      
      if (!queueItem) {
        throw new HttpException('Queue item not found', HttpStatus.NOT_FOUND);
      }
      
      // Verify ownership
      if (queueItem.userId !== user.id) {
        throw new HttpException('Unauthorized access to queue item', HttpStatus.FORBIDDEN);
      }
      
      await this.userMintingQueueService.cancelMintingRequest(queueItemId);
      
      return {
        message: 'Minting request cancelled successfully',
        queueItemId,
      };
    } catch (error) {
      this.logger.error(`Error cancelling queue item: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to cancel queue item',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}