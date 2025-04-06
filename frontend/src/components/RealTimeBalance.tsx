import React, { useEffect, useState } from 'react';
import { realtimeService } from '../services/api';
import { BalanceChangeEvent } from '../types/api-types';
import { ConnectionStatus } from '../services/websocket-manager';
import WebSocketStatus from './WebSocketStatus';

interface RealTimeBalanceProps {
  walletAddress: string;
  initialBalance?: string;
  showChanges?: boolean;
  className?: string;
  showDetailedStatus?: boolean;
}

/**
 * Component for displaying real-time balance updates
 */
const RealTimeBalance: React.FC<RealTimeBalanceProps> = ({
  walletAddress,
  initialBalance = '0',
  showChanges = true,
  className = '',
  showDetailedStatus = false
}) => {
  const [balance, setBalance] = useState<string>(initialBalance);
  const [previousBalance, setPreviousBalance] = useState<string | null>(null);
  const [changeType, setChangeType] = useState<'increase' | 'decrease' | null>(null);
  const [showChangeAnimation, setShowChangeAnimation] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );

  useEffect(() => {
    // Subscribe to balance updates for this wallet
    if (walletAddress && realtimeService.isConnected()) {
      // Subscribe to connection status changes
      const statusUnsubscribe = realtimeService.onConnectionStatusChange((status) => {
        setConnectionStatus(status);
        
        // If we just connected and have a wallet address, subscribe to balance updates
        if (status === ConnectionStatus.CONNECTED && !isSubscribed) {
          subscribeToBalanceUpdates();
        }
      });
      
      // Subscribe to balance updates if already connected
      if (realtimeService.isConnected() && !isSubscribed) {
        subscribeToBalanceUpdates();
      }
      
      return () => {
        statusUnsubscribe();
        // Unsubscribe from balance updates when component unmounts
        unsubscribeFromBalanceUpdates();
      };
    }
  }, [walletAddress, isSubscribed]);
  
  const subscribeToBalanceUpdates = () => {
    if (!walletAddress) return;
    
    console.log(`Subscribing to balance updates for ${walletAddress}`);
    
    // Store the unsubscribe function
    const unsubscribe = realtimeService.subscribeToBalanceChanges(
      walletAddress,
      (update: BalanceChangeEvent) => {
        console.log('Received balance update:', update);
        setPreviousBalance(balance);
        // Use formattedNewBalance if available, otherwise fall back to newBalance or keep current balance
        setBalance(update.formattedNewBalance || update.newBalance || balance);
        setLastUpdate(new Date(update.timestamp));
        
        // Determine if this is an increase or decrease
        if (parseFloat(update.newBalance) > parseFloat(update.previousBalance)) {
          setChangeType('increase');
        } else if (parseFloat(update.newBalance) < parseFloat(update.previousBalance)) {
          setChangeType('decrease');
        }
        
        // Trigger animation
        if (showChanges) {
          setShowChangeAnimation(true);
          
          // Reset animation after a delay
          setTimeout(() => {
            setShowChangeAnimation(false);
          }, 2000);
        }
      }
    );
    
    // Store the unsubscribe function in component state
    setIsSubscribed(true);
    
    // Store the unsubscribe function in window for cleanup
    window.__balanceUnsubscribe = unsubscribe;
  };
  
  const unsubscribeFromBalanceUpdates = () => {
    if (window.__balanceUnsubscribe) {
      window.__balanceUnsubscribe();
      delete window.__balanceUnsubscribe;
      setIsSubscribed(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleTimeString();
  };
  
  const handleManualSubscription = () => {
    if (isSubscribed) {
      unsubscribeFromBalanceUpdates();
    } else {
      subscribeToBalanceUpdates();
    }
  };

  // Get CSS classes based on change type and animation state
  const getChangeClasses = () => {
    if (!showChangeAnimation || !changeType) return '';
    
    if (changeType === 'increase') {
      return 'text-green-500 transition-all';
    } else {
      return 'text-red-500 transition-all';
    }
  };

  return (
    <div className={`relative ${className} real-time-balance p-4 bg-white rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Real-Time Balance</h3>
        <WebSocketStatus 
          showDetails={showDetailedStatus} 
          showConnectionDuration={showDetailedStatus}
          showDiagnosticInfo={showDetailedStatus}
        />
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500">Wallet Address:</p>
        <p className="font-mono text-xs truncate">{walletAddress}</p>
      </div>
      
      {connectionStatus === ConnectionStatus.CONNECTED ? (
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-500">Current Balance:</p>
            {balance ? (
              <span className={`font-bold ${getChangeClasses()}`}>{balance}</span>
            ) : (
              <span className="text-sm italic">Waiting for updates...</span>
            )}
          </div>
          
          {lastUpdate && (
            <div className="text-xs text-gray-500 text-right">
              Last updated: {formatDate(lastUpdate)}
            </div>
          )}
          
          <button
            onClick={handleManualSubscription}
            className={`mt-4 px-4 py-2 text-sm font-medium text-white rounded ${
              isSubscribed ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe to Updates'}
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-amber-500">
            {connectionStatus === ConnectionStatus.CONNECTING || 
             connectionStatus === ConnectionStatus.RECONNECTING
              ? 'Connecting to server...'
              : 'Not connected to server'}
          </p>
          {(connectionStatus === ConnectionStatus.ERROR ||
            connectionStatus === ConnectionStatus.DISCONNECTED) && (
            <button
              onClick={() => {
                const token = localStorage.getItem('accessToken');
                if (token) realtimeService.connect(token);
              }}
              className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
            >
              Reconnect
            </button>
          )}
        </div>
      )}
      
      {/* Show change animation if enabled */}
      {showChangeAnimation && previousBalance && (
        <div 
          className={`absolute top-0 left-0 ml-4 transition-all ${
            changeType === 'increase' 
              ? 'text-green-500 -translate-y-4 opacity-0' 
              : 'text-red-500 translate-y-4 opacity-0'
          }`}
          style={{ animation: 'fadeOutUp 1.5s ease-out' }}
        >
          {changeType === 'increase' ? '+' : '-'}
          {Math.abs(parseFloat(balance) - parseFloat(previousBalance)).toFixed(6)}
        </div>
      )}
    </div>
  );
};

// Add TypeScript definition for the unsubscribe function
declare global {
  interface Window {
    __balanceUnsubscribe?: () => void;
  }
}

export default RealTimeBalance;