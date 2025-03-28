import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
  ) {}

  async findAllByUser(userId: string): Promise<Wallet[]> {
    return this.walletsRepository.find({
      where: { user: { id: userId } },
    });
  }

  // Add other necessary methods
}
