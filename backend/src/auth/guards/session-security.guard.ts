import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionSecurityService } from '../services/session-security.service';
import { SKIP_SESSION_CHECK_KEY } from '../decorators/skip-session-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SessionSecurityGuard implements CanActivate {
  private readonly logger = new Logger(SessionSecurityGuard.name);
  
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url || 'unknown';
    
    // Check if this route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );
    
    if (isPublic) {
      this.logger.debug(`Public endpoint accessed: ${path}`);
      return true;
    }
    
    // Check if this route should skip session validation
    const skipSessionCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_SESSION_CHECK_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipSessionCheck) {
      this.logger.debug(`Skipping session check for path: ${path}`);
      return true;
    }

    this.logger.debug(`Processing request for path: ${path}`);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn(`No token found in request for path: ${path}`);
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Verify the JWT token
      this.logger.debug(`Verifying JWT token: ${token.substring(0, 15)}...`);
      
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.logger.debug(`JWT payload: ${JSON.stringify(payload)}`);

      // Check if token has sub/user identifier
      if (!payload.sub) {
        this.logger.warn('Token missing sub field');
        throw new UnauthorizedException('Invalid token format - missing user identifier');
      }

      // Assign user data to the request object
      request.user = {
        id: payload.sub,
        ...payload
      };

      // For tokens with sessionId, perform session validation
      if (payload.sessionId) {
        this.logger.debug(`Validating session ${payload.sessionId} for path: ${path}`);
        // Update the sessionId on the request user object
        request.user.sessionId = payload.sessionId;
        
        try {
          // Validate that the session matches the current request
          await this.sessionSecurityService.validateRequestSession(
            request,
            payload.sub,
            payload.sessionId
          );
        } catch (sessionError) {
          this.logger.warn(`Session validation failed: ${sessionError.message}`);
          throw new UnauthorizedException('Invalid session');
        }
      } else {
        // For tokens without sessionId, log but allow the request
        // This maintains backward compatibility with existing tokens
        this.logger.debug(`Token for user ${payload.sub} has no sessionId, skipping session validation for path: ${path}`);
      }
      
      // Log successful authentication
      this.logger.debug(`User ${payload.sub} successfully authenticated for path: ${path}`);
      return true;
    } catch (error) {
      this.logger.error(`Authentication error for path ${path}: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid session or authentication');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    this.logger.debug(`Authorization header: ${request.headers.authorization?.substring(0, 20)}...`);
    this.logger.debug(`Token type: ${type}, Token present: ${Boolean(token)}`);
    return type === 'Bearer' ? token : undefined;
  }
}