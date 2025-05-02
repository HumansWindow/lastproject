import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { AdminLoginDto } from '../dto/admin-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger('AdminAuthService');
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    try {
      this.logger.log(`Attempting admin login with username: ${loginDto.username}`);
      
      // Use a direct query to find the admin user by username
      const userQuery = await this.userRepository.query(
        `SELECT u.*, p.email, p.password, p.display_name 
         FROM users u 
         LEFT JOIN profiles p ON u.id = p.user_id
         WHERE u.username = $1 AND u.role = $2`,
        [loginDto.username, UserRole.ADMIN]
      );
      
      this.logger.debug(`Found ${userQuery.length} matching admin users`);
      
      const user = userQuery[0];

      // If user not found
      if (!user) {
        this.logger.warn(`Admin login failed: No admin user found with username ${loginDto.username}`);
        throw new UnauthorizedException('Invalid admin credentials');
      }

      // If password is missing
      if (!user.password) {
        this.logger.warn(`Admin login failed: No password set for admin user ${user.username}`);
        throw new UnauthorizedException('Invalid admin credentials');
      }

      // Check password match
      const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
      if (!passwordMatch) {
        this.logger.warn(`Admin login failed: Invalid password for user ${user.username}`);
        throw new UnauthorizedException('Invalid admin credentials');
      }

      this.logger.log(`Admin login successful for user: ${user.username}`);

      // Generate JWT token
      const payload = { 
        sub: user.id, 
        username: user.username, 
        role: user.role
      };

      // Return user info and token
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.display_name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username),
        role: user.role,
        token: this.jwtService.sign(payload, {
          expiresIn: '8h', // Longer session for admin
        }),
      };
    } catch (error) {
      this.logger.error(`Admin login error:`, error);
      throw new UnauthorizedException('Invalid admin credentials');
    }
  }
}