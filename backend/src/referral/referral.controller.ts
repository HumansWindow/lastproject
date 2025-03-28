import { Controller, Get, Post, Body, UseGuards, Request, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralService } from './referral.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ToggleReferralCodeDto } from './dto/toggle-referral-code.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Returns referral statistics' })
  async getReferralStats(@Request() req: RequestWithUser) {
    // Already using req.user.id correctly - no change needed
    return this.referralService.getReferralStats(req.user.id);
  }

  @Post('generate-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new referral code' })
  @ApiResponse({ status: 201, description: 'Referral code generated' })
  async generateReferralCode(@Request() req: RequestWithUser) {
    // Already using req.user.id correctly - no change needed
    return this.referralService.generateReferralCode(req.user.id);
  }

  @Post('toggle-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle referral code active status' })
  @ApiResponse({ status: 200, description: 'Referral code status toggled' })
  async toggleReferralCode(
    @Request() req: RequestWithUser,
    @Body() body: ToggleReferralCodeDto,
  ) {
    // Already using req.user.id correctly - no change needed
    return this.referralService.toggleReferralCode(req.user.id, body.isActive);
  }

  @Post('claim/:referralUseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim referral reward' })
  @ApiResponse({ status: 200, description: 'Referral reward claimed' })
  async claimReferralReward(
    @Request() req: RequestWithUser,
    @Param('referralUseId') referralUseId: string
  ) {
    // Already using req.user.id correctly - no change needed
    return this.referralService.claimReferralReward(req.user.id, referralUseId);
  }

  // Add the missing validateReferralCode method used in tests
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a referral code' })
  @ApiResponse({ status: 200, description: 'Returns whether the referral code is valid' })
  async validateReferralCode(@Param('code') code: string) {
    try {
      const referral = await this.referralService.getReferralByCode(code);
      return {
        valid: true,
        referral
      };
    } catch (error) {
      // Return a structured response instead of throwing an exception
      return {
        valid: false,
        message: error instanceof BadRequestException ? error.message : 'Invalid referral code'
      };
    }
  }
}
