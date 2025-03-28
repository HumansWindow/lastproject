import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class MintRateLimitGuard implements CanActivate {
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.rateLimiter = new RateLimiterMemory({
      points: 5, // Number of attempts
      duration: 3600, // Per hour
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userKey = `${request.user.id}:${request.ip}`;
    
    try {
      await this.rateLimiter.consume(userKey);
      return true;
    } catch {
      throw new Error('Too many minting attempts. Please try again later.');
    }
  }
}
