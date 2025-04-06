import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Get socket client from context
      const client = context.switchToWs().getClient();
      
      // Get token from handshake query or auth header
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn('WS connection rejected: No authentication token');
        throw new WsException('Unauthorized: Missing token');
      }
      
      // Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });
      
      if (!payload || !payload.sub) {
        this.logger.warn('WS connection rejected: Invalid token payload');
        throw new WsException('Unauthorized: Invalid token');
      }
      
      // Get user from database using the correct method name (findOne)
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        this.logger.warn(`WS connection rejected: User not found for ID ${payload.sub}`);
        throw new WsException('Unauthorized: User not found');
      }
      
      // Store user in client data for access in WS decorators
      client.user = user;
      
      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      
      this.logger.error('WebSocket authentication failed', error.stack);
      throw new WsException('Unauthorized: Authentication failed');
    }
  }
  
  private extractToken(client: any): string | null {
    // Try getting token from handshake query
    const queryToken = client.handshake?.query?.token;
    if (queryToken) {
      return queryToken;
    }
    
    // Try getting token from handshake auth
    const authToken = client.handshake?.auth?.token;
    if (authToken) {
      return authToken;
    }
    
    // Try getting token from handshake headers (Authorization header)
    const headers = client.handshake?.headers;
    const authHeader = headers?.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}
