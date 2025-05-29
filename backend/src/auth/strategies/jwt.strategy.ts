import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // Add UsersService to the constructor
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true, // Pass the request to the validate method
    });
    
    // Debug logging configuration details
    this.logger.debug(`JwtStrategy initialized with secret: ${configService.get<string>('JWT_SECRET')?.substring(0, 3)}***`);
    this.logger.debug(`Token extraction method: ExtractJwt.fromAuthHeaderAsBearerToken()`);
  }

  async validate(request: Request, payload: JwtPayload) {
    // Debug the incoming token
    const authHeader = request.headers.authorization;
    this.logger.debug(`Validating JWT token with header: ${authHeader?.substring(0, 40)}...`);
    this.logger.debug(`Extracted payload: ${JSON.stringify(payload)}`);
    
    // Use either sub or userId depending on what's available
    const userId = payload.sub || payload.userId;
    
    if (!userId) {
      this.logger.error('Invalid token payload - missing userId/sub');
      throw new UnauthorizedException('Invalid token payload');
    }
    
    try {
      // Use direct repository query instead of going through service for better reliability
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        this.logger.error(`User not found for userId: ${userId}`);
        throw new UnauthorizedException('Invalid token');
      }
      
      this.logger.debug(`Successfully authenticated user: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
