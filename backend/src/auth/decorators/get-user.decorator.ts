import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract authenticated user from request
 * 
 * Usage: 
 * @GetUser() user: User
 * or
 * @GetUser('email') email: string
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // If no authenticated user exists in the request, return null
    if (!request.user) {
      return null;
    }

    // If a specific property is requested, return only that property
    if (data) {
      return request.user[data];
    }

    // Otherwise return the entire user object
    return request.user;
  },
);