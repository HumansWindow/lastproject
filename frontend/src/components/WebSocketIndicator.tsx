import React from 'react';
import WebSocketStatus from './WebSocketStatus';

const WebSocketIndicator: React.FC = () => {
  // Add connected status (you might want to get the actual status from your application state)
  return <WebSocketStatus connected={false} showDetails={false} />;
};

export default WebSocketIndicator;