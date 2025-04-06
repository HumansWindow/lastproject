import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator for extracting the authenticated user from WebSocket connections
 * To be used in WebSocket message handlers that are protected by WsJwtAuthGuard
 * 
 * Example:
 * ```typescript
 * @SubscribeMessage('message')
 * @UseGuards(WsJwtAuthGuard)
 * handleMessage(@MessageBody() data: any, @WsUser() user: User): any {
 *   // Access user.id, user.email, etc.
 * }
 * ```
 */
export const WsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient();
    return client.user;
  },
);