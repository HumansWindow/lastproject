import React from 'react';
import WebSocketStatus from './WebSocketStatus';

// This component is now just a wrapper around WebSocketStatus with minimal display mode
const WebSocketIndicator: React.FC = () => {
  return <WebSocketStatus showDetails={false} />;
};

export default WebSocketIndicator;