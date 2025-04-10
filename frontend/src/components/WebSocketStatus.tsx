import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export interface WebSocketStatusProps {
  connected: boolean;
  showDetails?: boolean;
  showConnectionDuration?: boolean;
  showDiagnosticInfo?: boolean;
  showReconnectAttempts?: boolean;
  // Add any other props that might be used
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  connected, 
  showDetails,
  showConnectionDuration,
  showDiagnosticInfo,
  showReconnectAttempts
}) => {
  return (
    <Box display="flex" alignItems="center">
      <Typography variant="body1" sx={{ mr: 1 }}>
        WebSocket Status:
      </Typography>
      {connected ? (
        <>
          <CheckCircleIcon color="success" sx={{ mr: 0.5 }} />
          <Typography variant="body1" color="success.main">Connected</Typography>
        </>
      ) : (
        <>
          <CancelIcon color="error" sx={{ mr: 0.5 }} />
          <Typography variant="body1" color="error">Disconnected</Typography>
        </>
      )}
    </Box>
  );
};

export default WebSocketStatus;