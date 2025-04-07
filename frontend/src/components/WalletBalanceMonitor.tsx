import React, { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtime/websocket/realtime-service';
import { BalanceChangeEvent, BalanceUpdateEvent } from '../types/api-types';
import WebSocketStatus from './WebSocketStatus';

interface WalletBalanceMonitorProps {
  walletAddress: string;
  networkName?: string;
}

const WalletBalanceMonitor: React.FC<WalletBalanceMonitorProps> = ({ 
  walletAddress, 
  networkName = 'Ethereum'
}) => {
  const [currentBalance, setCurrentBalance] = useState<string>('0.0');
  const [formattedBalance, setFormattedBalance] = useState<string>('0.0 ETH');
  const [balanceChanges, setBalanceChanges] = useState<BalanceChangeEvent[]>([]);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to balance changes for the specified wallet
    const unsubscribe = realtimeService.subscribeToBalanceUpdates(
      walletAddress,
      (event: BalanceUpdateEvent) => {
        // Update current balance
        setCurrentBalance(event.newBalance);
        setFormattedBalance(event.formattedNewBalance || `${event.newBalance} ETH`);
        
        // Determine if balance is increasing or decreasing
        const isIncrease = 
          parseFloat(event.newBalance) > parseFloat(event.previousBalance);
        setIsIncreasing(isIncrease);
        
        // Add to history
        setBalanceChanges((prev: BalanceChangeEvent[]) => {
          const updatedEvent = {
            address: walletAddress,
            previousBalance: event.previousBalance,
            newBalance: event.newBalance,
            formattedNewBalance: event.formattedNewBalance,
            txHash: event.txHash,
            blockNumber: 0, // This field might not be available in BalanceUpdateEvent
            timestamp: event.timestamp,
            chainId: 1, // Default to Ethereum mainnet
            networkName: networkName,
            type: isIncrease ? 'credit' as const : 'debit' as const
          };
          const updated = [updatedEvent, ...prev].slice(0, 5);
          return updated;
        });

        // Reset direction indicator after 3 seconds
        setTimeout(() => {
          setIsIncreasing(null);
        }, 3000);
      }
    );
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [walletAddress, networkName]);

  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Wallet Balance Monitor
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatAddress(walletAddress)} on {networkName}
          </p>
        </div>
        <WebSocketStatus showDetails />
      </div>
      
      <div className="py-4 text-center">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            {formattedBalance}
          </span>
          
          {isIncreasing !== null && (
            <span className={`ml-2 text-lg ${
              isIncreasing 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {isIncreasing ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
      
      {balanceChanges.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {balanceChanges.map((change, index) => (
              <div 
                key={`${change.timestamp}-${index}`}
                className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">
                      {parseFloat(change.newBalance) > parseFloat(change.previousBalance) 
                        ? 'Received' 
                        : 'Sent'}
                    </span>
                    {change.txHash && (
                      <span className="text-xs ml-2 text-gray-500 dark:text-gray-400">
                        Tx: {formatAddress(change.txHash)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={
                      parseFloat(change.newBalance) > parseFloat(change.previousBalance)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }>
                      {parseFloat(change.newBalance) > parseFloat(change.previousBalance) ? '+' : '-'}
                      {Math.abs(
                        parseFloat(change.newBalance) - parseFloat(change.previousBalance)
                      ).toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {change.blockNumber ? `Block ${change.blockNumber}` : new Date(change.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletBalanceMonitor;