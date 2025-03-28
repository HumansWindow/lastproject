import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { HOTWALLET_TOKEN } from './constants';
import HotWallet from './hotwallet/index.js';

@Controller('wallet')
export class WalletController {
  constructor(@Inject(HOTWALLET_TOKEN) private readonly hotWallet: HotWallet) {}

  @Post('import')
  async importWallet(@Body() body: { mnemonic: string; network: string }) {
    const { mnemonic, network } = body;
    return this.hotWallet.importWallet(mnemonic, network);
  }

  @Get('balance/:network/:address')
  async getBalance(
    @Param('network') network: string,
    @Param('address') address: string,
  ) {
    return {
      address,
      network,
      balance: await this.hotWallet.getBalance(address, network),
    };
  }

  @Get('token-balance/:token/:address')
  async getTokenBalance(
    @Param('token') token: string,
    @Param('address') address: string,
  ) {
    return {
      address,
      token,
      balance: await this.hotWallet.getTokenBalance(address, token),
    };
  }

  @Post('send')
  async sendTransaction(
    @Body() 
    txParams: {
      network: string;
      from: string;
      to: string;
      amount: string;
      privateKey?: string;
    },
  ) {
    // First simulate the transaction
    const simulation = await this.hotWallet.simulateTransaction(txParams);
    
    if (!simulation.success) {
      return {
        success: false,
        error: `Simulation failed: ${simulation.errors?.message || 'Unknown error'}`
      };
    }
    
    // Execute the transaction
    try {
      const result = await this.hotWallet.sendTransaction(txParams);
      return {
        success: true,
        transaction: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('history/:network/:address')
  async getHistory(
    @Param('network') network: string,
    @Param('address') address: string,
  ) {
    const history = await this.hotWallet.getTransactionHistory(network, address, {
      includeTokenTransfers: true,
      includeNFTTransfers: true
    });
    
    return {
      address,
      network,
      transactions: history
    };
  }

  @Post('monitor')
  startMonitoring(@Body() body: { network: string; address: string }) {
    const { network, address } = body;
    this.hotWallet.monitorAddress(network, address);
    return { success: true };
  }

  @Post('stop-monitor')
  stopMonitoring(@Body() body: { network: string; address: string }) {
    const { network, address } = body;
    this.hotWallet.stopMonitoring(network, address);
    return { success: true };
  }

  @Post('nft/transfer')
  async transferNFT(
    @Body()
    params: {
      network: string;
      contractAddress: string;
      tokenId: string;
      from: string;
      to: string;
      privateKey?: string;
    },
  ) {
    try {
      const result = await this.hotWallet.transferNFT(params);
      return {
        success: true,
        transaction: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('nft/:network/:contractAddress/:tokenId')
  async getNFTMetadata(
    @Param('network') network: string,
    @Param('contractAddress') contractAddress: string,
    @Param('tokenId') tokenId: string,
  ) {
    try {
      const metadata = await this.hotWallet.getNFTMetadata(
        network,
        contractAddress,
        tokenId
      );
      
      return {
        success: true,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
