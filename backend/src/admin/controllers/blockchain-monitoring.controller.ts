import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BlockchainService } from '../../blockchain/blockchain.service';
import { RpcProviderService } from '../../blockchain/services/rpc-provider.service';

@ApiTags('admin/blockchain')
@Controller('admin/blockchain')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class BlockchainMonitoringController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly rpcProviderService: RpcProviderService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get blockchain status for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Returns blockchain status' })
  async getBlockchainStatus() {
    return {
      rpcStatus: await this.blockchainService.getRpcStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('network-overview')
  @ApiOperation({ summary: 'Get blockchain network overview' })
  @ApiResponse({ status: 200, description: 'Returns network overview' })
  async getNetworkOverview() {
    // Get block numbers for each network
    const networkStatus = {
      ethereum: await this.getNetworkStatus('ethereum'),
      polygon: await this.getNetworkStatus('polygon'),
      bsc: await this.getNetworkStatus('bsc')
    };
    
    return {
      networks: networkStatus,
      timestamp: new Date().toISOString()
    };
  }
  
  @Get('transactions')
  @ApiOperation({ summary: 'Get recent blockchain transactions' })
  @ApiResponse({ status: 200, description: 'Returns recent transactions' })
  async getRecentTransactions() {
    // This is a placeholder implementation that would connect to your transaction monitoring service
    // In a real implementation, you would pull data from your database or blockchain indexer
    return {
      transactions: [],
      total: 0
    };
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Get hot wallet monitoring data' })
  @ApiResponse({ status: 200, description: 'Returns hot wallet monitoring data' })
  async getHotWallets(@Query() query: any) {
    // This is a placeholder implementation
    // In a real implementation, this would return wallet data from your hot wallet service
    return {
      wallets: [],
      total: 0
    };
  }

  private async getNetworkStatus(network: 'ethereum' | 'polygon' | 'bsc') {
    try {
      const blockNumber = await this.blockchainService.getBlockNumber(network);
      return {
        name: network,
        blockNumber,
        isConnected: true,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: network,
        isConnected: false,
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}