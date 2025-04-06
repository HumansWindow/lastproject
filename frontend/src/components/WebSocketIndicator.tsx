import React from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import WebSocketStatus from './WebSocketStatus';

/**
 * WebSocket connection status indicator for header/navigation
 * Shows a small colored dot indicating connection status
 */
const WebSocketIndicator: React.FC = () => {
  return (
    <div className="websocket-indicator mx-2">
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="websocket-tooltip">
            <WebSocketStatus 
              showDetails={true}
              showConnectionDuration={true}
              showReconnectAttempts={true}
            />
          </Tooltip>
        }
      >
        <div className="cursor-pointer">
          <WebSocketStatus />
        </div>
      </OverlayTrigger>
    </div>
  );
};

export default WebSocketIndicator;