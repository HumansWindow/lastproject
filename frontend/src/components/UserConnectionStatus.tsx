import React from 'react';
import useUserConnection from "../hooks/useUserConnection";
import '../styles/components/UserConnectionStatus.css';

interface UserConnectionStatusProps {
  showDetails?: boolean;
}

/**
 * Component that shows whether a user is currently connected to the system
 */
const UserConnectionStatus: React.FC<UserConnectionStatusProps> = ({ showDetails = false }) => {
  const { isConnected, authState } = useUserConnection();

  return (
    <div className="user-connection-status">
      <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? 'User Connected' : 'User Disconnected'}
      </div>
      
      {showDetails && (
        <div className="connection-details">
          <p>Authentication status: {authState.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
          <p>Has refresh token: {authState.hasRefreshToken ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default UserConnectionStatus;