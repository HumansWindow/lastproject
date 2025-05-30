import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BcryptService } from '../shared/services/bcrypt.service';
// Add import for the Wallet entity
import { Wallet } from '../wallets/entities/wallet.entity';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class UsersService {
  // Add the logger property
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bcryptService: BcryptService, // Use our wrapper service
    // Add missing Wallet repository injection
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: ProfileService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      // Check for duplicate email
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new ConflictException('Email already exists');
      }
      
      // Log the error for debugging but sanitize the message
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user. Please try again later.');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['wallets'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallets'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by email
   * @deprecated - Use ProfileService.findByEmail instead
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      // This is a compatibility method that now needs to route through the ProfileService
      if (!this.profileService) {
        this.logger.warn('ProfileService not available in UsersService');
        return null;
      }
      
      // Find profile by email
      const profile = await this.profileService.findByEmail(email);
      
      if (!profile) {
        return null;
      }
      
      // Return the associated user
      return this.findOne(profile.userId);
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`);
      return null;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // If updating password, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await this.bcryptService.hash(updateUserDto.password); // Use the bcrypt service instead of direct bcrypt calls
    }

    const updatedUser = Object.assign(user, updateUserDto);
    return this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async setRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.update(userId, {
      verificationToken: refreshToken || undefined, // Changed to a property that exists in User
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { verificationToken: refreshToken } }); // Changed to a property that exists in User
    return user || undefined;
  }

  async setResetPasswordToken(email: string, resetToken: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) return;

    // Token expires in 1 hour
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1);

    await this.userRepository.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires,
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isVerified: true, // Changed from isEmailVerified to isVerified
      verificationToken: undefined,
    });
  }

  // Add this method
  async findWalletUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: {
        walletAddress: Not(IsNull())
      },
      relations: ['devices', 'sessions', 'wallets'],
    });
  }

  /**
   * Find a user by their wallet address
   * @param walletAddress The wallet address to search for
   * @returns The user if found, or null
   */
  
  /**
   * Find a user by wallet address
   * @param walletAddress The wallet address to search for
   * @returns The user if found, null otherwise
   * @deprecated Use findByWalletAddress instead with property name (not DB column)
   */
  
  /**
   * Find a user by wallet address
   * @param walletAddress The wallet address to search for
   * @returns The user if found, null otherwise
   * @deprecated Use findByWalletAddress instead with property name (not DB column)
   */
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    this.logger.log(`Looking up user by wallet address: ${walletAddress}`);
    
    // Normalize the address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    try {
      // First try to find user by the direct walletAddress field
      // Use a simpler query that doesn't rely on all columns
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.wallet_address) = LOWER(:address)', { address: normalizedAddress })
        .getOne();
      
      if (user) {
        this.logger.log(`Found user by direct walletAddress: ${user.id}`);
        return user;
      }
      
      // If not found, try to find via wallet relationship
      const wallet = await this.walletRepository
        .createQueryBuilder('wallet')
        .leftJoinAndSelect('wallet.user', 'user')
        .where('LOWER(wallet.address) = LOWER(:address)', { address: normalizedAddress })
        .getOne();
      
      if (wallet?.user) {
        this.logger.log(`Found user through wallet relationship: ${wallet.user.id}`);
        return wallet.user;
      }
    } catch (error) {
      this.logger.error(`Error finding user by wallet address: ${error.message}`, error.stack);
    }
    
    this.logger.log(`No user found for wallet address: ${normalizedAddress}`);
    return null;
  }

  /**
   * Create a new user from a wallet address
   * @param data Object containing wallet address and optional email
   * @returns The newly created user
   */
  async createWalletUser(data: {
    walletAddress: string;
    email?: string | null;
    isVerified?: boolean;
  }): Promise<User> {
    try {
      // Create a new user with wallet address but no direct email/password
      const user = this.userRepository.create({
        isVerified: data.isVerified !== undefined ? data.isVerified : true, // Wallet users are typically verified by default
        role: UserRole.USER,
        walletAddress: data.walletAddress.toLowerCase(), // Normalize to lowercase
      });

      // Save the user
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`Created new wallet user: ${savedUser.id} with wallet: ${data.walletAddress}`);

      // Create a wallet record linked to the user
      const wallet = this.walletRepository.create({
        address: data.walletAddress.toLowerCase(),
        userId: savedUser.id,
        chain: 'ETH', // Default to Ethereum
        isActive: true,
      });

      await this.walletRepository.save(wallet);
      this.logger.log(`Created wallet record for user: ${savedUser.id}`);
      
      // If email is provided, create a profile
      if (data.email) {
        // Generate a random password for the profile
        const randomPassword = require('crypto').randomBytes(20).toString('hex');
        const hashedPassword = await this.bcryptService.hash(randomPassword);
        
        try {
          await this.profileService.create(savedUser.id, {
            email: data.email,
            password: hashedPassword
          });
          this.logger.log(`Created profile with email for wallet user: ${savedUser.id}`);
        } catch (error) {
          this.logger.error(`Failed to create profile for wallet user: ${error.message}`);
          // Continue even if profile creation fails
        }
      }

      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create wallet user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }
  
  /**
   * Record a token minting event for a user
   * @param walletAddress The wallet address of the user who minted tokens
   * @param amount The amount of tokens minted
   * @returns The updated user record
   */
  async recordTokenMinting(walletAddress: string, amount: number): Promise<User> {
    const user = await this.findByWalletAddress(walletAddress);
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    // Set the minting date to current time
    const now = new Date();
    
    // Set expiry date to one year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Update the user record with minting information
    user.lastMintDate = now;
    user.tokenExpiryDate = expiryDate;
    user.mintedAmount = Number(user.mintedAmount || 0) + amount;
    user.hasExpiredTokens = false; // Reset expiry flag when new tokens are minted
    
    this.logger.log(`Recorded token minting for ${walletAddress}: ${amount} tokens, expires at ${expiryDate}`);
    
    return this.userRepository.save(user);
  }
  
  /**
   * Check for and mark expired tokens for a specific user
   * @param walletAddress The wallet address to check for expired tokens
   * @returns Boolean indicating if tokens were marked as expired
   */
  async checkExpiredTokens(walletAddress: string): Promise<boolean> {
    const user = await this.findByWalletAddress(walletAddress);
    if (!user || !user.tokenExpiryDate) {
      return false;
    }
    
    const now = new Date();
    
    // Check if tokens have expired
    if (user.tokenExpiryDate <= now && !user.hasExpiredTokens) {
      user.hasExpiredTokens = true;
      await this.userRepository.save(user);
      
      this.logger.log(`Marked tokens as expired for ${walletAddress}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Get all users with expired tokens that need to be burned
   * @returns Array of users with expired tokens
   */
  async getUsersWithExpiredTokens(): Promise<User[]> {
    const now = new Date();
    
    return this.userRepository.find({
      where: {
        tokenExpiryDate: Not(IsNull()),
        hasExpiredTokens: false,
        // Tokens are expired if the expiry date is in the past
        // Using the query builder to compare dates
      },
      // Use query builder to properly compare dates
    }).then(users => {
      // Filter users client-side for compatible date comparison
      return users.filter(user => user.tokenExpiryDate && user.tokenExpiryDate <= now);
    });
  }
  
  /**
   * Reset token expiry tracking after tokens have been burned
   * @param walletAddress The wallet address to reset token tracking for
   */
  async resetExpiredTokenTracking(walletAddress: string): Promise<void> {
    const user = await this.findByWalletAddress(walletAddress);
    if (!user) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }
    
    // Mark as expired but keep the dates for record-keeping
    user.hasExpiredTokens = true;
    
    await this.userRepository.save(user);
    this.logger.log(`Reset expired token tracking for ${walletAddress}`);
  }

  /**
   * Create a new user with a wallet address
   */
  async createWithWallet(walletAddress: string): Promise<User> {
    const user = new User();
    user.walletAddress = walletAddress.toLowerCase();
    user.isVerified = true;
    user.isActive = true;
    user.role = UserRole.USER;
    
    return this.userRepository.save(user);
  }
}
