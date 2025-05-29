import dynamic from 'next/dynamic';
import React from 'react';

// Fix dynamic import syntax
const WebSocketDemoContent = dynamic(
  () => import('../components/WebSocketDemoContent').then(mod => mod.default) as any,
  { ssr: false }
);

const WebSocketDemo: React.FC = () => {
  return <WebSocketDemoContent />;
};

export default WebSocketDemo;