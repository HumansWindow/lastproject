import React, { useEffect, useState, useCallback } from 'react';
import { BalanceUpdateEvent } from "../types/api-types";
import { realtimeService } from '../services/realtime';
import WebSocketStatus from './WebSocketStatus';
import { clientOnly } from '../utils/clientOnly';

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

  const handleBalanceUpdate = useCallback((data: BalanceUpdateEvent) => {
    // Update component state with the new balance
    setBalance(data.formattedNewBalance || data.newBalance);
    setLastUpdate(new Date());
    
    // Show animation
    setShowChangeAnimation(true);
    setTimeout(() => setShowChangeAnimation(false), 3000);
  }, []);

  const subscribeToBalanceUpdates = useCallback(() => {
    if (!walletAddress) return;
    
    // Subscribe to real-time balance updates
    const channel = `balance:${walletAddress.toLowerCase()}`;
    const unsubscribe = realtimeService.subscribe(channel, handleBalanceUpdate);
    
    return unsubscribe;
  }, [walletAddress, handleBalanceUpdate]);

  useEffect(() => {
    if (walletAddress && !isSubscribed) {
      subscribeToBalanceUpdates();
    }

    return () => {
      if (window.__balanceUnsubscribe) {
        window.__balanceUnsubscribe();
        delete window.__balanceUnsubscribe;
      }
    };
  }, [walletAddress, isSubscribed, subscribeToBalanceUpdates]);

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
      
      {isSubscribed ? (
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
            Not subscribed to updates
          </p>
        </div>
      )}
      
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

declare global {
  interface Window {
    __balanceUnsubscribe?: () => void;
  }
}

export default clientOnly(RealTimeBalance);