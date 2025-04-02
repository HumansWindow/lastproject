import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  async findById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async findByWalletAddress(walletAddress: string): Promise<Account | null> {
    return this.accountRepository.findOne({ where: { walletAddress } });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.accountRepository.find({ where: { userId } });
  }

  async create(accountData: Partial<Account>): Promise<Account> {
    const account = this.accountRepository.create(accountData);
    return this.accountRepository.save(account);
  }

  async update(id: string, accountData: Partial<Account>): Promise<Account> {
    const account = await this.findById(id);
    
    Object.assign(account, accountData);
    
    return this.accountRepository.save(account);
  }

  async delete(id: string): Promise<void> {
    const result = await this.accountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
  }

  async updateNonce(walletAddress: string, nonce: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { walletAddress } });
    
    if (!account) {
      throw new NotFoundException(`Account with wallet address ${walletAddress} not found`);
    }
    
    account.nonce = nonce;
    return this.accountRepository.save(account);
  }

  async updateSignature(walletAddress: string, signature: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { walletAddress } });
    
    if (!account) {
      throw new NotFoundException(`Account with wallet address ${walletAddress} not found`);
    }
    
    account.signature = signature;
    account.lastSignatureDate = new Date();
    return this.accountRepository.save(account);
  }

  async setPrimaryAccount(userId: string, accountId: string): Promise<Account> {
    // First, set all user accounts as non-primary
    await this.accountRepository.update(
      { userId },
      { isPrimary: false }
    );
    
    // Then set the specified account as primary
    const account = await this.findById(accountId);
    account.isPrimary = true;
    return this.accountRepository.save(account);
  }

  async getUserPrimaryAccount(userId: string): Promise<Account | null> {
    return this.accountRepository.findOne({ 
      where: { 
        userId, 
        isPrimary: true 
      } 
    });
  }
}