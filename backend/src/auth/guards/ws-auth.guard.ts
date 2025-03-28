import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    // Get the auth token from the socket handshake
    const authToken = this.extractTokenFromHeader(client);
    if (!authToken) {
      return false;
    }

    try {
      // Verify the JWT token
      const payload = this.jwtService.verify(authToken);
      
      // Attach the user to the socket
      client.data.user = payload;
      
      return true;
    } catch (e) {
      return false;
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    // Try to extract from handshake auth first
    const { auth } = client.handshake;
    if (auth && auth.token) {
      return auth.token;
    }
    
    // Then try from headers
    const { headers } = client.handshake;
    const authHeader = headers?.authorization;
    
    if (!authHeader) {
      return undefined;
    }
    
    const [type, token] = authHeader.split(' ');
    
    return type === 'Bearer' ? token : undefined;
  }
}
