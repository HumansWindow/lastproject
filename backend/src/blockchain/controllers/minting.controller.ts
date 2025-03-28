import { Controller, Post, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MintingService } from '../services/minting.service';
import { RealIP } from 'nestjs-real-ip';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MintRateLimitGuard } from '../guards/rate-limit.guard';

@ApiTags('minting')
@Controller('minting')
@UseGuards(AuthGuard('jwt'))
export class MintingController {
  constructor(private readonly mintingService: MintingService) {}

  @Post('first-time')
  @UseGuards(MintRateLimitGuard)
  @ApiOperation({ summary: 'First-time SHAHI token minting' })
  @ApiResponse({ status: 201, description: 'Returns transaction hash' })
  async firstTimeMint(
    @Req() req: any,
    @Headers('user-agent') userAgent: string,
    @RealIP() ip: string,
  ) {
    const txHash = await this.mintingService.processFirstTimeMint(
      req.user.walletAddress,
      userAgent,
      ip
    );
    return { txHash };
  }

  @Post('annual')
  @UseGuards(MintRateLimitGuard)
  @ApiOperation({ summary: 'Annual SHAHI token minting' })
  @ApiResponse({ status: 201, description: 'Returns transaction hash' })
  async annualMint(
    @Req() req: any,
    @Headers('user-agent') userAgent: string,
    @RealIP() ip: string,
  ) {
    const txHash = await this.mintingService.processAnnualMint(
      req.user.walletAddress,
      userAgent,
      ip
    );
    return { txHash };
  }
}
