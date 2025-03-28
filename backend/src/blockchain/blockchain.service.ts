import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../wallets/entities/wallet.entity';

@Injectable()
export class BlockchainService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async createWallet() {
    // Simplified for testing
    const wallet = this.walletRepository.create({
      address: '0x123',
    });
    return this.walletRepository.save(wallet);
  }
}
