import { Injectable } from '@nestjs/common';

@Injectable()
export class BlockchainService {
  async createWallet() {
    return { address: '0x123' };
  }
}
