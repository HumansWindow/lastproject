import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { Profile } from '../../profile/entities/profile.entity';

@Injectable()
export class WalletTransactionService {
  constructor(
    private connection: Connection,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletsRepository: Repository<Wallet>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  /**
   * Create a user with wallet in a transaction
   * This ensures that either all operations succeed or all fail
   */
  async createUserWithWallet(address: string, chain = 'ETH', email?: string): Promise<User> {
    // Use a transaction to ensure data consistency
    return this.connection.transaction(async (manager) => {
      try {
        // Normalize wallet address
        const normalizedAddress = address.toLowerCase();
        
        // 1. Create the user first
        const user = manager.create(User, {
          isActive: true,
          isVerified: true,
        });
        
        const savedUser = await manager.save(user);
        
        // 2. Create the wallet and link it to the user
        const wallet = manager.create(Wallet, {
          address: normalizedAddress,
          chain,
          userId: savedUser.id,
          isActive: true,
        });
        
        await manager.save(wallet);
        
        // 3. Create a profile if it doesn't exist
        const profile = manager.create(Profile, {
          userId: savedUser.id,
          email: email,
          displayName: `User-${normalizedAddress.slice(2, 8)}`,
          // Generate a unique ID based on the wallet address
          uniqueId: `wallet-${normalizedAddress.slice(2, 10)}`,
          visibilityLevel: 'public',
        });
        
        await manager.save(profile);
        
        // Return the newly created user with relations
        return this.usersRepository.findOne({
          where: { id: savedUser.id },
          relations: ['wallets'],
        });
      } catch (error) {
        // Log the error for debugging
        console.error('Error in createUserWithWallet transaction:', error);
        // Re-throw to trigger transaction rollback
        throw error;
      }
    });
  }

  /**
   * Find a user by wallet address, and create one if it doesn't exist
   */
  async findOrCreateUserByWalletAddress(
    address: string, 
    chain = 'ETH',
    email?: string,
  ): Promise<{ user: User; isNewUser: boolean }> {
    try {
      // Normalize the address
      const normalizedAddress = address.toLowerCase();
      
      // First, try to find an existing wallet with this address
      const existingWallet = await this.walletsRepository.findOne({
        where: { 
          address: normalizedAddress,
          chain,
        },
        relations: ['user'],
      });
      
      // If wallet exists and has a user, return that user
      if (existingWallet && existingWallet.user) {
        return {
          user: existingWallet.user,
          isNewUser: false,
        };
      }
      
      // If no wallet was found, create a new user with wallet
      const newUser = await this.createUserWithWallet(normalizedAddress, chain, email);
      
      return {
        user: newUser,
        isNewUser: true,
      };
    } catch (error) {
      console.error('Error in findOrCreateUserByWalletAddress:', error);
      throw error;
    }
  }
}