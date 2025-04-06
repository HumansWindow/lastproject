import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  ParseUUIDPipe,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StakingService } from '../services/staking.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';

class CreateStakingDto {
  walletAddress: string;
  amount: string;
  lockPeriodDays: number;
  autoCompound?: boolean;
  autoClaimEnabled?: boolean;
}

class WithdrawStakingDto {
  positionId: string;
}

class ClaimRewardsDto {
  positionId: string;
}

@ApiTags('staking')
@Controller('staking')
export class StakingController {
  private readonly logger = new Logger(StakingController.name);

  constructor(private readonly stakingService: StakingService) {}

  @Get('apy-tiers')
  @ApiOperation({ summary: 'Get all active APY tiers' })
  @ApiResponse({ status: 200, description: 'Returns all active APY tiers' })
  async getApyTiers() {
    try {
      return await this.stakingService.getApyTiers();
    } catch (error) {
      this.logger.error(`Error fetching APY tiers: ${error.message}`);
      throw new HttpException('Failed to fetch APY tiers', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('positions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user staking positions' })
  @ApiResponse({ status: 200, description: 'Returns user staking positions' })
  async getUserPositions(@GetUser() user: User) {
    try {
      return await this.stakingService.getUserStakingPositions(user.id);
    } catch (error) {
      this.logger.error(`Error fetching user positions: ${error.message}`);
      throw new HttpException('Failed to fetch staking positions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('wallet/:walletAddress')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get staking positions by wallet address' })
  @ApiParam({ name: 'walletAddress', description: 'Wallet address' })
  @ApiResponse({ status: 200, description: 'Returns wallet staking positions' })
  async getWalletPositions(@Param('walletAddress') walletAddress: string) {
    try {
      if (!walletAddress) {
        throw new BadRequestException('Wallet address is required');
      }

      return await this.stakingService.getWalletStakingPositions(walletAddress);
    } catch (error) {
      this.logger.error(`Error fetching wallet positions: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException('Failed to fetch staking positions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('position/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get staking position details' })
  @ApiParam({ name: 'id', description: 'Staking position ID' })
  @ApiResponse({ status: 200, description: 'Returns staking position details' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  async getPosition(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    try {
      const position = await this.stakingService.getStakingPosition(id);
      
      // Simple verification that user owns this position
      if (position.userId !== user.id) {
        throw new HttpException('Unauthorized access to staking position', HttpStatus.FORBIDDEN);
      }
      
      return position;
    } catch (error) {
      this.logger.error(`Error fetching position: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to fetch staking position', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a new staking position' })
  @ApiBody({ type: CreateStakingDto })
  @ApiResponse({ status: 201, description: 'Staking position created successfully' })
  async createPosition(@Body() createStakingDto: CreateStakingDto, @GetUser() user: User) {
    try {
      const { walletAddress, amount, lockPeriodDays, autoCompound, autoClaimEnabled } = createStakingDto;

      if (!walletAddress || !amount || lockPeriodDays === undefined) {
        throw new BadRequestException('Wallet address, amount and lock period are required');
      }

      // Create staking position
      const position = await this.stakingService.createStakingPosition(
        user.id,
        walletAddress,
        amount,
        lockPeriodDays,
        autoCompound || false,
        autoClaimEnabled || false,
      );

      return position;
    } catch (error) {
      this.logger.error(`Error creating staking position: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException('Failed to create staking position', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('withdraw')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Withdraw funds from a staking position' })
  @ApiBody({ type: WithdrawStakingDto })
  @ApiResponse({ status: 200, description: 'Withdrawal processed successfully' })
  async withdrawPosition(@Body() withdrawDto: WithdrawStakingDto, @GetUser() user: User) {
    try {
      const { positionId } = withdrawDto;

      if (!positionId) {
        throw new BadRequestException('Position ID is required');
      }

      // Process withdrawal
      return await this.stakingService.withdrawStakingPosition(user.id, positionId);
    } catch (error) {
      this.logger.error(`Error withdrawing staking position: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException('Failed to withdraw staking position', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('claim-rewards')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Claim rewards from a staking position' })
  @ApiBody({ type: ClaimRewardsDto })
  @ApiResponse({ status: 200, description: 'Rewards claimed successfully' })
  async claimRewards(@Body() claimDto: ClaimRewardsDto, @GetUser() user: User) {
    try {
      const { positionId } = claimDto;

      if (!positionId) {
        throw new BadRequestException('Position ID is required');
      }

      // Claim rewards
      return await this.stakingService.claimRewards(user.id, positionId);
    } catch (error) {
      this.logger.error(`Error claiming rewards: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException('Failed to claim rewards', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('rewards/:positionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Calculate current rewards for a position' })
  @ApiParam({ name: 'positionId', description: 'Staking position ID' })
  @ApiResponse({ status: 200, description: 'Returns calculated rewards' })
  async calculateRewards(
    @Param('positionId', ParseUUIDPipe) positionId: string,
    @GetUser() user: User,
  ) {
    try {
      // Verify ownership
      const position = await this.stakingService.getStakingPosition(positionId);
      if (position.userId !== user.id) {
        throw new HttpException('Unauthorized access to staking position', HttpStatus.FORBIDDEN);
      }

      // Calculate rewards
      const rewards = await this.stakingService.calculateRewards(positionId);
      
      return { positionId, rewards };
    } catch (error) {
      this.logger.error(`Error calculating rewards: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to calculate rewards', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}