import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';
import { providers, utils } from 'ethers';
import { RpcProviderService } from './services/rpc-provider.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly rpcProviderService: RpcProviderService,
    @Inject('BLOCKCHAIN_CONFIG')
    private readonly blockchainConfig: any,
  ) {}

  async createWallet() {
    // Simplified for testing
    const wallet = this.walletRepository.create({
      address: '0x123',
    });
    return this.walletRepository.save(wallet);
  }

  // Get a provider for a specific network with fallback logic
  async getProvider(network: 'ethereum' | 'polygon' | 'bsc' | 'solana' = 'ethereum'): Promise<providers.JsonRpcProvider> {
    try {
      return await this.rpcProviderService.getProvider(network);
    } catch (error) {
      this.logger.error(`Failed to get provider for ${network}: ${error.message}`);
      throw error;
    }
  }

  // Execute blockchain action with automatic fallback to other RPCs if one fails
  async executeWithFallback<T>(
    network: 'ethereum' | 'polygon' | 'bsc' | 'solana',
    action: (provider: providers.JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    return this.rpcProviderService.executeWithFallback(network, action);
  }

  // Get current block number with fallback
  async getBlockNumber(network: 'ethereum' | 'polygon' | 'bsc'): Promise<number> {
    return this.executeWithFallback(network, async (provider) => {
      const blockNumber = await provider.getBlockNumber();
      return blockNumber;
    });
  }

  // Get ETH/BNB/MATIC balance with fallback
  async getBalance(address: string, network: 'ethereum' | 'polygon' | 'bsc'): Promise<string> {
    if (!utils.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    return this.executeWithFallback(network, async (provider) => {
      const balance = await provider.getBalance(address);
      return utils.formatEther(balance);
    });
  }
  
  // Get current RPC status for monitoring
  async getRpcStatus(): Promise<{
    activeRpcs: Record<string, string>,
    healthStatus: Record<string, Record<string, boolean>>
  }> {
    return {
      activeRpcs: this.rpcProviderService.getActiveRpcUrls(),
      healthStatus: this.rpcProviderService.getRpcHealthStatus()
    };
  }
}
