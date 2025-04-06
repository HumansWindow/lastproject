import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlockchainService } from '../blockchain.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('blockchain')
@Controller('blockchain/rpc-status')
export class RpcStatusController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get RPC endpoint status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all RPC endpoints and their health status',
    schema: {
      example: {
        activeRpcs: {
          ethereum: 'https://ethereum.publicnode.com',
          polygon: 'https://polygon-rpc.com',
          bsc: 'https://bsc-dataseed.binance.org'
        },
        healthStatus: {
          ethereum: {
            'https://ethereum.publicnode.com': true,
            'https://rpc.ankr.com/eth/c0a18590f3311bb1d06ae968ab43f3cbfb3dcbabd721fc72d660975094bc6b4a': true,
            'https://cloudflare-eth.com': false
          }
        }
      }
    }
  })
  async getRpcStatus() {
    return this.blockchainService.getRpcStatus();
  }

  @Get('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Test RPC connections by retrieving block numbers' })
  @ApiResponse({ status: 200 })
  async testRpcConnections() {
    try {
      const results = {
        ethereum: await this.blockchainService.getBlockNumber('ethereum')
          .then(blockNumber => ({ success: true, blockNumber }))
          .catch(error => ({ success: false, error: error.message })),
        
        polygon: await this.blockchainService.getBlockNumber('polygon')
          .then(blockNumber => ({ success: true, blockNumber }))
          .catch(error => ({ success: false, error: error.message })),
        
        bsc: await this.blockchainService.getBlockNumber('bsc')
          .then(blockNumber => ({ success: true, blockNumber }))
          .catch(error => ({ success: false, error: error.message })),
      };
      
      return {
        timestamp: new Date().toISOString(),
        results,
        message: 'RPC test completed'
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Failed to test RPC connections'
      };
    }
  }
}