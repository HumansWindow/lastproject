import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BcryptService } from '../shared/services/bcrypt.service';
// Add import for the Wallet entity
import { Wallet } from '../wallets/entities/wallet.entity';

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

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['wallets'],
    });
    return user || undefined;
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
  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    this.logger.log(`Looking up user by wallet address: ${walletAddress}`);
    
    // Normalize the address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    
    try {
      // First try to find user by the direct walletAddress field
      // Use a simpler query that doesn't rely on all columns
      const user = await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.walletAddress) = LOWER(:address)', { address: normalizedAddress })
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
      // Generate a random password for the wallet user
      const randomPassword = require('crypto').randomBytes(20).toString('hex');
      const hashedPassword = await this.bcryptService.hash(randomPassword);

      // Create a new user with wallet address
      const user = this.userRepository.create({
        email: data.email || null,
        password: hashedPassword,
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

      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create wallet user: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user account');
    }
  }
}
