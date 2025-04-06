import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../auth/guards/ws-auth.guard';

@WebSocketGateway({
  cors: true,
  namespace: 'token-events',
})
@UseGuards(WsJwtAuthGuard)
export class TokenEventsGateway {
  @WebSocketServer()
  server: Server;

  @OnEvent('shahi.mint.*')
  handleMintEvent(payload: any) {
    this.server.emit('mintEvent', payload);
  }

  @OnEvent('shahi.tokens.expired')
  handleTokenExpiry(payload: any) {
    this.server.emit('tokenExpiry', payload);
  }
}
